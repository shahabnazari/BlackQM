# Phase 10.102 Phase 9: Security Hardening - Implementation Plan

**Date**: December 2, 2025
**Status**: 🚀 READY TO IMPLEMENT
**Priority**: 🔴 CRITICAL (Required before production)
**Quality Standard**: Netflix-Grade Security

---

## 🎯 EXECUTIVE SUMMARY

### Current Security Posture

**ALREADY IMPLEMENTED** ✅:
1. Helmet security headers (production)
2. CORS configuration (environment-based)
3. Global validation pipe (whitelist, forbidNonWhitelisted)
4. Rate limiting infrastructure
5. Compression & cookie parser
6. Sentry error tracking
7. Monitoring & observability (Prometheus)
8. Authentication (Bearer tokens)
9. Body size limits (50MB)
10. Graceful shutdown handlers

**Security Score**: 60/100 (Good foundation, missing critical hardening)

---

### Gap Analysis - Netflix-Grade Security Requirements

| Category | Current | Required | Gap |
|----------|---------|----------|-----|
| **OWASP Top 10 Coverage** | 40% | 100% | 🔴 HIGH |
| **Vulnerability Scanning** | None | Automated | 🔴 HIGH |
| **Secrets Management** | .env files | Vault/AWS | 🔴 HIGH |
| **Input Sanitization** | Basic | Comprehensive | 🟡 MEDIUM |
| **Security Logging** | Partial | Complete | 🟡 MEDIUM |
| **DDoS Protection** | Rate limiting | Multi-layer | 🟡 MEDIUM |
| **Encryption at Rest** | Not documented | Documented | 🟢 LOW |
| **CSRF Protection** | None | Enabled | 🔴 HIGH |
| **Security Headers** | Good | Excellent | 🟢 LOW |
| **Audit Trail** | Partial | Complete | 🟡 MEDIUM |
| **Dependency Scanning** | Manual | Automated | 🔴 HIGH |
| **Incident Response** | None | Playbooks | 🟡 MEDIUM |

---

## 📋 IMPLEMENTATION PHASES

### Phase 9.1: OWASP Top 10 Protection (4 hours)

**Priority**: 🔴 CRITICAL

**Scope**:
1. A01:2021 - Broken Access Control
2. A02:2021 - Cryptographic Failures
3. A03:2021 - Injection
4. A04:2021 - Insecure Design
5. A05:2021 - Security Misconfiguration
6. A06:2021 - Vulnerable and Outdated Components
7. A07:2021 - Identification and Authentication Failures
8. A08:2021 - Software and Data Integrity Failures
9. A09:2021 - Security Logging and Monitoring Failures
10. A10:2021 - Server-Side Request Forgery (SSRF)

**Deliverables**:
- SQL injection prevention (Prisma parameterization audit)
- XSS prevention (input sanitization service)
- CSRF protection (tokens for state-changing operations)
- Secure authentication audit
- Authorization middleware enhancement
- Security logging service
- SSRF protection for external API calls

---

### Phase 9.2: Automated Security Scanning (2 hours)

**Priority**: 🔴 CRITICAL

**Scope**:
1. npm audit integration (CI/CD)
2. Snyk vulnerability scanning
3. OWASP Dependency-Check
4. CodeQL security analysis (GitHub)
5. Trivy container scanning (already in CI/CD ✅)

**Deliverables**:
- Security scanning GitHub Actions workflow
- Pre-commit hooks for dependency check
- Weekly automated scans
- Security vulnerability dashboard
- Automated PR creation for security updates

---

### Phase 9.3: Secrets Management (3 hours)

**Priority**: 🔴 CRITICAL

**Scope**:
1. Migrate from .env to secure vault
2. API key rotation mechanism
3. Database credential rotation
4. JWT secret rotation
5. Encryption key management

