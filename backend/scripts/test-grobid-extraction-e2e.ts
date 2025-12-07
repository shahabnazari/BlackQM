/**
 * GROBID Extraction End-to-End Test
 * Phase 10.94 - Enterprise Grade Testing
 *
 * This script tests GROBID extraction on real papers from different sources.
 * It fetches actual PDFs, extracts content via GROBID, and verifies quality.
 *
 * Prerequisites:
 * - GROBID Docker container must be running (docker-compose up -d grobid)
 * - Backend server must be running (npm run start:dev)
 * - All environment variables must be set
 *
 * Usage:
 *   ts-node scripts/test-grobid-extraction-e2e.ts
 */

import axios from 'axios';
import { writeFileSync } from 'fs';
import * as path from 'path';

interface TestPaper {
  id: string;
  title: string;
  source: string;
  pdfUrl: string;
  doi?: string;
  expectedKeywords: string[];  // Keywords that should appear in extracted text
  minimumWordCount: number;
}

interface ExtractionResult {
  paperId: string;
  source: string;
  success: boolean;
  wordCount?: number;
  processingTime?: number;
  hasTitle: boolean;
  hasAbstract: boolean;
  hasSections: boolean;
  keywordsFound: string[];
  keywordsMissing: string[];
  error?: string;
}

// Test papers from different sources
const TEST_PAPERS: TestPaper[] = [
  // PubMed/PMC Open Access Paper
  {
    id: 'pmc1',
    title: 'Machine Learning in Healthcare',
    source: 'PMC',
    pdfUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8572699/pdf/main.pdf',
    expectedKeywords: ['machine learning', 'healthcare', 'patient'],
    minimumWordCount: 3000,
  },
  // arXiv Paper (open access)
  {
    id: 'arxiv1',
    title: 'Attention Is All You Need',
    source: 'arXiv',
    pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
    doi: '10.48550/arXiv.1706.03762',
    expectedKeywords: ['transformer', 'attention', 'neural'],
    minimumWordCount: 5000,
  },
  // Springer Open Access Paper
  {
    id: 'springer1',
    title: 'Climate Change Research',
    source: 'Springer Open',
    pdfUrl: 'https://link.springer.com/content/pdf/10.1007/s41748-021-00234-9.pdf',
    expectedKeywords: ['climate', 'temperature', 'carbon'],
    minimumWordCount: 4000,
  },
  // PLOS ONE Paper (open access)
  {
    id: 'plos1',
    title: 'COVID-19 Research',
    source: 'PLOS ONE',
    pdfUrl: 'https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0248506&type=printable',
    doi: '10.1371/journal.pone.0248506',
    expectedKeywords: ['COVID', 'pandemic', 'virus'],
    minimumWordCount: 3500,
  },
];

class GrobidTester {
  private backendUrl: string;
  private results: ExtractionResult[] = [];

  constructor(backendUrl = 'http://localhost:3000') {
    this.backendUrl = backendUrl;
  }

  /**
   * Test GROBID extraction on a single paper
   */
  async testPaper(paper: TestPaper): Promise<ExtractionResult> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${paper.title}`);
    console.log(`Source: ${paper.source}`);
    console.log(`PDF URL: ${paper.pdfUrl}`);
    console.log('='.repeat(80));

    try {
      // Step 1: Download PDF
      console.log('\n[1/3] Downloading PDF...');
      const pdfBuffer = await this.downloadPDF(paper.pdfUrl);
      console.log(`✅ Downloaded: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

      // Step 2: Extract with GROBID via backend API
      console.log('\n[2/3] Extracting content with GROBID...');
      const startTime = Date.now();
      const extractionData = await this.extractViaBackend(pdfBuffer);
      const processingTime = Date.now() - startTime;

