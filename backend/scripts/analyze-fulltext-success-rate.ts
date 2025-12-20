/**
 * Phase 10.185: Full-Text Extraction Success Rate Analysis
 * 
 * Analyzes existing papers in database to measure:
 * - Success rate (should be 75-80% vs baseline 52%)
 * - Failure rate (should be 15-20% vs baseline 32%)
 * - Stuck jobs (should be 0% vs baseline 16%)
 * - Error category distribution
 * - Publisher-specific success rates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AnalysisResult {
  totalPapers: number;
  successCount: number;
  failedCount: number;
  stuckCount: number;
  notFetchedCount: number;
  successRate: number;
  failureRate: number;
  stuckRate: number;
  publisherStats: Record<string, {
    total: number;
    success: number;
    failed: number;
    fetching: number;
    notFetched: number;
    successRate: number;
  }>;
  sourceStats: Record<string, {
    total: number;
    success: number;
    successRate: number;
  }>;
  recentPapers: Array<{
    id: string;
    title: string;
    publisher: string;
    status: string;
    source: string | null;
    wordCount: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

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

async function analyzeFullTextResults(): Promise<AnalysisResult> {
  console.log(`\n📊 Analyzing full-text extraction results from database...`);
  
  // Get papers that have been through extraction (have fullTextStatus set OR have fullText content)
  const papers = await prisma.paper.findMany({
    where: {
      OR: [
        { fullTextStatus: { not: null } },
        { fullText: { not: null } },
        { hasFullText: true },
      ],
    },
    select: {
      id: true,
      title: true,
      url: true,
      doi: true,
      source: true,
      fullTextStatus: true,
      fullTextWordCount: true,
      fullTextSource: true,
      hasFullText: true,
      fullText: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 500, // Analyze last 500 papers that have been processed
  });

  console.log(`📄 Analyzing ${papers.length} papers`);

  // Categorize by status
  const statusCounts = {
    success: 0,
    failed: 0,
    fetching: 0,
    not_fetched: 0,
  };

  const publisherStats: Record<string, {
    total: number;
    success: number;
    failed: number;
    fetching: number;
    notFetched: number;
  }> = {};

  const sourceStats: Record<string, {
    total: number;
    success: number;
  }> = {};

  const recentPapers = papers.slice(0, 30).map(paper => {
    const publisher = detectPublisher(paper.url || paper.doi || '');
    
    // Determine status: check fullTextStatus first, then hasFullText, then fullText content
    let status = paper.fullTextStatus;
    if (!status) {
      // Infer status from other fields
      if (paper.hasFullText && paper.fullText && paper.fullText.length > 100) {
        status = 'success'; // Has content but status not set
      } else if (paper.hasFullText === false) {
        status = 'failed'; // Explicitly marked as no full text
      } else {
        status = 'not_fetched'; // Never attempted
      }
    }
    
    const source = paper.source || 'unknown';
    
    // Count by status
    if (status === 'success') statusCounts.success++;
    else if (status === 'failed') statusCounts.failed++;
    else if (status === 'fetching') statusCounts.fetching++;
    else statusCounts.not_fetched++;

    // Track publisher stats
    if (!publisherStats[publisher]) {
      publisherStats[publisher] = { total: 0, success: 0, failed: 0, fetching: 0, notFetched: 0 };
    }
    publisherStats[publisher].total++;
    if (status === 'success') publisherStats[publisher].success++;
    if (status === 'failed') publisherStats[publisher].failed++;
    if (status === 'fetching') publisherStats[publisher].fetching++;
    if (status === 'not_fetched') publisherStats[publisher].notFetched++;

    // Track source stats
    if (!sourceStats[source]) {
      sourceStats[source] = { total: 0, success: 0 };
    }
    sourceStats[source].total++;
    if (status === 'success') sourceStats[source].success++;

    return {
      id: paper.id,
      title: paper.title || 'Untitled',
      publisher,
      status,
      source,
      wordCount: paper.fullTextWordCount,
      createdAt: paper.createdAt,
      updatedAt: paper.updatedAt,
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
    fetching: number;
    notFetched: number;
    successRate: number;
  }> = {};

  for (const [publisher, stats] of Object.entries(publisherStats)) {
    publisherStatsWithRates[publisher] = {
      ...stats,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
    };
  }

  // Calculate source success rates
  const sourceStatsWithRates: Record<string, {
    total: number;
    success: number;
    successRate: number;
  }> = {};

  for (const [source, stats] of Object.entries(sourceStats)) {
    sourceStatsWithRates[source] = {
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
    publisherStats: publisherStatsWithRates,
    sourceStats: sourceStatsWithRates,
    recentPapers,
  };
}

async function printResults(result: AnalysisResult): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('📊 FULL-TEXT EXTRACTION SUCCESS RATE ANALYSIS');
  console.log('='.repeat(80));

  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Papers Analyzed: ${result.totalPapers}`);
  console.log(`   ✅ Success: ${result.successCount} (${result.successRate.toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${result.failedCount} (${result.failureRate.toFixed(1)}%)`);
  console.log(`   🔄 Stuck (fetching): ${result.stuckCount} (${result.stuckRate.toFixed(1)}%)`);
  console.log(`   ⏸️  Not Fetched: ${result.notFetchedCount} (${((result.notFetchedCount / result.totalPapers) * 100).toFixed(1)}%)`);

  console.log(`\n📊 Comparison to Baseline (Before Improvements):`);
  const successImprovement = result.successRate - 52;
  const failureImprovement = 32 - result.failureRate;
  const stuckImprovement = 16 - result.stuckRate;
  
  console.log(`   Success Rate: ${result.successRate.toFixed(1)}% (baseline: 52%) ${successImprovement >= 0 ? `✅ +${successImprovement.toFixed(1)}%` : `❌ ${successImprovement.toFixed(1)}%`}`);
  console.log(`   Failure Rate: ${result.failureRate.toFixed(1)}% (baseline: 32%) ${failureImprovement >= 0 ? `✅ -${failureImprovement.toFixed(1)}%` : `❌ +${Math.abs(failureImprovement).toFixed(1)}%`}`);
  console.log(`   Stuck Rate: ${result.stuckRate.toFixed(1)}% (baseline: 16%) ${stuckImprovement >= 0 ? `✅ -${stuckImprovement.toFixed(1)}%` : `❌ +${Math.abs(stuckImprovement).toFixed(1)}%`}`);

  console.log(`\n🎯 Target vs Actual:`);
  const successTargetMet = result.successRate >= 75;
  const failureTargetMet = result.failureRate <= 20;
  const stuckTargetMet = result.stuckRate === 0;
  
  console.log(`   Success Rate: ${result.successRate.toFixed(1)}% (target: 75%+) ${successTargetMet ? '✅ TARGET MET' : '⚠️  BELOW TARGET'}`);
  console.log(`   Failure Rate: ${result.failureRate.toFixed(1)}% (target: ≤20%) ${failureTargetMet ? '✅ TARGET MET' : '⚠️  ABOVE TARGET'}`);
  console.log(`   Stuck Rate: ${result.stuckRate.toFixed(1)}% (target: 0%) ${stuckTargetMet ? '✅ TARGET MET' : '⚠️  ABOVE TARGET'}`);

  if (Object.keys(result.publisherStats).length > 0) {
    console.log(`\n📊 Publisher-Specific Success Rates (Top 10):`);
    const sortedPublishers = Object.entries(result.publisherStats)
      .filter(([_, stats]) => stats.total >= 3) // Only show publishers with 3+ papers
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);

    if (sortedPublishers.length === 0) {
      console.log(`   (No publishers with sufficient data)`);
    } else {
      for (const [publisher, stats] of sortedPublishers) {
        const status = stats.successRate >= 80 ? '✅' : stats.successRate >= 60 ? '⚠️' : '❌';
        console.log(`   ${status} ${publisher.padEnd(15)}: ${stats.success}/${stats.total} (${stats.successRate.toFixed(1)}%) | Failed: ${stats.failed} | Stuck: ${stats.fetching}`);
      }
    }
  }

  if (Object.keys(result.sourceStats).length > 0) {
    console.log(`\n📊 Source-Specific Success Rates:`);
    const sortedSources = Object.entries(result.sourceStats)
      .filter(([_, stats]) => stats.total >= 3)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);

    if (sortedSources.length === 0) {
      console.log(`   (No sources with sufficient data)`);
    } else {
      for (const [source, stats] of sortedSources) {
        const status = stats.successRate >= 80 ? '✅' : stats.successRate >= 60 ? '⚠️' : '❌';
        console.log(`   ${status} ${source.padEnd(20)}: ${stats.success}/${stats.total} (${stats.successRate.toFixed(1)}%)`);
      }
    }
  }

  if (result.recentPapers.length > 0) {
    console.log(`\n📄 Recent 20 Papers (Status Breakdown):`);
    const statusGroups = {
      success: result.recentPapers.filter(p => p.status === 'success'),
      failed: result.recentPapers.filter(p => p.status === 'failed'),
      fetching: result.recentPapers.filter(p => p.status === 'fetching'),
      notFetched: result.recentPapers.filter(p => p.status === 'not_fetched'),
    };

    console.log(`   ✅ Success (${statusGroups.success.length}):`);
    statusGroups.success.slice(0, 5).forEach((paper, index) => {
      const wordCount = paper.wordCount ? `${paper.wordCount} words` : 'N/A';
      console.log(`      ${index + 1}. [${paper.publisher}] ${paper.title.substring(0, 50)}... (${wordCount})`);
    });

    console.log(`   ❌ Failed (${statusGroups.failed.length}):`);
    statusGroups.failed.slice(0, 5).forEach((paper, index) => {
      console.log(`      ${index + 1}. [${paper.publisher}] ${paper.title.substring(0, 50)}...`);
    });

    if (statusGroups.fetching.length > 0) {
      console.log(`   🔄 Stuck/Fetching (${statusGroups.fetching.length}):`);
      statusGroups.fetching.slice(0, 5).forEach((paper, index) => {
        const stuckDuration = Math.round((Date.now() - paper.updatedAt.getTime()) / 60000);
        console.log(`      ${index + 1}. [${paper.publisher}] ${paper.title.substring(0, 50)}... (stuck for ${stuckDuration} min)`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  
  // Final grade
  let grade = 'F';
  let score = 0;
  let notes: string[] = [];
  
  if (result.successRate >= 80 && result.failureRate <= 15 && result.stuckRate === 0) {
    grade = 'A+';
    score = 98;
    notes.push('Outstanding! All targets exceeded');
  } else if (result.successRate >= 75 && result.failureRate <= 20 && result.stuckRate <= 1) {
    grade = 'A';
    score = 90;
    notes.push('Excellent! All targets met');
  } else if (result.successRate >= 70 && result.failureRate <= 25 && result.stuckRate <= 2) {
    grade = 'B+';
    score = 85;
    notes.push('Good improvement, close to targets');
  } else if (result.successRate >= 65 && result.failureRate <= 30 && result.stuckRate <= 5) {
    grade = 'B';
    score = 80;
    notes.push('Moderate improvement');
  } else if (result.successRate >= 60 && result.failureRate <= 35 && result.stuckRate <= 10) {
    grade = 'C+';
    score = 75;
    notes.push('Some improvement');
  } else if (result.successRate >= 55 && result.failureRate <= 40 && result.stuckRate <= 15) {
    grade = 'C';
    score = 70;
    notes.push('Minimal improvement');
  } else if (result.successRate >= 52 && result.failureRate <= 32 && result.stuckRate <= 16) {
    grade = 'D';
    score = 65;
    notes.push('No improvement from baseline');
  } else {
    grade = 'F';
    score = 50;
    notes.push('Worse than baseline');
  }

  console.log(`\n🎯 FINAL GRADE: ${grade} (${score}%)`);
  console.log(`\n📝 Assessment:`);
  notes.forEach(note => console.log(`   ${note}`));
  
  if (!successTargetMet) {
    console.log(`   ⚠️  Success rate below target (need 75%+, got ${result.successRate.toFixed(1)}%)`);
  }
  if (!failureTargetMet) {
    console.log(`   ⚠️  Failure rate above target (need ≤20%, got ${result.failureRate.toFixed(1)}%)`);
  }
  if (!stuckTargetMet) {
    console.log(`   ⚠️  Stuck jobs still present (${result.stuckRate.toFixed(1)}%) - scheduled cleanup should fix this`);
  }
  
  console.log('\n' + '='.repeat(80));
}

async function main() {
  try {
    console.log('🚀 Starting Full-Text Extraction Success Rate Analysis');
    console.log('='.repeat(80));

    const result = await analyzeFullTextResults();
    await printResults(result);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