**Deliverables**:
- AWS Secrets Manager integration (OR HashiCorp Vault)
- Secrets rotation service
- Environment-specific secret management
- Secrets access logging
- Emergency secret revocation procedure

---

### Phase 9.4: Enhanced Input Sanitization (2 hours)

**Priority**: 🟡 HIGH

**Scope**:
1. SQL injection prevention (audit Prisma usage)
2. XSS prevention (sanitize HTML inputs)
3. Command injection prevention
4. Path traversal prevention
5. XML injection prevention
6. LDAP injection prevention

**Deliverables**:
- Input sanitization service
- Validation decorator enhancements
- Prisma query audit
- HTML sanitizer integration (DOMPurify backend)
- Path validation utilities

---

### Phase 9.5: Security Logging & Audit Trails (2 hours)

**Priority**: 🟡 HIGH

**Scope**:
1. Security event logging
2. Failed authentication attempts
3. Authorization failures
4. Suspicious activity detection
5. Audit trail for sensitive operations

**Deliverables**:
- Security logger service
- Audit trail middleware
- Failed login tracking
- Anomaly detection alerts
- Security dashboard integration

---

### Phase 9.6: DDoS Protection (1 hour)

**Priority**: 🟡 MEDIUM

**Scope**:
1. Enhanced rate limiting (per-user, per-IP)
2. Request size validation
3. Slowloris protection
4. Connection limits
5. CloudFlare integration guide

**Deliverables**:
- Enhanced rate limiting service
- Request validation middleware
- Connection pooling limits
- DDoS mitigation guide

---

### Phase 9.7: Security Headers Audit (1 hour)

**Priority**: 🟢 LOW

**Scope**:
1. Helmet configuration review
2. CSP refinement
3. HSTS enforcement
4. X-Frame-Options
5. Referrer-Policy

**Deliverables**:
- Updated Helmet configuration
- Security headers test suite
- A+ rating on securityheaders.com

---

### Phase 9.8: Penetration Testing & Compliance (3 hours)

**Priority**: 🔴 CRITICAL

**Scope**:
1. OWASP ZAP automated scan
2. Burp Suite testing
3. Manual penetration testing
4. Security compliance checklist
5. Vulnerability remediation

**Deliverables**:
- Pen testing report
- Vulnerability remediation plan
- Security compliance certification
- Security README documentation

---

## 🏗️ IMPLEMENTATION ROADMAP

### Day 1 (8 hours)
- **Morning (4h)**: Phase 9.1 - OWASP Top 10 Protection
- **Afternoon (4h)**: Phase 9.2 - Automated Security Scanning + Phase 9.3 Start

### Day 2 (8 hours)
- **Morning (3h)**: Phase 9.3 - Secrets Management (Complete)
- **Afternoon (5h)**: Phase 9.4 - Input Sanitization + Phase 9.5 - Security Logging

### Day 3 (4 hours)
- **Morning (2h)**: Phase 9.6 - DDoS Protection + Phase 9.7 - Security Headers
- **Afternoon (2h)**: Phase 9.8 - Penetration Testing (Start)

### Day 4 (3 hours)
- **All Day**: Phase 9.8 - Penetration Testing (Complete) + Remediation

**Total Duration**: 23 hours (3 days)

---

## 📊 SUCCESS CRITERIA

### Security Metrics

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| OWASP Top 10 Coverage | 40% | 100% | 🔴 CRITICAL |
| Security Headers Score | B | A+ | 🟡 HIGH |
| Dependency Vulnerabilities | Unknown | 0 Critical/High | 🔴 CRITICAL |
| Failed Auth Attempts Logged | No | Yes | 🔴 CRITICAL |
| Secrets in Code | .env files | 0 | 🔴 CRITICAL |
| Input Sanitization | Basic | Comprehensive | 🟡 HIGH |
| Security Audit Trail | Partial | Complete | 🟡 HIGH |
| Automated Scanning | None | Daily | 🔴 CRITICAL |
| Incident Response Time | Unknown | < 1 hour | 🟡 HIGH |
| Security Documentation | Minimal | Complete | 🟡 HIGH |

