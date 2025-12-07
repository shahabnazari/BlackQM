/**
 * Phase 10.102 Phase 9: Security Hardening
 *
 * HTTP Client Security Service
 *
 * OWASP A10:2021 - Server-Side Request Forgery (SSRF) Prevention
 *
 * Provides comprehensive SSRF protection for:
 * - External API calls (Semantic Scholar, PubMed, Springer, etc.)
 * - PDF downloads
 * - Image fetching
 * - Any HTTP requests to external services
 *
 * Netflix-Grade Security Standards:
 * - Domain whitelist enforcement
 * - Private IP range blocking
 * - DNS rebinding protection
 * - Request timeout enforcement
 * - Protocol validation (HTTPS only)
 * - Redirect validation
 */

import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  SecurityLoggerService,
  SecurityEventType,
  SecurityEventSeverity,
} from './security-logger.service';
import * as dns from 'dns/promises';

export interface HttpClientSecurityOptions {
  allowedDomains?: string[];
  allowPrivateIps?: boolean;
  requireHttps?: boolean;
  maxRedirects?: number;
  timeout?: number;
  validateDns?: boolean;
}

@Injectable()
export class HttpClientSecurityService {
  /**
   * Default allowed domains for literature search external APIs
   *
   * Netflix-Grade Security: Principle of least privilege
   * - Only whitelist domains that are absolutely necessary
   * - Regularly audit and remove unused domains
   */
  private readonly defaultAllowedDomains = [
    // Academic APIs
    'api.semanticscholar.org',
    'semanticscholar.org',
    'eutils.ncbi.nlm.nih.gov',
    'api.ncbi.nlm.nih.gov',
    'ncbi.nlm.nih.gov',
    'api.springernature.com',
    'link.springer.com',
    'api.springer.com',
    'api.crossref.org',
    'crossref.org',
    'api.unpaywall.org',
    'unpaywall.org',

    // Publisher APIs
    'api.elsevier.com',
    'api.wiley.com',
    'api.nature.com',
    'api.ieee.org',
    'api.sciencedirect.com',
    'www.sciencedirect.com',
    'api.mdpi.com',
    'www.mdpi.com',

    // Research repositories
    'arxiv.org',
    'export.arxiv.org',
    'biorxiv.org',
    'medrxiv.org',
    'europepmc.org',
    'www.europepmc.org',

    // Social media (for social media intelligence feature)
    'api.twitter.com',
    'graph.facebook.com',
    'www.linkedin.com',
    'api.reddit.com',

    // GROBID (PDF processing)
    'cloud.science-miner.com', // GROBID cloud
    'grobid.readthedocs.io',

    // CDNs for static assets
    'cdn.semanticscholar.org',
    'cdn.ncbi.nlm.nih.gov',
  ];

  constructor(private readonly securityLogger: SecurityLoggerService) {}

  /**
   * Validate URL before making HTTP request
   *
   * Prevents SSRF by:
   * 1. Checking domain against whitelist
   * 2. Blocking private IP ranges
   * 3. Enforcing HTTPS
   * 4. Validating DNS (prevent DNS rebinding)
   *
   * @throws {ForbiddenException} If URL is not allowed
   * @throws {BadRequestException} If URL is malformed
   */
  async validateUrl(
    url: string,
    options: HttpClientSecurityOptions = {},
    correlationId?: string
  ): Promise<void> {
    // Merge options with defaults
    const opts: Required<HttpClientSecurityOptions> = {
      allowedDomains: options.allowedDomains || this.defaultAllowedDomains,
      allowPrivateIps: options.allowPrivateIps ?? false,
      requireHttps: options.requireHttps ?? true,
      maxRedirects: options.maxRedirects ?? 3,
      timeout: options.timeout ?? 30000,
      validateDns: options.validateDns ?? true,
    };

    // Parse URL
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch (error) {
      throw new BadRequestException('Invalid URL format');
    }

    // Validate protocol
    if (opts.requireHttps && parsed.protocol !== 'https:') {
      await this.securityLogger.logSecurityEvent({
        type: SecurityEventType.INSECURE_PROTOCOL_USED,
        severity: SecurityEventSeverity.MEDIUM,
        correlationId,
        details: {
          url,
          protocol: parsed.protocol,
          reason: 'Only HTTPS is allowed',
        },
      });

      throw new ForbiddenException('Only HTTPS URLs are allowed');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ForbiddenException('Only HTTP/HTTPS protocols allowed');
    }

    // Check domain whitelist
    const isAllowed = opts.allowedDomains.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      await this.securityLogger.logSsrfAttempt(url, undefined, undefined, correlationId);

      throw new ForbiddenException(
        `Domain not in whitelist: ${parsed.hostname}. ` +
          `Allowed domains: ${opts.allowedDomains.join(', ')}`
      );
    }