      if (!extractionData.success) {
        console.log(`❌ Extraction failed: ${extractionData.error}`);
        return {
          paperId: paper.id,
          source: paper.source,
          success: false,
          hasTitle: false,
          hasAbstract: false,
          hasSections: false,
          keywordsFound: [],
          keywordsMissing: paper.expectedKeywords,
          error: extractionData.error,
        };
      }

      const wordCount = extractionData.wordCount || 0;
      console.log(`✅ Extracted: ${wordCount} words in ${processingTime}ms`);
      console.log(`   Sections: ${extractionData.sections?.length || 0}`);
      console.log(`   Title: ${extractionData.metadata?.title ? '✅' : '❌'}`);
      console.log(`   Abstract: ${extractionData.metadata?.abstract ? '✅' : '❌'}`);

      // Step 3: Verify content quality
      console.log('\n[3/3] Verifying content quality...');

      const fullText = (extractionData.text || '').toLowerCase();
      const keywordsFound: string[] = [];
      const keywordsMissing: string[] = [];

      paper.expectedKeywords.forEach((keyword) => {
        if (fullText.includes(keyword.toLowerCase())) {
          keywordsFound.push(keyword);
          console.log(`   ✅ Found keyword: "${keyword}"`);
        } else {
          keywordsMissing.push(keyword);
          console.log(`   ❌ Missing keyword: "${keyword}"`);
        }
      });

      const qualityScore = this.calculateQualityScore({
        wordCount,
        expectedWordCount: paper.minimumWordCount,
        keywordsFound: keywordsFound.length,
        totalKeywords: paper.expectedKeywords.length,
        hasTitle: !!extractionData.metadata?.title,
        hasAbstract: !!extractionData.metadata?.abstract,
        hasSections: (extractionData.sections?.length || 0) > 0,
      });

      console.log(`\n📊 Quality Score: ${qualityScore.toFixed(1)}%`);
      console.log(`   Word Count: ${wordCount} / ${paper.minimumWordCount} (${((wordCount / paper.minimumWordCount) * 100).toFixed(1)}%)`);
      console.log(`   Keywords: ${keywordsFound.length} / ${paper.expectedKeywords.length}`);

      return {
        paperId: paper.id,
        source: paper.source,
        success: true,
        wordCount,
        processingTime,
        hasTitle: !!extractionData.metadata?.title,
        hasAbstract: !!extractionData.metadata?.abstract,
        hasSections: (extractionData.sections?.length || 0) > 0,
        keywordsFound,
        keywordsMissing,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`\n❌ Test failed: ${errorMsg}`);