### Production Readiness Gate

**Minimum Requirements** (All must be ✅):
- ✅ 0 critical/high vulnerabilities in dependencies
- ✅ OWASP Top 10 100% coverage
- ✅ Secrets managed in vault (no .env in production)
- ✅ Security logging enabled
- ✅ Rate limiting per-user implemented
- ✅ Input sanitization comprehensive
- ✅ Pen testing completed with all critical issues resolved
- ✅ Security headers A+ rating
- ✅ Automated security scanning in CI/CD
- ✅ Incident response playbook documented

---

## 🔧 TECHNICAL IMPLEMENTATION

### Phase 9.1: OWASP Top 10 Protection

#### A01: Broken Access Control

**Files to Create**:
1. `backend/src/common/guards/authorization.guard.ts`
2. `backend/src/common/decorators/require-permission.decorator.ts`
3. `backend/src/common/services/authorization.service.ts`

**Features**:
- Role-based access control (RBAC)
- Resource-level permissions
- Ownership verification
- Permission inheritance

**Example**:
```typescript
@Post('/papers/:id/delete')
@RequirePermission('papers:delete')
@RequireOwnership('papers')
async deletePaper(@Param('id') id: string, @User() user: AuthUser) {
  // Authorization guard verifies:
  // 1. User has 'papers:delete' permission
  // 2. User owns the paper (or is admin)
  return this.papersService.delete(id, user.id);
}
```

---

#### A03: Injection

**Files to Create**:
1. `backend/src/common/services/input-sanitization.service.ts`
2. `backend/src/common/pipes/sanitize.pipe.ts`
3. `backend/src/common/validators/safe-string.validator.ts`

**Features**:
- SQL injection prevention (Prisma audit)
- XSS prevention (HTML sanitization)
- Command injection prevention
- Path traversal prevention

**Example**:
```typescript
@Injectable()
export class InputSanitizationService {
  // Remove HTML tags and dangerous characters
  sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  }

  // Prevent path traversal
  sanitizePath(path: string): string {
    const normalized = path.replace(/\.\./g, '').replace(/\/+/g, '/');
    if (normalized.includes('..')) {
      throw new BadRequestException('Invalid path');
    }
    return normalized;
  }

  // Prevent command injection
  sanitizeCommand(command: string): string {
    const dangerous = /[;&|`$(){}[\]<>]/g;
    if (dangerous.test(command)) {
      throw new BadRequestException('Invalid command');
    }
    return command;
  }
}
```

---

#### A05: Security Misconfiguration

**Files to Modify**:
1. `backend/src/main.ts` (enhance Helmet config)
2. `backend/src/common/middleware/security.middleware.ts`

**Features**:
- Strict CSP policy
- Remove unnecessary HTTP methods
- Disable directory listing
- Remove server version headers
- Secure cookie attributes

**Example**:
```typescript
// Enhanced Helmet Configuration
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // No 'unsafe-inline'
      styleSrc: ["'self'"], // No 'unsafe-inline'
      imgSrc: ["'self'", 'data:', 'https://cdn.vqmethod.com'],
      connectSrc: ["'self'", 'https://api.vqmethod.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
})
```

---

#### A07: Identification and Authentication Failures

**Files to Create**:
1. `backend/src/modules/auth/services/authentication-security.service.ts`
2. `backend/src/modules/auth/guards/brute-force.guard.ts`

**Features**:
- Failed login attempt tracking
- Account lockout after N failures
- Multi-factor authentication (MFA) support
- Password complexity enforcement
- Session timeout enforcement
- Secure password reset flow

**Example**:
```typescript
@Injectable()
export class AuthenticationSecurityService {
  private failedAttempts = new Map<string, number>();
  private lockouts = new Map<string, Date>();

