/**
 * Phase 10 Day 30: Comprehensive Source Testing
 *
 * Tests all 4 literature sources to ensure DOI/PMID/URL extraction works
 * and papers are properly queued for full-text processing.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LiteratureService } from '../modules/literature/literature.service';
import { PDFQueueService } from '../modules/literature/services/pdf-queue.service';
import { LiteratureSource } from '../modules/literature/dto/literature.dto';

interface TestResult {
  source: string;
  success: boolean;
  hasDoi: boolean;
  hasPmid: boolean;
  hasUrl: boolean;
  error?: string;
  paperCount: number;
}

async function testAllSources() {
  console.log('🧪 ===== TESTING ALL 4 LITERATURE SOURCES =====\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Reduce noise
  });

  const literatureService = app.get(LiteratureService);
  const queueService = app.get(PDFQueueService);

  const results: TestResult[] = [];

  // Test query: "social media health"
  const testQuery = 'social media health';

  // ===== TEST 1: PubMed =====
  console.log('📚 Test 1: PubMed (should have PMID)');
  try {
    const papers = await literatureService['searchPubMed']({
      query: testQuery,
      limit: 3,
    });

    const hasDoi = papers.some(p => !!p.doi);
    const hasPmid = papers.some(p => !!(p as any).pmid);
    const hasUrl = papers.some(p => !!p.url);

    console.log(`   ✅ Retrieved ${papers.length} papers`);
    console.log(`   - Has DOI: ${hasDoi ? '✅' : '❌'}`);
    console.log(`   - Has PMID: ${hasPmid ? '✅' : '❌'}`);
    console.log(`   - Has URL: ${hasUrl ? '✅' : '❌'}`);

    if (papers.length > 0) {
      const sample = papers[0];
      console.log(`   Sample: "${sample.title?.substring(0, 60)}..."`);
      console.log(`      DOI: ${sample.doi || 'N/A'}`);
      console.log(`      PMID: ${(sample as any).pmid || 'N/A'}`);
      console.log(`      URL: ${sample.url?.substring(0, 50) || 'N/A'}...`);
    }

    results.push({
      source: 'PubMed',
      success: true,
      hasDoi,
      hasPmid,
      hasUrl,
      paperCount: papers.length,
    });
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      source: 'PubMed',
      success: false,
      hasDoi: false,
      hasPmid: false,
      hasUrl: false,
      paperCount: 0,
      error: error.message,
    });
  }

  console.log('');

  // ===== TEST 2: CrossRef =====
  console.log('📘 Test 2: CrossRef (should have DOI)');
  try {
    const papers = await literatureService['searchCrossRef']({
      query: testQuery,
      limit: 3,
    });

    const hasDoi = papers.some(p => !!p.doi);
    const hasPmid = papers.some(p => !!(p as any).pmid);
    const hasUrl = papers.some(p => !!p.url);

    console.log(`   ✅ Retrieved ${papers.length} papers`);
    console.log(`   - Has DOI: ${hasDoi ? '✅' : '❌'}`);
    console.log(`   - Has PMID: ${hasPmid ? '✅' : '❌'}`);
    console.log(`   - Has URL: ${hasUrl ? '✅' : '❌'}`);

    if (papers.length > 0) {
      const sample = papers[0];
      console.log(`   Sample: "${sample.title?.substring(0, 60)}..."`);
      console.log(`      DOI: ${sample.doi || 'N/A'}`);
      console.log(`      PMID: ${(sample as any).pmid || 'N/A'}`);
      console.log(`      URL: ${sample.url?.substring(0, 50) || 'N/A'}...`);
    }

    results.push({
      source: 'CrossRef',
      success: true,
      hasDoi,
      hasPmid,
      hasUrl,
      paperCount: papers.length,
    });
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      source: 'CrossRef',
      success: false,
      hasDoi: false,
      hasPmid: false,
      hasUrl: false,
      paperCount: 0,
      error: error.message,
    });
  }

  console.log('');

  // ===== TEST 3: Semantic Scholar (CRITICAL - this is what we fixed) =====
  console.log('🎓 Test 3: Semantic Scholar (should have DOI AND PMID)');
  try {
    const papers = await literatureService['searchSemanticScholar']({
      query: testQuery,
      limit: 3,
    });

    const hasDoi = papers.some(p => !!p.doi);
    const hasPmid = papers.some(p => !!(p as any).pmid);
    const hasUrl = papers.some(p => !!p.url);

    console.log(`   ✅ Retrieved ${papers.length} papers`);
    console.log(`   - Has DOI: ${hasDoi ? '✅' : '❌'}`);
    console.log(`   - Has PMID: ${hasPmid ? '✅' : '❌'}`);
    console.log(`   - Has URL: ${hasUrl ? '✅' : '❌'}`);

    if (papers.length > 0) {
      const sample = papers[0];
      console.log(`   Sample: "${sample.title?.substring(0, 60)}..."`);
      console.log(`      DOI: ${sample.doi || 'N/A'}`);
      console.log(`      PMID: ${(sample as any).pmid || 'N/A'}`);
      console.log(`      URL: ${sample.url?.substring(0, 50) || 'N/A'}...`);
    }

    results.push({
      source: 'Semantic Scholar',
      success: true,
      hasDoi,
      hasPmid,
      hasUrl,
      paperCount: papers.length,
    });
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      source: 'Semantic Scholar',
      success: false,
      hasDoi: false,
      hasPmid: false,
      hasUrl: false,
      paperCount: 0,
      error: error.message,
    });
  }

  console.log('');

  // ===== TEST 4: ArXiv =====
  console.log('📄 Test 4: ArXiv (should have URL)');
  try {
    const papers = await literatureService['searchArxiv']({
      query: 'machine learning',
      limit: 3,
    });

    const hasDoi = papers.some(p => !!p.doi);
    const hasPmid = papers.some(p => !!(p as any).pmid);
    const hasUrl = papers.some(p => !!p.url);

    console.log(`   ✅ Retrieved ${papers.length} papers`);
    console.log(`   - Has DOI: ${hasDoi ? '✅' : '❌'}`);
    console.log(`   - Has PMID: ${hasPmid ? '✅' : '❌'}`);
    console.log(`   - Has URL: ${hasUrl ? '✅' : '❌'}`);

    if (papers.length > 0) {
      const sample = papers[0];
      console.log(`   Sample: "${sample.title?.substring(0, 60)}..."`);
      console.log(`      DOI: ${sample.doi || 'N/A'}`);
      console.log(`      PMID: ${(sample as any).pmid || 'N/A'}`);
      console.log(`      URL: ${sample.url?.substring(0, 50) || 'N/A'}...`);
    }

    results.push({
      source: 'ArXiv',
      success: true,
      hasDoi,
      hasPmid,
      hasUrl,
      paperCount: papers.length,
    });
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      source: 'ArXiv',
      success: false,
      hasDoi: false,
      hasPmid: false,
      hasUrl: false,
      paperCount: 0,
      error: error.message,
    });
  }

  console.log('');

  // ===== SUMMARY =====
  console.log('\n📊 ===== TEST SUMMARY =====\n');

  const summaryTable = results.map(r => ({
    Source: r.source,
    Status: r.success ? '✅ PASS' : '❌ FAIL',
    Papers: r.paperCount,
    DOI: r.hasDoi ? '✅' : '❌',
    PMID: r.hasPmid ? '✅' : '❌',
    URL: r.hasUrl ? '✅' : '❌',
    Error: r.error || '-',
  }));

  console.table(summaryTable);

  // Verify critical fix: Semantic Scholar should have DOI/PMID
  const semanticScholar = results.find(r => r.source === 'Semantic Scholar');
  if (semanticScholar) {
    if (semanticScholar.hasDoi && semanticScholar.hasPmid) {
      console.log('\n✅ CRITICAL FIX VERIFIED: Semantic Scholar now extracts DOI AND PMID!');
    } else {
      console.log('\n❌ CRITICAL FIX FAILED: Semantic Scholar not extracting DOI/PMID properly');
      console.log(`   DOI: ${semanticScholar.hasDoi ? 'OK' : 'MISSING'}`);
      console.log(`   PMID: ${semanticScholar.hasPmid ? 'OK' : 'MISSING'}`);
    }
  }

  // Queue stats
  const queueStats = queueService.getStats();
  console.log('\n📤 Queue Status:');
  console.log(`   Queue Length: ${queueStats.queueLength}`);
  console.log(`   Total Jobs: ${queueStats.totalJobs}`);
  console.log(`   Completed: ${queueStats.completed}`);
  console.log(`   Failed: ${queueStats.failed}`);

  await app.close();

  // Exit with error if any test failed
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

testAllSources().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