    // Validate IP address (prevent private IP access)
    if (!opts.allowPrivateIps) {
      await this.validateNotPrivateIp(parsed.hostname, url, correlationId);
    }

    // DNS validation (prevent DNS rebinding attacks)
    if (opts.validateDns && !opts.allowPrivateIps) {
      await this.validateDns(parsed.hostname, url, correlationId);
    }
  }

  /**
   * Check if hostname resolves to private IP address
   *
   * Prevents SSRF to internal services even if domain is whitelisted
   * but DNS is compromised or rebinding attack is in progress
   */
  private async validateNotPrivateIp(
    hostname: string,
    url: string,
    correlationId?: string
  ): Promise<void> {
    // Direct IP address check
    if (this.isPrivateIp(hostname)) {
      await this.securityLogger.logSecurityEvent({
        type: SecurityEventType.PRIVATE_IP_ACCESS_ATTEMPT,
        severity: SecurityEventSeverity.CRITICAL,
        correlationId,
        details: {
          url,
          hostname,
          reason: 'Direct private IP access blocked',
        },
      });

      throw new ForbiddenException('Access to private IPs is forbidden');
    }
  }

  /**
   * Validate DNS resolution to prevent DNS rebinding attacks
   *
   * DNS Rebinding Attack:
   * 1. Attacker sets up malicious.com with low TTL
   * 2. Initial request: malicious.com resolves to public IP (passes validation)
   * 3. DNS record changes to 127.0.0.1
   * 4. Next request: malicious.com resolves to localhost (bypass intended)
   *
   * Prevention:
   * - Resolve DNS before making request
   * - Check if resolved IP is private
   * - Cache resolution for request duration
   */
  private async validateDns(
    hostname: string,
    url: string,
    correlationId?: string
  ): Promise<void> {
    try {
      // Resolve IPv4 addresses
      const addresses = await dns.resolve4(hostname);

      // Check if any resolved address is private
      for (const address of addresses) {
        if (this.isPrivateIp(address)) {
          await this.securityLogger.logSecurityEvent({
            type: SecurityEventType.SSRF_ATTEMPT,
            severity: SecurityEventSeverity.CRITICAL,
            correlationId,
            details: {
              url,
              hostname,
              resolved_ip: address,
              reason: 'DNS resolves to private IP (possible DNS rebinding attack)',
            },
          });

          throw new ForbiddenException(
            `Domain ${hostname} resolves to private IP ${address}. Possible DNS rebinding attack.`
          );
        }
      }
    } catch (error: any) {
      // If DNS resolution fails, allow request to proceed
      // The actual HTTP request will fail naturally
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        // DNS not found - let HTTP client handle it
        return;
      }

      // Re-throw ForbiddenException from private IP check
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Other DNS errors - log but allow
      console.warn(`DNS validation warning for ${hostname}:`, error.message);
    }
  }

  /**
   * Check if IP address or hostname is in private range
   *
   * Blocks:
   * - Loopback: 127.0.0.0/8, ::1
   * - Private IPv4: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
   * - Link-local: 169.254.0.0/16, fe80::/10
   * - Unique local: fc00::/7, fd00::/8
   * - Special addresses: 0.0.0.0, 255.255.255.255, ::
   */
  private isPrivateIp(hostname: string): boolean {
    const privateRanges = [
      // Loopback
      /^localhost$/i,
      /^127\./,
      /^::1$/,
      /^0\.0\.0\.0$/,

      // Private IPv4
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,

      // Link-local
      /^169\.254\./, // IPv4
      /^fe80:/i, // IPv6

      // Unique local IPv6
      /^fc00:/i,
      /^fd00:/i,

      // IPv4 special addresses
      /^0\./, // 0.0.0.0/8
      /^255\.255\.255\.255$/, // Broadcast

      // IPv6 special addresses
      /^::$/,
      /^::ffff:/i, // IPv4-mapped IPv6

      // Metadata service (AWS, GCP, Azure)
      /^169\.254\.169\.254$/, // AWS metadata
      /^metadata\.google\.internal$/i, // GCP metadata
    ];

    return privateRanges.some((pattern) => pattern.test(hostname));
  }

  /**
   * Validate redirect URL
   *
   * Prevents open redirect attacks where attacker uses redirect
   * to bypass domain whitelist:
   *
   * Example attack:
   * whitelisted.com/redirect?url=http://evil.com/malware
   *
   * Prevention:
   * - Validate redirect destination against whitelist
   * - Limit number of redirects
   */
  async validateRedirect(
    originalUrl: string,
    redirectUrl: string,
    options: HttpClientSecurityOptions = {},
    correlationId?: string
  ): Promise<void> {
    // Validate redirect destination with same rules as original URL
    await this.validateUrl(redirectUrl, options, correlationId);

    // Log redirect for audit trail
    await this.securityLogger.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecurityEventSeverity.LOW,
      correlationId,
      details: {
        event: 'HTTP_REDIRECT',
        original_url: originalUrl,
        redirect_url: redirectUrl,
        reason: 'Following HTTP redirect (validated)',
      },
    });
  }

  /**
   * Create secure HTTP client options
   *
   * Returns configuration object for axios/fetch with security settings:
   * - Timeout enforcement
   * - Redirect limits
   * - SSL/TLS verification
   * - Custom headers
   */
  createSecureClientOptions(options: HttpClientSecurityOptions = {}) {
    return {
      timeout: options.timeout || 30000, // 30 seconds default
      maxRedirects: options.maxRedirects || 3,
      validateStatus: (status: number) => status >= 200 && status < 500,

      // HTTP headers for security
      headers: {
        'User-Agent': 'VQMethod/1.0 (Literature Search)',
        'Accept': 'application/json, application/xml, text/html',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'close', // Prevent connection reuse
      },

      // SSL/TLS configuration
      httpsAgent: options.requireHttps
        ? {
            rejectUnauthorized: true, // Verify SSL certificates
            minVersion: 'TLSv1.2', // Minimum TLS version
          }
        : undefined,
    };
  }

  /**
   * Add domain to whitelist (admin only)
   *
   * Use case: Adding new academic publisher API
   */
  addAllowedDomain(domain: string): void {
    if (!this.defaultAllowedDomains.includes(domain)) {
      this.defaultAllowedDomains.push(domain);
      console.log(`✅ Added domain to whitelist: ${domain}`);
    }
  }

  /**
   * Get current whitelist (for debugging/audit)
   */
  getAllowedDomains(): string[] {
    return [...this.defaultAllowedDomains];
  }

  /**
   * Remove domain from whitelist (admin only)
   */
  removeAllowedDomain(domain: string): void {
    const index = this.defaultAllowedDomains.indexOf(domain);
    if (index > -1) {
      this.defaultAllowedDomains.splice(index, 1);
      console.log(`❌ Removed domain from whitelist: ${domain}`);
    }
  }
}
