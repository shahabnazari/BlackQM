/**
 * Database Audit Script - Paper Title Consistency Check
 *
 * Phase 10.92 Day 3: Bug #4 - Database Schema Inconsistency for Paper Titles
 *
 * Purpose: Audit papers table to find records with missing or problematic titles
 * Run: ts-node backend/scripts/audit-paper-titles.ts
 *
 * @since Phase 10.92 Day 3
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditResult {
  totalPapers: number;
  papersWithTitle: number;
  papersWithoutTitle: number;
  papersWithEmptyTitle: number;
  papersWithWhitespaceOnly: number;
  problematicPapers: Array<{
    id: string;
    title: string | null;
    source: string;
    doi: string | null;
    pmid: string | null;
    userId: string;
    createdAt: Date;
  }>;
  papersBySource: Record<string, { total: number; missingTitle: number }>;
}

async function auditPaperTitles(): Promise<AuditResult> {
  console.log('🔍 Starting Paper Title Audit...\n');
  console.log('═'.repeat(80));

  // Fetch all papers with relevant fields
  const allPapers = await prisma.paper.findMany({
    select: {
      id: true,
      title: true,
      source: true,
      doi: true,
      pmid: true,
      userId: true,
      createdAt: true,
    },
  });

  console.log(`📊 Total papers in database: ${allPapers.length}\n`);

  const result: AuditResult = {
    totalPapers: allPapers.length,
    papersWithTitle: 0,
    papersWithoutTitle: 0,
    papersWithEmptyTitle: 0,
    papersWithWhitespaceOnly: 0,
    problematicPapers: [],
    papersBySource: {},
  };

  // Analyze each paper
  for (const paper of allPapers) {
    // Initialize source tracking
    if (!result.papersBySource[paper.source]) {
      result.papersBySource[paper.source] = { total: 0, missingTitle: 0 };
    }
    result.papersBySource[paper.source].total++;

    // Check title status
    if (!paper.title) {
      // NULL title
      result.papersWithoutTitle++;
      result.papersBySource[paper.source].missingTitle++;
      result.problematicPapers.push(paper);
    } else if (paper.title.length === 0) {
      // Empty string title
      result.papersWithEmptyTitle++;
      result.papersBySource[paper.source].missingTitle++;
      result.problematicPapers.push(paper);
    } else if (paper.title.trim().length === 0) {
      // Whitespace-only title
      result.papersWithWhitespaceOnly++;
      result.papersBySource[paper.source].missingTitle++;
      result.problematicPapers.push(paper);
    } else {
      // Valid title
      result.papersWithTitle++;
    }
  }

  return result;
}

function printAuditReport(result: AuditResult): void {
  console.log('═'.repeat(80));
  console.log('📋 AUDIT REPORT SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  // Overall statistics
  console.log('📊 Overall Statistics:');
  console.log(`   Total Papers: ${result.totalPapers}`);
  console.log(`   ✅ Papers with valid title: ${result.papersWithTitle}`);
  console.log(`   ❌ Papers with NULL title: ${result.papersWithoutTitle}`);
  console.log(`   ❌ Papers with empty title: ${result.papersWithEmptyTitle}`);
  console.log(
    `   ⚠️  Papers with whitespace-only title: ${result.papersWithWhitespaceOnly}`,
  );
  console.log('');

  // Calculate percentage
  const problematicCount =
    result.papersWithoutTitle +
    result.papersWithEmptyTitle +
    result.papersWithWhitespaceOnly;
  const problematicPercentage =
    result.totalPapers > 0
      ? ((problematicCount / result.totalPapers) * 100).toFixed(2)
      : '0.00';

  console.log(`🎯 Quality Score:`);
  // ✅ AUDIT FIX (BUG #1): Prevent division by zero
  const validPercentage =
    result.totalPapers > 0
      ? ((result.papersWithTitle / result.totalPapers) * 100).toFixed(2)
      : '0.00';
  console.log(`   Valid Titles: ${validPercentage}%`);
  console.log(
    `   Problematic Titles: ${problematicPercentage}% (${problematicCount} papers)`,
  );
  console.log('');

  // Breakdown by source
  console.log('📚 Breakdown by Source:');
  console.log('─'.repeat(80));
  console.log(
    `${'Source'.padEnd(30)} ${'Total'.padStart(10)} ${'Missing'.padStart(10)} ${'Rate'.padStart(10)}`,
  );
  console.log('─'.repeat(80));

  const sortedSources = Object.entries(result.papersBySource).sort(
    (a, b) => b[1].total - a[1].total,
  );

  for (const [source, stats] of sortedSources) {
    const missingRate =
      stats.total > 0
        ? ((stats.missingTitle / stats.total) * 100).toFixed(1)
        : '0.0';
    const statusIcon = stats.missingTitle > 0 ? '❌' : '✅';

    console.log(
      `${statusIcon} ${source.padEnd(27)} ${String(stats.total).padStart(10)} ${String(stats.missingTitle).padStart(10)} ${(missingRate + '%').padStart(10)}`,
    );
  }
  console.log('─'.repeat(80));
  console.log('');

  // Problematic papers details
  if (result.problematicPapers.length > 0) {
    console.log('❌ PROBLEMATIC PAPERS (Sample of first 20):');
    console.log('─'.repeat(80));

    const sampleSize = Math.min(20, result.problematicPapers.length);
    for (let i = 0; i < sampleSize; i++) {
      const paper = result.problematicPapers[i];
      console.log(`\n${i + 1}. Paper ID: ${paper.id}`);
      // ✅ AUDIT FIX (DX #1): Split long line for readability
      let titleDisplay: string;
      if (paper.title === null) {
        titleDisplay = 'NULL';
      } else if (paper.title === '') {
        titleDisplay = 'EMPTY STRING';
      } else {
        titleDisplay = `"${paper.title}" (whitespace only)`;
      }
      console.log(`   Title: ${titleDisplay}`);
      console.log(`   Source: ${paper.source}`);
      console.log(`   DOI: ${paper.doi || 'none'}`);
      console.log(`   PMID: ${paper.pmid || 'none'}`);
      console.log(`   User ID: ${paper.userId}`);
      console.log(
        `   Created: ${paper.createdAt.toISOString().split('T')[0]}`,
      );
    }

    if (result.problematicPapers.length > sampleSize) {
      console.log(
        `\n... and ${result.problematicPapers.length - sampleSize} more problematic papers`,
      );
    }
  } else {
    console.log('✅ No problematic papers found! All papers have valid titles.');
  }

  console.log('');
  console.log('═'.repeat(80));
}

function generateRecommendations(result: AuditResult): void {
  const problematicCount =
    result.papersWithoutTitle +
    result.papersWithEmptyTitle +
    result.papersWithWhitespaceOnly;

  console.log('💡 RECOMMENDATIONS:');
  console.log('═'.repeat(80));

  if (problematicCount === 0) {
    console.log('✅ No action needed - all papers have valid titles!');
  } else {
    console.log(
      `\n⚠️  Found ${problematicCount} papers with missing or invalid titles.\n`,
    );

    console.log('📋 Recommended Actions:');
    console.log('');

    console.log('1. Create a database migration to fix these papers:');
    console.log('   • For papers with DOI: Fetch metadata from CrossRef/Semantic Scholar');
    console.log('   • For papers with PMID: Fetch metadata from PubMed');
    console.log('   • For papers without identifiers: Mark for manual review');
    console.log('');

    console.log('2. Run the migration script:');
    console.log('   npm run prisma:migrate:dev');
    console.log('');

    console.log('3. Add database constraint after fixing:');
    console.log('   ALTER TABLE papers ALTER COLUMN title SET NOT NULL;');
    console.log('   (Add to Prisma schema as: title String)');
    console.log('');

    console.log('4. Update all paper save operations to validate title:');
    console.log('   • Ensure title is always present before saving');
    console.log(
      '   • Add server-side validation: if (!title || !title.trim()) throw error',
    );
    console.log('');

    console.log('5. Monitor sources with high failure rates:');
    const problematicSources = Object.entries(result.papersBySource)
      .filter(([_, stats]) => stats.missingTitle > 0)
      .sort((a, b) => b[1].missingTitle - a[1].missingTitle);

    if (problematicSources.length > 0) {
      console.log('   Top problematic sources:');
      for (const [source, stats] of problematicSources.slice(0, 5)) {
        const rate = ((stats.missingTitle / stats.total) * 100).toFixed(1);
        console.log(
          `   • ${source}: ${stats.missingTitle}/${stats.total} (${rate}%)`,
        );
      }
    }
  }

  console.log('');
  console.log('═'.repeat(80));
}

async function main(): void {
  try {
    console.log('');
    console.log('🚀 PHASE 10.92 DAY 3 - PAPER TITLE AUDIT');
    console.log('📅 Date:', new Date().toISOString().split('T')[0]);
    console.log('');

    // Run audit
    const result = await auditPaperTitles();

    // Print report
    printAuditReport(result);

    // Generate recommendations
    generateRecommendations(result);

    console.log('✅ Audit complete!');
    console.log('');
  } catch (error: unknown) {
    // ✅ AUDIT FIX (TYPE #1): Use unknown instead of any for error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Audit failed:', errorMessage);
    if (errorStack) {
      console.error(errorStack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
main();
