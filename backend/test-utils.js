#!/usr/bin/env node
/**
 * Shared Test Utilities
 * Phase 10.94 - Test Scripts Refactoring
 *
 * This file addresses critical issues found in strict audit:
 * - CRITICAL-1: Infinite redirect loop (fixed with MAX_REDIRECTS)
 * - CRITICAL-2: URL validation (fixed with protocol whitelist)
 * - CRITICAL-3: Error type safety (fixed with type guards)
 * - HIGH-1: DRY violations (eliminates 400+ lines of duplication)
 * - HIGH-2: Color codes duplication (centralized constants)
 * - HIGH-4: HTTP timeout missing (added to all requests)
 *
 * Created: 2025-11-20
 * Strict Mode: ENABLED
 */

const https = require('https');
const http = require('http');

// ============================================================================
// CONSTANTS (Eliminates Magic Numbers)
// ============================================================================

/**
 * ANSI color codes for terminal output
 * Centralized to eliminate duplication across test files
 */
const Colors = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  BLUE: '\x1b[34m',
  YELLOW: '\x1b[33m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

/**
 * Timeout configurations for different operations
 * All timeouts in milliseconds
 */
const Timeouts = {
  HTTP_GET: 30000,          // 30 seconds for GET requests
  HTTP_POST: 120000,        // 2 minutes for POST requests (large PDFs)
  DOWNLOAD: 60000,          // 1 minute for PDF downloads
  CORRUPTED_PDF: 10000,     // 10 seconds for error cases
  PERFORMANCE_TARGET: 1000, // 1 second performance threshold
};

/**
 * Test thresholds and quality metrics
 */
const TestThresholds = {
  KEYWORD_MATCH_MIN: 0.6,       // 60% of keywords must match
  PDF_PARSE_COVERAGE: 0.15,     // pdf-parse extracts ~15% of content
  MIN_PASS_RATE: 0.80,          // 80% of tests must pass
  IMPROVEMENT_TARGET_MIN: 6,    // Minimum 6x improvement
  IMPROVEMENT_TARGET_MAX: 10,   // Target 6-10x improvement
  MAX_REDIRECTS: 5,             // Maximum HTTP redirects to follow
};

/**
 * Exit codes for process termination
 */
const ExitCodes = {
  SUCCESS: 0,
  FAILURE: 1,
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Type-safe error message extraction
 * Fixes CRITICAL-3: Error type safety missing
 *
 * @param {any} error - Error object (could be Error, string, number, or anything)
 * @returns {string} Error message
 */
function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return String(error);
}

/**
 * Type-safe error stack extraction
 *
 * @param {any} error - Error object
 * @returns {string | undefined} Stack trace if available
 */
function getErrorStack(error) {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return undefined;
}

// ============================================================================
// URL VALIDATION (Security)
// ============================================================================

/**
 * Validates URL for security
 * Fixes CRITICAL-2: URL validation missing
 *
 * Ensures:
 * - Only HTTP/HTTPS protocols allowed
 * - No access to localhost/private networks in production
 * - Prevents file:// and other protocol exploits
 *
 * @param {string} url - URL to validate
 * @param {boolean} allowLocalhost - Allow localhost access (for testing)
 * @throws {Error} If URL is invalid or blocked
 * @returns {URL} Validated URL object
 */
