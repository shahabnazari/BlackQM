/**
 * Phase 10.185: Full-Text Extraction Success Rate Test
 * 
 * Tests the improved full-text extraction pipeline to measure:
 * - Success rate (should be 75-80% vs baseline 52%)
 * - Failure rate (should be 15-20% vs baseline 32%)
 * - Stuck jobs (should be 0% vs baseline 16%)
 * - Error category distribution
 * - Publisher-specific success rates
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_BASE_URL = 'http://localhost:4000/api/literature';

interface TestResult {
  totalPapers: number;
  successCount: number;
  failedCount: number;
  stuckCount: number;
  notFetchedCount: number;
  successRate: number;
  failureRate: number;
  stuckRate: number;
  errorCategories: Record<string, number>;
  publisherStats: Record<string, {
    total: number;
    success: number;
    failed: number;
    successRate: number;
  }>;
  recentPapers: Array<{
    id: string;
    title: string;
    publisher: string;
    status: string;
    wordCount: number | null;
    createdAt: Date;
  }>;
}

async function performSearch(query: string, limit: number = 20): Promise<string[]> {
  console.log(`\n🔍 Performing search: "${query}" (limit: ${limit})`);
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/search/public`,
      {
        query,
        limit,
        sources: [
          'SEMANTIC_SCHOLAR',
          'CROSSREF',
          'PUBMED',
          'ARXIV',
        ],
      },
      {
        timeout: 120000, // 2 minutes
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const papers = response.data.papers || [];
    console.log(`✅ Search successful. Found ${papers.length} papers.`);
    
    // Extract paper IDs (they should be saved to database)
    // Note: In real flow, papers are saved via frontend, but for testing
    // we'll query the database for recent papers
    return papers.map((p: any) => p.id).filter(Boolean);
  } catch (error: any) {
    console.error(`❌ Search failed: ${error.message}`);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function triggerFullTextExtraction(paperIds: string[]): Promise<void> {
  console.log(`\n📥 Triggering full-text extraction for ${paperIds.length} papers...`);
  
  // In real flow, full-text extraction is triggered via frontend
  // For testing, we'll call the backend endpoint directly
  for (const paperId of paperIds) {
    try {
      await axios.post(
        `${API_BASE_URL}/papers/${paperId}/fetch-fulltext`,
        {},
        {
          timeout: 60000,
        }
      );
    } catch (error: any) {
      // Some papers might not have the endpoint, or might already be processing
      // This is okay - we'll check the database state
      if (error.response?.status !== 404) {
        console.warn(`⚠️  Failed to trigger extraction for ${paperId}: ${error.message}`);
      }
    }
  }
  
  console.log(`✅ Extraction requests sent. Waiting 30 seconds for processing...`);
  await new Promise(resolve => setTimeout(resolve, 30000));
}

async function analyzeFullTextResults(): Promise<TestResult> {
  console.log(`\n📊 Analyzing full-text extraction results...`);
  
  // Get recent papers (last 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const papers = await prisma.paper.findMany({
    where: {
      createdAt: {
        gte: oneHourAgo,
      },
    },
    select: {
      id: true,
      title: true,
      url: true,
      doi: true,
      fullTextStatus: true,
      fullTextWordCount: true,
      fullTextSource: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📄 Found ${papers.length} papers from last hour`);

  // Detect publisher for each paper
  function detectPublisher(urlOrDoi: string | null): string {
    if (!urlOrDoi) return 'unknown';
    const lower = urlOrDoi.toLowerCase();
    
    if (lower.includes('springer') || lower.includes('link.springer')) return 'springer';
    if (lower.includes('nature') || lower.includes('nature.com')) return 'nature';
    if (lower.includes('wiley') || lower.includes('onlinelibrary.wiley')) return 'wiley';
    if (lower.includes('mdpi') || lower.includes('mdpi.com')) return 'mdpi';
    if (lower.includes('frontiers') || lower.includes('frontiersin.org')) return 'frontiers';
    if (lower.includes('plos') || lower.includes('plos.org')) return 'plos';
    if (lower.includes('elsevier') || lower.includes('sciencedirect')) return 'elsevier';
    if (lower.includes('ieee') || lower.includes('ieee.org')) return 'ieee';
    if (lower.includes('arxiv') || lower.includes('arxiv.org')) return 'arxiv';
    if (lower.includes('pubmed') || lower.includes('ncbi.nlm.nih.gov') || lower.includes('pmc')) return 'pmc';
    if (lower.includes('sage') || lower.includes('sagepub.com')) return 'sage';
    if (lower.includes('taylor') || lower.includes('tandfonline')) return 'taylorfrancis';
    if (lower.includes('jama') || lower.includes('jamanetwork')) return 'jama';
    
    // DOI prefixes
    if (lower.startsWith('10.1007/')) return 'springer';
    if (lower.startsWith('10.1038/')) return 'nature';
    if (lower.startsWith('10.1111/') || lower.startsWith('10.1002/')) return 'wiley';
    if (lower.startsWith('10.3390/')) return 'mdpi';
    if (lower.startsWith('10.3389/')) return 'frontiers';
    if (lower.startsWith('10.1371/')) return 'plos';
    if (lower.startsWith('10.1016/')) return 'elsevier';
    if (lower.startsWith('10.1109/')) return 'ieee';
    if (lower.startsWith('10.1177/')) return 'sage';
    if (lower.startsWith('10.1080/')) return 'taylorfrancis';
    if (lower.startsWith('10.1001/')) return 'jama';
    
    return 'unknown';
  }

  // Categorize by status
  const statusCounts = {
    success: 0,
    failed: 0,
    fetching: 0,
    not_fetched: 0,
  };

  const errorCategories: Record<string, number> = {};
  const publisherStats: Record<string, {
    total: number;
    success: number;
    failed: number;
  }> = {};

  const recentPapers = papers.slice(0, 20).map(paper => {
    const publisher = detectPublisher(paper.url || paper.doi || '');
    const status = paper.fullTextStatus || 'not_fetched';
    
    // Count by status
    if (status === 'success') statusCounts.success++;
    else if (status === 'failed') statusCounts.failed++;
    else if (status === 'fetching') statusCounts.fetching++;
    else statusCounts.not_fetched++;

    // Track publisher stats
    if (!publisherStats[publisher]) {
      publisherStats[publisher] = { total: 0, success: 0, failed: 0 };
    }
    publisherStats[publisher].total++;
    if (status === 'success') publisherStats[publisher].success++;
    if (status === 'failed') publisherStats[publisher].failed++;

    return {
      id: paper.id,
      title: paper.title || 'Untitled',
      publisher,
      status,
      wordCount: paper.fullTextWordCount,
      createdAt: paper.createdAt,
    };
  });

  // Calculate rates
  const total = papers.length;
  const successRate = total > 0 ? (statusCounts.success / total) * 100 : 0;
  const failureRate = total > 0 ? (statusCounts.failed / total) * 100 : 0;
  const stuckRate = total > 0 ? (statusCounts.fetching / total) * 100 : 0;

  // Calculate publisher success rates
  const publisherStatsWithRates: Record<string, {
    total: number;
    success: number;
    failed: number;
    successRate: number;
  }> = {};

  for (const [publisher, stats] of Object.entries(publisherStats)) {
    publisherStatsWithRates[publisher] = {
      ...stats,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
    };
  }

  return {
    totalPapers: total,
    successCount: statusCounts.success,
    failedCount: statusCounts.failed,
    stuckCount: statusCounts.fetching,
    notFetchedCount: statusCounts.not_fetched,
    successRate,
    failureRate,
    stuckRate,
    errorCategories,
    publisherStats: publisherStatsWithRates,
    recentPapers,
  };
}

async function printResults(result: TestResult): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FULL-TEXT EXTRACTION SUCCESS RATE ANALYSIS');
  console.log('='.repeat(80));

  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Papers: ${result.totalPapers}`);
  console.log(`   ✅ Success: ${result.successCount} (${result.successRate.toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${result.failedCount} (${result.failureRate.toFixed(1)}%)`);
  console.log(`   🔄 Stuck (fetching): ${result.stuckCount} (${result.stuckRate.toFixed(1)}%)`);
  console.log(`   ⏸️  Not Fetched: ${result.notFetchedCount} (${((result.notFetchedCount / result.totalPapers) * 100).toFixed(1)}%)`);

  console.log(`\n📊 Comparison to Baseline:`);
  console.log(`   Success Rate: ${result.successRate.toFixed(1)}% (baseline: 52%) ${result.successRate >= 75 ? '✅ IMPROVED' : result.successRate >= 65 ? '⚠️  PARTIAL' : '❌ NEEDS WORK'}`);
  console.log(`   Failure Rate: ${result.failureRate.toFixed(1)}% (baseline: 32%) ${result.failureRate <= 20 ? '✅ IMPROVED' : result.failureRate <= 25 ? '⚠️  PARTIAL' : '❌ NEEDS WORK'}`);
  console.log(`   Stuck Rate: ${result.stuckRate.toFixed(1)}% (baseline: 16%) ${result.stuckRate === 0 ? '✅ FIXED' : '❌ NEEDS WORK'}`);

  if (Object.keys(result.publisherStats).length > 0) {
    console.log(`\n📊 Publisher-Specific Success Rates:`);
    const sortedPublishers = Object.entries(result.publisherStats)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);

    for (const [publisher, stats] of sortedPublishers) {
      const status = stats.successRate >= 80 ? '✅' : stats.successRate >= 60 ? '⚠️' : '❌';
      console.log(`   ${status} ${publisher.padEnd(15)}: ${stats.success}/${stats.total} (${stats.successRate.toFixed(1)}%)`);
    }
  }

  if (result.recentPapers.length > 0) {
    console.log(`\n📄 Recent 10 Papers:`);
    result.recentPapers.slice(0, 10).forEach((paper, index) => {
      const statusIcon = paper.status === 'success' ? '✅' : paper.status === 'failed' ? '❌' : paper.status === 'fetching' ? '🔄' : '⏸️';
      const wordCount = paper.wordCount ? `${paper.wordCount} words` : 'N/A';
      console.log(`   ${index + 1}. ${statusIcon} [${paper.publisher}] ${paper.title.substring(0, 50)}...`);
      console.log(`      Status: ${paper.status}, Word Count: ${wordCount}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  
  // Final grade
  let grade = 'F';
  let score = 0;
  
  if (result.successRate >= 80 && result.failureRate <= 15 && result.stuckRate === 0) {
    grade = 'A+';
    score = 98;
  } else if (result.successRate >= 75 && result.failureRate <= 20 && result.stuckRate <= 1) {
    grade = 'A';
    score = 90;
  } else if (result.successRate >= 70 && result.failureRate <= 25 && result.stuckRate <= 2) {
    grade = 'B+';
    score = 85;
  } else if (result.successRate >= 65 && result.failureRate <= 30 && result.stuckRate <= 5) {
    grade = 'B';
    score = 80;
  } else if (result.successRate >= 60 && result.failureRate <= 35 && result.stuckRate <= 10) {
    grade = 'C+';
    score = 75;
  } else if (result.successRate >= 55 && result.failureRate <= 40 && result.stuckRate <= 15) {
    grade = 'C';
    score = 70;
  } else {
    grade = 'D';
    score = 60;
  }

  console.log(`\n🎯 FINAL GRADE: ${grade} (${score}%)`);
  console.log(`\n📝 Assessment:`);
  if (result.successRate >= 75) {
    console.log(`   ✅ Success rate target MET (75%+)`);
  } else {
    console.log(`   ⚠️  Success rate below target (need 75%+, got ${result.successRate.toFixed(1)}%)`);
  }
  
  if (result.failureRate <= 20) {
    console.log(`   ✅ Failure rate target MET (≤20%)`);
  } else {
    console.log(`   ⚠️  Failure rate above target (need ≤20%, got ${result.failureRate.toFixed(1)}%)`);
  }
  
  if (result.stuckRate === 0) {
    console.log(`   ✅ Stuck jobs FIXED (0%)`);
  } else {
    console.log(`   ❌ Stuck jobs still present (${result.stuckRate.toFixed(1)}%)`);
  }
  
  console.log('\n' + '='.repeat(80));
}

async function main() {
  try {
    console.log('🚀 Starting Full-Text Extraction Success Rate Test');
    console.log('='.repeat(80));

    // Step 1: Perform a search to get fresh papers
    const searchQuery = 'machine learning healthcare';
    const paperIds = await performSearch(searchQuery, 20);

    // Step 2: Wait a bit for papers to be saved (if not already)
    console.log('\n⏳ Waiting 5 seconds for papers to be saved...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Trigger full-text extraction (if endpoint exists)
    // Note: In production, this is triggered via frontend workflow
    // For testing, we'll analyze existing papers
    try {
      await triggerFullTextExtraction(paperIds);
    } catch (error) {
      console.log('⚠️  Could not trigger extraction via API (this is okay - analyzing existing state)');
    }

    // Step 4: Analyze results
    const result = await analyzeFullTextResults();

    // Step 5: Print results
    await printResults(result);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();