  async trackFailedLogin(email: string): Promise<void> {
    const attempts = (this.failedAttempts.get(email) || 0) + 1;
    this.failedAttempts.set(email, attempts);

    // Lock account after 5 failed attempts
    if (attempts >= 5) {
      this.lockouts.set(email, new Date(Date.now() + 15 * 60 * 1000)); // 15 min lockout
      await this.notifySecurityTeam('Account locked', { email, attempts });
    }
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const lockoutUntil = this.lockouts.get(email);
    if (!lockoutUntil) return false;

    if (new Date() > lockoutUntil) {
      this.lockouts.delete(email);
      this.failedAttempts.delete(email);
      return false;
    }

    return true;
  }
}
```

---

#### A09: Security Logging and Monitoring Failures

**Files to Create**:
1. `backend/src/common/services/security-logger.service.ts`
2. `backend/src/common/interceptors/security-audit.interceptor.ts`

**Features**:
- Security event logging
- Failed authentication tracking
- Authorization failure logging
- Suspicious activity detection
- Real-time security alerts

**Example**:
```typescript
@Injectable()
export class SecurityLoggerService {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      correlationId: event.correlationId,
    };

    // Log to structured logging
    this.logger.warn('Security Event', logEntry);

    // Send to Sentry if critical
    if (event.severity === 'CRITICAL') {
      Sentry.captureMessage(`Security: ${event.type}`, {
        level: 'error',
        extra: logEntry,
      });
    }

    // Alert security team if suspicious
    if (this.isSuspicious(event)) {
      await this.alertSecurityTeam(logEntry);
    }
  }

  private isSuspicious(event: SecurityEvent): boolean {
    // Multiple failed logins from same IP
    // SQL injection attempt detected
    // Path traversal attempt
    // Unusual API call patterns
    return event.type === 'FAILED_LOGIN' && event.details.attempts > 3;
  }
}
```

---

#### A10: Server-Side Request Forgery (SSRF)

**Files to Create**:
1. `backend/src/common/services/http-client-security.service.ts`
2. `backend/src/common/validators/safe-url.validator.ts`

**Features**:
- URL whitelist validation
- Private IP range blocking
- DNS rebinding protection
- Request timeout enforcement

**Example**:
```typescript
@Injectable()
export class HttpClientSecurityService {
  private allowedDomains = [
    'api.semanticscholar.org',
    'eutils.ncbi.nlm.nih.gov',
    'api.springernature.com',
    'api.crossref.org',
  ];

  async validateUrl(url: string): Promise<void> {
    const parsed = new URL(url);

    // Block private IP ranges
    if (this.isPrivateIp(parsed.hostname)) {
      throw new ForbiddenException('Access to private IPs is forbidden');
    }

    // Check against whitelist
    const isAllowed = this.allowedDomains.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      throw new ForbiddenException('Domain not in whitelist');
    }

    // Enforce HTTPS
    if (parsed.protocol !== 'https:') {
      throw new ForbiddenException('Only HTTPS URLs are allowed');
    }
  }

  private isPrivateIp(hostname: string): boolean {
    // Check for localhost, private ranges (10.x, 172.16-31.x, 192.168.x)
    const privateRanges = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^::1$/, // IPv6 localhost
      /^fe80:/, // IPv6 link-local
    ];

    return privateRanges.some(pattern => pattern.test(hostname));
  }
}
```

---

### Phase 9.2: Automated Security Scanning

**GitHub Actions Workflow**: `.github/workflows/security-scan.yml`

```yaml
name: Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: npm audit (Backend)
        run: |
          cd backend
          npm audit --audit-level=moderate || exit 1

      - name: npm audit (Frontend)
        run: |
          cd frontend
          npm audit --audit-level=moderate || exit 1

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  codeql-analysis:
    name: CodeQL Security Analysis
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: typescript, javascript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  owasp-dependency-check:
    name: OWASP Dependency Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'vqmethod'
          path: '.'
          format: 'HTML'
          args: >
            --failOnCVSS 7
            --enableRetired

      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: dependency-check-report
          path: reports/

  security-status:
    name: Security Scan Status
    runs-on: ubuntu-latest
    needs: [dependency-scan, codeql-analysis, owasp-dependency-check]

    steps:
      - name: All Security Scans Passed
        run: echo "✅ All security scans passed"
