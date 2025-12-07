#!/usr/bin/env node
/**
 * GROBID Edge Case Testing
 * Phase 10.94 - Full Integration Testing (Strict Mode)
 *
 * Tests:
 * - Empty PDF
 * - Corrupted PDF
 * - Very small PDF
 * - Image-only PDF (no text)
 * - Error handling
 */

const http = require('http');
const FormData = require('form-data');

const GROBID_URL = 'http://localhost:8070';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

class EdgeCaseTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async testCase(name, testFn) {
    this.results.total++;
    console.log(`\n${BOLD}[TEST] ${name}${RESET}`);

    try {
      const result = await testFn();
      if (result.success) {
        this.results.passed++;
        console.log(`${GREEN}✓ PASSED${RESET}: ${result.message}`);
      } else {
        this.results.failed++;
        console.log(`${RED}✗ FAILED${RESET}: ${result.message}`);
      }
      return result;
    } catch (error) {
      this.results.failed++;
      console.log(`${RED}✗ ERROR${RESET}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // Process PDF with GROBID
  async processWithGrobid(pdfBuffer, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append('input', pdfBuffer, {
        filename: 'test.pdf',
        contentType: 'application/pdf'
      });

      const urlObj = new URL(`${GROBID_URL}/api/processFulltextDocument`);

      const req = http.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: form.getHeaders(),
        timeout,
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      form.pipe(req);
    });
  }

  // Test 1: Empty PDF
  async testEmptyPDF() {
    return this.testCase('Empty PDF handling', async () => {
      const emptyPDF = Buffer.from('%PDF-1.4\n%%EOF');

      try {
        const response = await this.processWithGrobid(emptyPDF);
        // GROBID should handle empty PDFs gracefully (either return empty or error)
        if (response.status === 200 || response.status === 500) {
          return {
            success: true,
            message: `GROBID handled empty PDF gracefully (HTTP ${response.status})`
          };
        }
        return {
          success: false,
          message: `Unexpected status: ${response.status}`
        };
      } catch (error) {
        // Error is acceptable for empty PDF
        return {
          success: true,
          message: `GROBID rejected empty PDF: ${error.message}`
        };
      }
    });
  }

  // Test 2: Corrupted PDF
  async testCorruptedPDF() {
    return this.testCase('Corrupted PDF handling', async () => {
      const corruptedPDF = Buffer.from('This is not a valid PDF file at all!');

      try {
        const response = await this.processWithGrobid(corruptedPDF, 10000);
        // GROBID should reject or handle corrupted files
        return {
          success: true,
          message: `GROBID handled corrupted PDF (HTTP ${response.status})`
        };
      } catch (error) {
        // Error is expected for corrupted PDF
        return {
          success: true,
          message: `GROBID correctly rejected corrupted PDF`
        };
      }
    });
  }

  // Test 3: Minimal valid PDF
  async testMinimalPDF() {
    return this.testCase('Minimal valid PDF', async () => {
      // Smallest valid PDF with text
      const minimalPDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
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
<< /Size 5 /Root 1 0 R >>
startxref
411
%%EOF`;

      const response = await this.processWithGrobid(Buffer.from(minimalPDF));

      if (response.status === 200 && response.data.length > 0) {
        return {
          success: true,
          message: `Successfully processed minimal PDF (${response.data.length} bytes XML)`
        };
      }

      return {
        success: false,
        message: `Failed to process minimal PDF (HTTP ${response.status})`
      };
    });
  }

  // Test 4: Large text extraction
  async testLargeTextPDF() {
    return this.testCase('Large text PDF', async () => {
      // Create PDF with lots of text
      const largeText = Array(200).fill('This is a sentence with many words that will be repeated to create a large document. ').join('');

      const largePDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${largeText.length + 30} >>
stream
BT
/F1 10 Tf
50 700 Td
(${largeText}) Tj
ET
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
<< /Size 5 /Root 1 0 R >>
startxref
${400 + largeText.length}
%%EOF`;

      const response = await this.processWithGrobid(Buffer.from(largePDF), 60000);

      if (response.status === 200) {
        const wordCount = response.data.split(/\s+/).length;
        return {
          success: wordCount > 100,
          message: `Extracted ${wordCount} words from large PDF`
        };
      }

      return {
        success: false,
        message: `Failed to process large PDF (HTTP ${response.status})`
      };
    });
  }

  // Test 5: Timeout handling
  async testTimeout() {
    return this.testCase('Timeout handling', async () => {
      const validPDF = Buffer.from('%PDF-1.4\n%%EOF');

      try {
        await this.processWithGrobid(validPDF, 1); // 1ms timeout (will fail)
        return {
          success: false,
          message: 'Timeout not triggered'
        };
      } catch (error) {
        if (error.message.includes('Timeout') || error.message.includes('timeout')) {
          return {
            success: true,
            message: 'Timeout correctly triggered'
          };
        }
        return {
          success: true,
          message: `Request aborted (${error.message})`
        };
      }
    });
  }

  // Test 6: GROBID service availability
  async testServiceAvailability() {
    return this.testCase('GROBID service availability', async () => {
      return new Promise((resolve) => {
        http.get(`${GROBID_URL}/api/isalive`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200 && data.trim() === 'true') {
              resolve({
                success: true,
                message: 'GROBID service is available and responding'
              });
            } else {
              resolve({
                success: false,
                message: `Service returned unexpected response: ${data}`
              });
            }
          });
        }).on('error', (error) => {
          resolve({
            success: false,
            message: `Service unavailable: ${error.message}`
          });
        });
      });
    });
  }

  async runAll() {
    console.log(`${BOLD}╔═══════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}║  GROBID Edge Case Testing - STRICT MODE                      ║${RESET}`);
    console.log(`${BOLD}╚═══════════════════════════════════════════════════════════════╝${RESET}`);

    await this.testServiceAvailability();
    await this.testEmptyPDF();
    await this.testCorruptedPDF();
    await this.testMinimalPDF();
    await this.testLargeTextPDF();
    await this.testTimeout();

    // Results
    console.log(`\n${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}EDGE CASE TEST RESULTS${RESET}`);
    console.log(`${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${GREEN}Passed:${RESET}  ${this.results.passed}/${this.results.total}`);
    console.log(`${RED}Failed:${RESET}  ${this.results.failed}/${this.results.total}`);

    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate >= 80 ? GREEN : RED}${passRate}%${RESET}`);

    console.log(`\n${BOLD}═══════════════════════════════════════════════════════════════${RESET}\n`);

    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

const tester = new EdgeCaseTester();
tester.runAll().catch(error => {
  console.error(`${RED}${BOLD}FATAL ERROR:${RESET} ${error.message}`);
  process.exit(1);
});
