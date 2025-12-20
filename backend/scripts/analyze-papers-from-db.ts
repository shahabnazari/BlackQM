/**
 * Analyze Papers from Database
 * 
 * This script queries the database directly to analyze:
 * 1. Recent papers in the database
 * 2. Their full-text extraction status
 * 3. URL/DOI availability
 * 4. Full-text fetch success rates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzePapers() {
  console.log('='.repeat(80));
  console.log('🔬 PAPER DATABASE ANALYSIS');
  console.log('='.repeat(80));

  try {
    // Get recent papers (last 50)
    const papers = await prisma.paper.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        abstract: true,
        doi: true,
        url: true,
        venue: true,
        year: true,
        citationCount: true,
        source: true,
        hasFullText: true,
        fullTextStatus: true,
        fullTextSource: true,
        pdfUrl: true,
        fullTextWordCount: true,
        fullText: true,
        abstractWordCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`\n📊 Found ${papers.length} recent papers in database\n`);

    if (papers.length === 0) {
      console.log('⚠️  No papers found in database. Run a search first to populate papers.');
      return;
    }

    // Analyze top 5 by various criteria
    const top5ByCitations = [...papers]
      .filter(p => p.citationCount && p.citationCount > 0)
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 5);

    const top5ByFullText = [...papers]
      .filter(p => p.fullTextStatus === 'success' && p.fullTextWordCount && p.fullTextWordCount > 0)
      .sort((a, b) => (b.fullTextWordCount || 0) - (a.fullTextWordCount || 0))
      .slice(0, 5);

    const top5ByRecency = papers.slice(0, 5);

    console.log('='.repeat(80));
    console.log('📄 TOP 5 PAPERS BY CITATIONS');
    console.log('='.repeat(80));

    for (let i = 0; i < top5ByCitations.length; i++) {
      const paper = top5ByCitations[i];
      console.log(`\n${i + 1}. ${paper.title?.substring(0, 70)}...`);
      console.log(`   Citations: ${paper.citationCount || 0}`);
      console.log(`   Year: ${paper.year || 'N/A'}`);
      console.log(`   Source: ${paper.source}`);
      console.log(`   DOI: ${paper.doi || 'N/A'}`);
      console.log(`   URL: ${paper.url ? paper.url.substring(0, 60) + '...' : 'N/A'}`);
      console.log(`   Full-Text Status: ${paper.fullTextStatus || 'not_fetched'}`);
      console.log(`   hasFullText: ${paper.hasFullText ? '✅' : '❌'}`);
      console.log(`   pdfUrl: ${paper.pdfUrl ? '✅ Present' : '❌ Missing'}`);
      console.log(`   Full-Text Word Count: ${paper.fullTextWordCount || 'N/A'}`);
      console.log(`   Full-Text Fetched: ${paper.fullText ? '✅ Yes' : '❌ No'}`);
      console.log(`   Abstract Word Count: ${paper.abstractWordCount || 'N/A'}`);
      
      // Analysis
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (!paper.url && !paper.doi) {
        issues.push('No URL or DOI');
        recommendations.push('Add URL/DOI from source API');
      }

      if (paper.hasFullText && !paper.pdfUrl) {
        issues.push('hasFullText=true but no pdfUrl');
        recommendations.push('Check full-text detection logic');
      }

      if (paper.fullTextStatus === 'available' && !paper.fullText) {
        recommendations.push('Full-text detected but not fetched - trigger extraction');
      }

      if (paper.fullTextStatus === 'failed') {
        issues.push('Full-text extraction failed');
        recommendations.push('Check extraction logs');
      }

      if (paper.fullTextStatus === 'success' && !paper.fullText) {
        issues.push('Status is success but no fullText content');
        recommendations.push('Verify database consistency');
      }

      if (issues.length > 0) {
        console.log(`   ⚠️  Issues: ${issues.join(', ')}`);
      }
      if (recommendations.length > 0) {
        console.log(`   💡 Recommendations: ${recommendations.join(', ')}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📄 TOP 5 PAPERS WITH FULL-TEXT');
    console.log('='.repeat(80));

    if (top5ByFullText.length === 0) {
      console.log('\n⚠️  No papers with successfully fetched full-text found.');
    } else {
      for (let i = 0; i < top5ByFullText.length; i++) {
        const paper = top5ByFullText[i];
        console.log(`\n${i + 1}. ${paper.title?.substring(0, 70)}...`);
        console.log(`   Full-Text Word Count: ${paper.fullTextWordCount || 0}`);
        console.log(`   Source: ${paper.fullTextSource || 'N/A'}`);
        console.log(`   Status: ${paper.fullTextStatus}`);
        console.log(`   DOI: ${paper.doi || 'N/A'}`);
        console.log(`   URL: ${paper.url ? paper.url.substring(0, 60) + '...' : 'N/A'}`);
      }
    }

    // Overall Statistics
    console.log('\n' + '='.repeat(80));
    console.log('📊 OVERALL STATISTICS');
    console.log('='.repeat(80));

    const stats = {
      total: papers.length,
      withUrl: papers.filter(p => p.url || p.doi).length,
      hasFullTextDetected: papers.filter(p => p.hasFullText === true).length,
      fullTextSuccess: papers.filter(p => p.fullTextStatus === 'success').length,
      fullTextAvailable: papers.filter(p => p.fullTextStatus === 'available').length,
      fullTextFailed: papers.filter(p => p.fullTextStatus === 'failed').length,
      fullTextNotFetched: papers.filter(p => p.fullTextStatus === 'not_fetched' || !p.fullTextStatus).length,
      withPdfUrl: papers.filter(p => p.pdfUrl).length,
      withAbstract: papers.filter(p => p.abstract && p.abstract.length > 0).length,
      withAbstractWordCount: papers.filter(p => p.abstractWordCount && p.abstractWordCount > 0).length,
    };

    console.log(`\nTotal Papers: ${stats.total}`);
    console.log(`Papers with URL/DOI: ${stats.withUrl} (${(stats.withUrl/stats.total*100).toFixed(1)}%)`);
    console.log(`Papers with Abstract: ${stats.withAbstract} (${(stats.withAbstract/stats.total*100).toFixed(1)}%)`);
    console.log(`Papers with Abstract Word Count: ${stats.withAbstractWordCount} (${(stats.withAbstractWordCount/stats.total*100).toFixed(1)}%)`);
    console.log(`\nFull-Text Detection:`);
    console.log(`  hasFullText=true: ${stats.hasFullTextDetected} (${(stats.hasFullTextDetected/stats.total*100).toFixed(1)}%)`);
    console.log(`  pdfUrl present: ${stats.withPdfUrl} (${(stats.withPdfUrl/stats.total*100).toFixed(1)}%)`);
    console.log(`\nFull-Text Status Breakdown:`);
    console.log(`  success: ${stats.fullTextSuccess} (${(stats.fullTextSuccess/stats.total*100).toFixed(1)}%)`);
    console.log(`  available: ${stats.fullTextAvailable} (${(stats.fullTextAvailable/stats.total*100).toFixed(1)}%)`);
    console.log(`  failed: ${stats.fullTextFailed} (${(stats.fullTextFailed/stats.total*100).toFixed(1)}%)`);
    console.log(`  not_fetched: ${stats.fullTextNotFetched} (${(stats.fullTextNotFetched/stats.total*100).toFixed(1)}%)`);

    // Health Score
    const healthScore = (
      (stats.withUrl / stats.total) * 0.2 +
      (stats.withAbstract / stats.total) * 0.2 +
      (stats.hasFullTextDetected / stats.total) * 0.3 +
      (stats.fullTextSuccess / Math.max(stats.hasFullTextDetected, 1)) * 0.3
    ) * 100;

    console.log(`\n🔍 Pipeline Health Score: ${healthScore.toFixed(1)}%`);
    
    if (healthScore >= 90) {
      console.log(`   Status: ✅ EXCELLENT`);
    } else if (healthScore >= 70) {
      console.log(`   Status: ⚠️  GOOD`);
    } else if (healthScore >= 50) {
      console.log(`   Status: ⚠️  FAIR`);
    } else {
      console.log(`   Status: ❌ POOR`);
    }

    // Issues Summary
    console.log(`\n🔍 Issues Summary:`);
    const papersWithIssues = papers.filter(p => {
      return (
        (!p.url && !p.doi) ||
        (p.hasFullText && !p.pdfUrl) ||
        (p.fullTextStatus === 'success' && !p.fullText) ||
        (p.fullTextStatus === 'failed')
      );
    });

    console.log(`   Papers with issues: ${papersWithIssues.length}/${stats.total}`);
    
    if (papersWithIssues.length > 0) {
      console.log(`\n   Sample issues:`);
      papersWithIssues.slice(0, 5).forEach((p, i) => {
        const issues: string[] = [];
        if (!p.url && !p.doi) issues.push('No URL/DOI');
        if (p.hasFullText && !p.pdfUrl) issues.push('hasFullText but no pdfUrl');
        if (p.fullTextStatus === 'success' && !p.fullText) issues.push('Status success but no content');
        if (p.fullTextStatus === 'failed') issues.push('Extraction failed');
        
        console.log(`   ${i + 1}. ${p.title?.substring(0, 50)}... - ${issues.join(', ')}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ANALYSIS COMPLETE');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('\n❌ Analysis failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

analyzePapers();