```

---

### Phase 9.3: Secrets Management

**AWS Secrets Manager Integration**:

**File**: `backend/src/common/services/secrets.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsService implements OnModuleInit {
  private client: SecretsManagerClient;
  private cache = new Map<string, { value: any; expiresAt: number }>();

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async onModuleInit() {
    // Pre-load critical secrets on startup
    if (process.env.NODE_ENV === 'production') {
      await this.getSecret('vqmethod/database/url');
      await this.getSecret('vqmethod/jwt/secret');
      await this.getSecret('vqmethod/api-keys/openai');
    }
  }

  async getSecret(secretName: string): Promise<any> {
    // Check cache first (1 hour TTL)
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Development: Fall back to .env
    if (process.env.NODE_ENV !== 'production') {
      const envKey = secretName.replace(/\//g, '_').toUpperCase();
      return process.env[envKey];
    }

    // Production: Fetch from AWS Secrets Manager
    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      const value = JSON.parse(response.SecretString || '{}');

      // Cache for 1 hour
      this.cache.set(secretName, {
        value,
        expiresAt: Date.now() + 3600000,
      });

      return value;
    } catch (error) {
      console.error(`Failed to fetch secret: ${secretName}`, error);
      throw error;
    }
  }

  async rotateSecret(secretName: string): Promise<void> {
    // Clear cache to force refresh
    this.cache.delete(secretName);

    // Trigger rotation in AWS Secrets Manager
    // Implementation depends on secret type
  }
}
```

---

## 📚 DOCUMENTATION DELIVERABLES

1. **SECURITY_README.md** - Security overview and best practices
2. **SECURITY_AUDIT_REPORT.md** - Pen testing results and remediation
3. **INCIDENT_RESPONSE_PLAYBOOK.md** - Security incident handling
4. **SECRETS_MANAGEMENT_GUIDE.md** - How to manage secrets
5. **SECURITY_CHECKLIST.md** - Pre-deployment security checklist

---

## 🎯 POST-IMPLEMENTATION VERIFICATION

### Security Tests

```bash
# 1. npm audit (0 high/critical)
cd backend && npm audit
cd ../frontend && npm audit

# 2. OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:4000

# 3. Security headers check
curl -I https://api.vqmethod.com | grep -E "(X-|Content-Security)"

# 4. Rate limiting test
for i in {1..100}; do curl -s http://localhost:4000/api/health; done

# 5. SQL injection test (should be blocked)
curl -X POST http://localhost:4000/api/search \
  -d '{"query": "test'; DROP TABLE papers;--"}'

# 6. XSS test (should be sanitized)
curl -X POST http://localhost:4000/api/search \
  -d '{"query": "<script>alert(1)</script>"}'
```

### Success Criteria

- ✅ 0 critical/high npm audit vulnerabilities
- ✅ OWASP ZAP scan passes with 0 high/critical issues
- ✅ Security headers score: A+ on securityheaders.com
- ✅ Rate limiting blocks after configured threshold
- ✅ SQL injection attempts blocked and logged
- ✅ XSS attempts sanitized and logged
- ✅ Secrets stored in AWS Secrets Manager (production)
- ✅ Failed auth attempts logged with alerts
- ✅ All security tests passing in CI/CD

---

**Status**: 🚀 READY TO IMPLEMENT
**Next Step**: Begin Phase 9.1 (OWASP Top 10 Protection)
**Timeline**: 3-4 days (23 hours total effort)

