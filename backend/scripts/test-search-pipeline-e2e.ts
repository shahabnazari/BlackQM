/**
 * End-to-End Search Pipeline Verification Script
 * 
 * This script:
 * 1. Performs a search query
 * 2. Gets top 5 ranked papers
 * 3. Checks their URLs/DOIs
 * 4. Verifies full-text extraction status
 * 5. Analyzes the complete pipeline
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface Paper {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  citationCount?: number;
  source: string;
  hasFullText?: boolean;
  fullTextStatus?: 'not_fetched' | 'fetching' | 'success' | 'failed' | 'available';
  fullTextSource?: string;
  pdfUrl?: string;
  fullTextWordCount?: number;
  fullText?: string;
  overallScore?: number;
  relevanceScore?: number;
  qualityScore?: number;
}

interface SearchResult {
  papers: Paper[];
  total: number;
  page: number;
  metadata?: any;
}

async function performSearch(query: string): Promise<SearchResult> {
  console.log(`\n🔍 Performing search: "${query}"\n`);
  
  try {
    const response = await axios.post('http://localhost:4000/api/literature/search/public', {
      query,
      limit: 50, // Get more papers to ensure we have top 5 ranked
      sources: ['semantic_scholar', 'crossref', 'pubmed', 'arxiv', 'openalex'],
    }, {
      timeout: 60000, // 60 seconds
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Search failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function checkPaperInDatabase(paperId: string): Promise<any> {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        abstract: true,
        doi: true,
        url: true,
        hasFullText: true,
        fullTextStatus: true,
        fullTextSource: true,
        pdfUrl: true,
        fullTextWordCount: true,
        fullText: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return paper;
  } catch (error) {
    return null;
  }
}

async function verifyUrlAccessibility(url: string | undefined): Promise<{
  accessible: boolean;
  statusCode?: number;
  error?: string;
}> {
  if (!url) {
    return { accessible: false, error: 'No URL provided' };
  }

  try {
    const response = await axios.head(url, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });
    return {
      accessible: response.status < 400,
      statusCode: response.status,
    };
  } catch (error: any) {
    return {
      accessible: false,
      statusCode: error.response?.status,
      error: error.message,
    };
  }
}

function analyzePaper(paper: Paper, dbPaper: any, urlCheck: any): {
  rank: number;
  title: string;
  hasUrl: boolean;
  urlAccessible: boolean;
  hasFullTextDetected: boolean;
  fullTextStatus: string;
  fullTextFetched: boolean;
  fullTextWordCount: number | null;
  pdfUrl: string | null;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check URL
  const hasUrl = !!(paper.url || paper.doi);
  if (!hasUrl) {
    issues.push('No URL or DOI available');
    recommendations.push('Consider adding URL/DOI from source API');
  }

  // Check URL accessibility
  const urlAccessible = urlCheck.accessible;
  if (hasUrl && !urlAccessible) {
    issues.push(`URL not accessible: ${urlCheck.error || `HTTP ${urlCheck.statusCode}`}`);
    recommendations.push('Verify URL is correct or check if paper is behind paywall');
  }

  // Check full-text detection
  const hasFullTextDetected = paper.hasFullText === true;
  const fullTextStatus = paper.fullTextStatus || 'not_fetched';
  const fullTextFetched = dbPaper?.fullTextStatus === 'success' && !!dbPaper?.fullText;
  const fullTextWordCount = dbPaper?.fullTextWordCount || null;

  // Analyze status
  if (hasFullTextDetected && fullTextStatus === 'available' && !fullTextFetched) {
    recommendations.push('Full-text detected but not fetched - trigger extraction');
  }

  if (hasFullTextDetected && fullTextStatus === 'failed') {
    issues.push('Full-text extraction failed');
    recommendations.push('Check extraction logs for error details');
  }

  if (!hasFullTextDetected && hasUrl && urlAccessible) {
    recommendations.push('Consider adding full-text detection for this URL pattern');
  }

  return {
    rank: 0, // Will be set by caller
    title: paper.title || 'Untitled',
    hasUrl,
    urlAccessible,
    hasFullTextDetected,
    fullTextStatus,
    fullTextFetched,
    fullTextWordCount,
    pdfUrl: paper.pdfUrl || dbPaper?.pdfUrl || null,
    issues,
    recommendations,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔬 END-TO-END SEARCH PIPELINE VERIFICATION');
  console.log('='.repeat(80));

  const testQuery = 'machine learning healthcare applications';
  
  try {
    // Step 1: Perform search
    const searchResult = await performSearch(testQuery);
    
    console.log(`\n✅ Search completed:`);
    console.log(`   Total papers found: ${searchResult.total}`);
    console.log(`   Papers returned: ${searchResult.papers.length}`);
    
    if (searchResult.papers.length === 0) {
      console.log('\n❌ No papers returned from search');
      return;
    }

    // Step 2: Get top 5 ranked papers
    const topPapers = searchResult.papers
      .sort((a, b) => {
        // Sort by overallScore, then relevanceScore, then qualityScore
        const scoreA = a.overallScore || a.relevanceScore || a.qualityScore || 0;
        const scoreB = b.overallScore || b.relevanceScore || b.qualityScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    console.log(`\n📊 Top 5 Ranked Papers:`);
    console.log('='.repeat(80));

    const analysisResults = [];

    // Step 3: Analyze each paper
    for (let i = 0; i < topPapers.length; i++) {
      const paper = topPapers[i];
      console.log(`\n📄 Paper #${i + 1}:`);
      console.log(`   Title: ${paper.title?.substring(0, 80)}...`);
      console.log(`   Source: ${paper.source}`);
      console.log(`   Year: ${paper.year || 'N/A'}`);
      console.log(`   Citations: ${paper.citationCount || 0}`);
      console.log(`   DOI: ${paper.doi || 'N/A'}`);
      console.log(`   URL: ${paper.url || 'N/A'}`);
      
      // Check if paper exists in database
      const dbPaper = await checkPaperInDatabase(paper.id);
      if (dbPaper) {
        console.log(`   ✅ Found in database`);
        console.log(`   Database fullTextStatus: ${dbPaper.fullTextStatus}`);
        console.log(`   Database fullTextWordCount: ${dbPaper.fullTextWordCount || 'N/A'}`);
      } else {
        console.log(`   ⚠️  Not found in database (not saved yet)`);
      }

      // Check URL accessibility
      const urlToCheck = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : undefined);
      console.log(`   Checking URL accessibility...`);
      const urlCheck = await verifyUrlAccessibility(urlToCheck);
      
      if (urlCheck.accessible) {
        console.log(`   ✅ URL accessible (HTTP ${urlCheck.statusCode})`);
      } else {
        console.log(`   ❌ URL not accessible: ${urlCheck.error || `HTTP ${urlCheck.statusCode}`}`);
      }

      // Analyze paper
      const analysis = analyzePaper(paper, dbPaper, urlCheck);
      analysis.rank = i + 1;
      analysisResults.push(analysis);

      // Display full-text status
      console.log(`   Full-Text Detection:`);
      console.log(`     hasFullText: ${paper.hasFullText ? '✅ true' : '❌ false'}`);
      console.log(`     fullTextStatus: ${paper.fullTextStatus || 'not_fetched'}`);
      console.log(`     pdfUrl: ${paper.pdfUrl || 'N/A'}`);
      if (dbPaper) {
        console.log(`     Database Status: ${dbPaper.fullTextStatus}`);
        console.log(`     Full-Text Fetched: ${dbPaper.fullText ? '✅ Yes' : '❌ No'}`);
        console.log(`     Word Count: ${dbPaper.fullTextWordCount || 'N/A'}`);
      }

      // Display issues and recommendations
      if (analysis.issues.length > 0) {
        console.log(`   ⚠️  Issues:`);
        analysis.issues.forEach(issue => console.log(`      - ${issue}`));
      }
      if (analysis.recommendations.length > 0) {
        console.log(`   💡 Recommendations:`);
        analysis.recommendations.forEach(rec => console.log(`      - ${rec}`));
      }
    }

    // Step 4: Summary Analysis
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY ANALYSIS');
    console.log('='.repeat(80));

    const stats = {
      totalPapers: topPapers.length,
      withUrl: analysisResults.filter(p => p.hasUrl).length,
      urlAccessible: analysisResults.filter(p => p.urlAccessible).length,
      fullTextDetected: analysisResults.filter(p => p.hasFullTextDetected).length,
      fullTextFetched: analysisResults.filter(p => p.fullTextFetched).length,
      withIssues: analysisResults.filter(p => p.issues.length > 0).length,
    };

    console.log(`\nOverall Statistics:`);
    console.log(`   Total Papers Analyzed: ${stats.totalPapers}`);
    console.log(`   Papers with URL/DOI: ${stats.withUrl}/${stats.totalPapers} (${(stats.withUrl/stats.totalPapers*100).toFixed(1)}%)`);
    console.log(`   URLs Accessible: ${stats.urlAccessible}/${stats.withUrl} (${stats.withUrl > 0 ? (stats.urlAccessible/stats.withUrl*100).toFixed(1) : 0}%)`);
    console.log(`   Full-Text Detected: ${stats.fullTextDetected}/${stats.totalPapers} (${(stats.fullTextDetected/stats.totalPapers*100).toFixed(1)}%)`);
    console.log(`   Full-Text Fetched: ${stats.fullTextFetched}/${stats.totalPapers} (${(stats.fullTextFetched/stats.totalPapers*100).toFixed(1)}%)`);
    console.log(`   Papers with Issues: ${stats.withIssues}/${stats.totalPapers}`);

    // Pipeline Health Assessment
    console.log(`\n🔍 Pipeline Health Assessment:`);
    
    const healthScore = (
      (stats.withUrl / stats.totalPapers) * 0.2 +
      (stats.urlAccessible / Math.max(stats.withUrl, 1)) * 0.2 +
      (stats.fullTextDetected / stats.totalPapers) * 0.3 +
      (stats.fullTextFetched / Math.max(stats.fullTextDetected, 1)) * 0.3
    ) * 100;

    console.log(`   Health Score: ${healthScore.toFixed(1)}%`);
    
    if (healthScore >= 90) {
      console.log(`   Status: ✅ EXCELLENT - Pipeline working well`);
    } else if (healthScore >= 70) {
      console.log(`   Status: ⚠️  GOOD - Some improvements needed`);
    } else if (healthScore >= 50) {
      console.log(`   Status: ⚠️  FAIR - Multiple issues detected`);
    } else {
      console.log(`   Status: ❌ POOR - Significant issues need attention`);
    }

    // Detailed breakdown
    console.log(`\n📋 Detailed Breakdown:`);
    analysisResults.forEach(result => {
      console.log(`\n   Paper #${result.rank}: ${result.title.substring(0, 60)}...`);
      console.log(`     URL: ${result.hasUrl ? '✅' : '❌'} | Accessible: ${result.urlAccessible ? '✅' : '❌'}`);
      console.log(`     Full-Text Detected: ${result.hasFullTextDetected ? '✅' : '❌'} | Fetched: ${result.fullTextFetched ? '✅' : '❌'}`);
      console.log(`     Status: ${result.fullTextStatus} | Word Count: ${result.fullTextWordCount || 'N/A'}`);
      if (result.issues.length > 0) {
        console.log(`     Issues: ${result.issues.join(', ')}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