function validateUrl(url, allowLocalhost = true) {
  let urlObj;

  try {
    urlObj = new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${getErrorMessage(error)}`);
  }

  // Only allow HTTP and HTTPS protocols
  if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
    throw new Error(
      `Invalid protocol: ${urlObj.protocol}. Only HTTP and HTTPS are allowed.`
    );
  }

  // Block access to local/private networks (unless explicitly allowed)
  if (!allowLocalhost) {
    const hostname = urlObj.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      throw new Error('Access to localhost is not allowed');
    }

    // Block private IP ranges (RFC 1918)
    if (hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      throw new Error('Access to private IP addresses is not allowed');
    }

    // Block link-local addresses
    if (hostname.startsWith('169.254.')) {
      throw new Error('Access to link-local addresses is not allowed');
    }

    // Block 0.0.0.0
    if (hostname === '0.0.0.0') {
      throw new Error('Access to 0.0.0.0 is not allowed');
    }
  }

  return urlObj;
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

/**
 * HTTP client with built-in security and error handling
 * Eliminates ~150 lines of duplicated code across test files
 */
class TestHttpClient {
  /**
   * Performs HTTP GET request with timeout and error handling
   * Fixes HIGH-4: No HTTP timeout on GET requests
   *
   * @param {string} url - URL to fetch
   * @param {object} options - Request options
   * @param {number} options.timeout - Request timeout in ms (default: 30000)
   * @param {boolean} options.allowLocalhost - Allow localhost access (default: true)
   * @returns {Promise<{status: number, data: string, headers: object}>}
   */
  static async get(url, options = {}) {
    const timeout = options.timeout || Timeouts.HTTP_GET;
    const allowLocalhost = options.allowLocalhost !== undefined ? options.allowLocalhost : true;

    // Validate URL (CRITICAL-2 fix)
    const urlObj = validateUrl(url, allowLocalhost);

    return new Promise((resolve, reject) => {
      const protocol = urlObj.protocol === 'https:' ? https : http;

      // Set timeout (HIGH-4 fix)
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      const req = protocol.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          clearTimeout(timeoutHandle);
          resolve({
            status: res.statusCode,
            data,
            headers: res.headers
          });
        });
      });

      req.on('error', (err) => {
        clearTimeout(timeoutHandle);
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        clearTimeout(timeoutHandle);
        reject(new Error(`Request timeout after ${timeout}ms`));
      });
    });
  }

  /**
   * Performs HTTP POST request with FormData
   *
   * @param {string} url - URL to post to
   * @param {FormData} formData - Form data to send
   * @param {object} options - Request options
   * @param {number} options.timeout - Request timeout in ms (default: 120000)
   * @param {boolean} options.allowLocalhost - Allow localhost access (default: true)
   * @returns {Promise<{status: number, data: string}>}
   */
  static async post(url, formData, options = {}) {
    const timeout = options.timeout || Timeouts.HTTP_POST;
    const allowLocalhost = options.allowLocalhost !== undefined ? options.allowLocalhost : true;

    // Validate URL (CRITICAL-2 fix)
    const urlObj = validateUrl(url, allowLocalhost);

    return new Promise((resolve, reject) => {
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: formData.getHeaders(),
        timeout,
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      formData.pipe(req);
    });
  }

  /**
   * Download file from URL with redirect handling
   * Fixes CRITICAL-1: Infinite redirect loop vulnerability
   *
   * @param {string} url - URL to download from
   * @param {object} options - Download options
   * @param {number} options.timeout - Download timeout in ms (default: 60000)
   * @param {number} options.redirectCount - Current redirect count (internal)
   * @param {boolean} options.allowLocalhost - Allow localhost access (default: true)
   * @returns {Promise<Buffer>} Downloaded file as buffer
   */
  static async download(url, options = {}) {
    const timeout = options.timeout || Timeouts.DOWNLOAD;
    const redirectCount = options.redirectCount || 0;
    const allowLocalhost = options.allowLocalhost !== undefined ? options.allowLocalhost : true;

    // CRITICAL-1 FIX: Prevent infinite redirect loop
    if (redirectCount > TestThresholds.MAX_REDIRECTS) {
      throw new Error(
        `Too many redirects (>${TestThresholds.MAX_REDIRECTS})`
      );
    }

    // CRITICAL-2 FIX: Validate URL
    const urlObj = validateUrl(url, allowLocalhost);

    return new Promise((resolve, reject) => {
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Download timeout after ${timeout}ms`));
      }, timeout);

      const req = protocol.get(
        url,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Test Script)' } },
        (res) => {
          // Handle redirects (CRITICAL-1 fix: with max count)
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            clearTimeout(timeoutHandle);

            const redirectUrl = res.headers.location;

            // Validate redirect URL
            if (!redirectUrl) {
              reject(new Error('Redirect location header missing'));
              return;
            }

            // Handle relative redirect URLs by resolving against base
            let absoluteRedirectUrl;
            try {
              // If redirectUrl is relative, resolve it against the original URL
              absoluteRedirectUrl = new URL(redirectUrl, url).href;
            } catch (urlError) {
              reject(new Error(`Invalid redirect URL: ${redirectUrl}`));
              return;
            }

            // Recursively follow redirect with incremented count
            TestHttpClient.download(absoluteRedirectUrl, {
              timeout,
              redirectCount: redirectCount + 1,
              allowLocalhost
            })
              .then(resolve)
              .catch(reject);

            return;
          }

          if (res.statusCode !== 200) {
            clearTimeout(timeoutHandle);
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }

          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            clearTimeout(timeoutHandle);
            resolve(Buffer.concat(chunks));
          });
        }
      );

      req.on('error', (err) => {
        clearTimeout(timeoutHandle);
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        clearTimeout(timeoutHandle);
        reject(new Error(`Download timeout after ${timeout}ms`));
      });
    });
  }
}