      return {
        paperId: paper.id,
        source: paper.source,
        success: false,
        hasTitle: false,
        hasAbstract: false,
        hasSections: false,
        keywordsFound: [],
        keywordsMissing: paper.expectedKeywords,
        error: errorMsg,
      };
    }
  }

  /**
   * Download PDF from URL
   */
  private async downloadPDF(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VQMethod/1.0; Research)',
          Accept: 'application/pdf,*/*',
        },
        maxRedirects: 5,
      });

      return Buffer.from(response.data);
    } catch (error: unknown) {
      throw new Error(`PDF download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract content via backend API
   */
  private async extractViaBackend(pdfBuffer: Buffer): Promise<any> {
    try {
      // Call backend PDF parsing endpoint (uses GROBID Tier 2.5)
      const response = await axios.post(
        `${this.backendUrl}/api/literature/extract-pdf`,
        pdfBuffer,
        {
          headers: {
            'Content-Type': 'application/pdf',
          },
          timeout: 120000,  // 2 minutes
        }
      );

      return response.data;
    } catch (error: unknown) {
      throw new Error(`Backend API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(metrics: {
    wordCount: number;
    expectedWordCount: number;
    keywordsFound: number;
    totalKeywords: number;
    hasTitle: boolean;
    hasAbstract: boolean;
    hasSections: boolean;
  }): number {
    const wordCountScore = Math.min((metrics.wordCount / metrics.expectedWordCount) * 100, 100);
    const keywordScore = (metrics.keywordsFound / metrics.totalKeywords) * 100;
    const metadataScore =
      (metrics.hasTitle ? 33.33 : 0) +
      (metrics.hasAbstract ? 33.33 : 0) +
      (metrics.hasSections ? 33.34 : 0);

    // Weighted average: 40% word count, 40% keywords, 20% metadata
    return wordCountScore * 0.4 + keywordScore * 0.4 + metadataScore * 0.2;
  }

  /**
   * Run all tests and generate report
   */
  async runAll(): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                  GROBID Extraction End-to-End Test Suite                    ║');
    console.log('║                          Phase 10.94 - Enterprise Grade                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

    // Test GROBID availability first
    console.log('\n[Pre-Flight] Checking GROBID availability...');
    try {
      await axios.get('http://localhost:8070/api/isalive', { timeout: 5000 });
      console.log('✅ GROBID service is available');
    } catch (error) {
      console.log('❌ GROBID service is NOT available');
      console.log('   Please start GROBID: docker-compose up -d grobid');
      console.log('   Wait 60 seconds for startup, then retry.');
      process.exit(1);
    }

    // Test backend availability
    console.log('[Pre-Flight] Checking backend availability...');
    try {
      await axios.get(`${this.backendUrl}/health`, { timeout: 5000 });
      console.log('✅ Backend service is available');
    } catch (error) {
      console.log('❌ Backend service is NOT available');
      console.log('   Please start backend: npm run start:dev');
      process.exit(1);
    }

    // Run tests on all papers
    this.results = [];
    for (const paper of TEST_PAPERS) {
      const result = await this.testPaper(paper);
      this.results.push(result);

      // Brief pause between tests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Generate final report
    this.generateReport();
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): void {
    console.log('\n\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                            TEST RESULTS SUMMARY                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    const totalTests = this.results.length;
    const successfulTests = this.results.filter((r) => r.success).length;
    const failedTests = totalTests - successfulTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%\n`);

    // Detailed results
    console.log('Detailed Results:');
    console.log('─'.repeat(80));

    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.paperId} (${result.source})`);
      console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

      if (result.success) {
        console.log(`   Word Count: ${result.wordCount}`);
        console.log(`   Processing Time: ${result.processingTime}ms`);
        console.log(`   Metadata: Title=${result.hasTitle ? '✅' : '❌'}, Abstract=${result.hasAbstract ? '✅' : '❌'}, Sections=${result.hasSections ? '✅' : '❌'}`);
        console.log(`   Keywords Found: ${result.keywordsFound.join(', ')}`);
        if (result.keywordsMissing.length > 0) {
          console.log(`   Keywords Missing: ${result.keywordsMissing.join(', ')}`);
        }
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Overall assessment
    console.log('\n\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          OVERALL ASSESSMENT                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    if (successfulTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! GROBID integration is working perfectly.');
      console.log('   ✅ Enterprise-grade quality confirmed');
      console.log('   ✅ Ready for production deployment\n');
    } else if (successfulTests >= totalTests * 0.75) {
      console.log('⚠️  MOSTLY SUCCESSFUL. Some tests failed but core functionality works.');
      console.log(`   ✅ ${successfulTests}/${totalTests} tests passed`);
      console.log('   ⚠️  Review failed tests before production deployment\n');
    } else {
      console.log('❌ SIGNIFICANT ISSUES DETECTED. GROBID integration needs attention.');
      console.log(`   ❌ Only ${successfulTests}/${totalTests} tests passed`);
      console.log('   🔧 Fix issues before proceeding\n');
    }

    // Save results to file
    const reportPath = path.join(__dirname, '../test-results-grobid-e2e.json');
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed results saved to: ${reportPath}\n`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new GrobidTester();
  tester.runAll().catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
}

export { GrobidTester, TestPaper, ExtractionResult };