// ============================================================================
// PDF GENERATION UTILITIES
// ============================================================================

/**
 * PDF generator with proper length calculation
 * Fixes HIGH-3: PDF Content Length incorrect
 * Eliminates ~80 lines of duplicated code
 */
class PDFGenerator {
  /**
   * Creates a minimal test PDF with correct /Length field
   *
   * @param {string} text - Text content for PDF
   * @returns {Buffer} PDF file as buffer
   */
  static createMinimal(text = 'Hello World') {
    // PostScript content
    const streamContent = `BT
/F1 12 Tf
100 700 Td
(${text}) Tj
ET`;

    // HIGH-3 FIX: Calculate actual length instead of hardcoding
    const actualLength = streamContent.length;

    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length ${actualLength}
>>
stream
${streamContent}
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
422
%%EOF`;

    return Buffer.from(pdfContent);
  }

  /**
   * Creates a test PDF with research content
   *
   * @param {string} content - Research text content
   * @returns {Buffer} PDF file as buffer
   */
  static createResearchPDF(content = 'This is a test PDF document for GROBID integration testing. Machine learning and artificial intelligence are transforming research.') {
    return PDFGenerator.createMinimal(content);
  }

  /**
   * Creates an empty PDF (for edge case testing)
   *
   * @returns {Buffer} Empty PDF
   */
  static createEmpty() {
    return Buffer.from('%PDF-1.4\n%%EOF');
  }

  /**
   * Creates corrupted PDF data (for error testing)
   *
   * @returns {Buffer} Invalid PDF data
   */
  static createCorrupted() {
    return Buffer.from('This is not a valid PDF file at all!');
  }
}

// ============================================================================
// WORD COUNTING UTILITY
// ============================================================================

/**
 * Consistent word counting across all tests
 * Fixes MEDIUM-9: Word count calculation inconsistent
 *
 * @param {string} text - Text to count words in
 * @returns {number} Word count
 */
function countWords(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// ============================================================================
// DEPENDENCY VALIDATION
// ============================================================================

/**
 * Validates that required npm packages are installed
 * Fixes HIGH-5: Missing dependency validation
 *
 * @param {string[]} dependencies - Array of package names
 * @throws {Error} If any dependency is missing
 */
function validateDependencies(dependencies) {
  const missing = [];

  for (const dep of dependencies) {
    try {
      require.resolve(dep);
    } catch (error) {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing dependencies: ${missing.join(', ')}\n` +
      `Run: npm install ${missing.join(' ')}`
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Constants
  Colors,
  Timeouts,
  TestThresholds,
  ExitCodes,

  // Utilities
  getErrorMessage,
  getErrorStack,
  validateUrl,
  countWords,
  validateDependencies,

  // Classes
  TestHttpClient,
  PDFGenerator,
};
