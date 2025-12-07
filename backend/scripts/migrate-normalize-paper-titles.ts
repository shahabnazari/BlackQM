/**
 * Database Migration Script - Normalize Paper Titles
 *
 * Phase 10.92 Day 3: Bug #4 - Database Schema Inconsistency for Paper Titles
 *
 * Purpose: Fix papers with missing or invalid titles by fetching from external sources
 * Run: ts-node backend/scripts/migrate-normalize-paper-titles.ts
 *
 * IMPORTANT: Run audit script first to understand scope
 * ts-node backend/scripts/audit-paper-titles.ts
 *
 * @since Phase 10.92 Day 3
 */

import { PrismaClient } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs'; // ✅ AUDIT FIX (TYPE #3): ES6 import instead of require

const prisma = new PrismaClient();
const httpService = new HttpService();

interface MigrationResult {
  total: number;
  fixed: number;
  failed: number;
  skipped: number;
  details: Array<{
    id: string;
    status: 'fixed' | 'failed' | 'skipped';
    oldTitle: string | null;
    newTitle: string | null;
    source: string;
    method: string;
    error?: string;
  }>;
}

interface PaperToFix {
  id: string;
  title: string | null;
  source: string;
  doi: string | null;
  pmid: string | null;
  userId: string;
}

/**
 * Fetch title from DOI using CrossRef API
 */
async function fetchTitleFromDOI(doi: string): Promise<string | null> {
  try {
    console.log(`   🔍 Fetching from CrossRef DOI: ${doi}`);

    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const response = await firstValueFrom(
      httpService.get(url, {
        headers: {
          'User-Agent': 'VQMethod-Research-Platform/1.0 (mailto:admin@vqmethod.com)',
        },
        timeout: 10000,
      }),
    );

    const title = response.data?.message?.title?.[0];
    if (title && title.trim().length > 0) {
      console.log(`   ✅ Found title: "${title.substring(0, 60)}..."`);
      return title.trim();
    }

    console.log(`   ⚠️  DOI found but no title in response`);
    return null;
  } catch (error: unknown) {
    // ✅ AUDIT FIX (TYPE #1): Use unknown instead of any for error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ CrossRef API error: ${errorMessage}`);
    return null;
  }
}

/**
 * Fetch title from PMID using PubMed E-utilities API
 */
async function fetchTitleFromPMID(pmid: string): Promise<string | null> {
  try {
    console.log(`   🔍 Fetching from PubMed PMID: ${pmid}`);

    // ✅ AUDIT FIX (BUG #3): Validate PMID format to prevent injection
    if (!/^\d+$/.test(pmid)) {
      console.log(`   ❌ Invalid PMID format: ${pmid} (must be digits only)`);
      return null;
    }

    // Use E-utilities esummary endpoint
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;

    const response = await firstValueFrom(
      httpService.get(url, {
        headers: {
          'User-Agent': 'VQMethod-Research-Platform/1.0',
        },
        timeout: 10000,
      }),
    );

    const title = response.data?.result?.[pmid]?.title;
    if (title && title.trim().length > 0) {
      console.log(`   ✅ Found title: "${title.substring(0, 60)}..."`);
      return title.trim();
    }

    console.log(`   ⚠️  PMID found but no title in response`);
    return null;
  } catch (error: unknown) {
    // ✅ AUDIT FIX (TYPE #1): Use unknown instead of any for error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ PubMed API error: ${errorMessage}`);
    return null;
  }
}

/**
 * Fix a single paper's title
 */
async function fixPaperTitle(
  paper: PaperToFix,
  dryRun: boolean = false,
): Promise<{
  status: 'fixed' | 'failed' | 'skipped';
  newTitle: string | null;
  method: string;
  error?: string;
}> {
  console.log(`\n📄 Processing paper ${paper.id}`);
  console.log(`   Source: ${paper.source}`);
  console.log(`   Current title: ${paper.title || 'NULL'}`);
  console.log(`   DOI: ${paper.doi || 'none'}`);
  console.log(`   PMID: ${paper.pmid || 'none'}`);

  // Try DOI first (more reliable)
  if (paper.doi) {
    const title = await fetchTitleFromDOI(paper.doi);
    if (title) {
      if (!dryRun) {
        await prisma.paper.update({
          where: { id: paper.id },
          data: { title },
        });
        console.log(`   ✅ Updated title in database`);
      } else {
        console.log(`   ℹ️  Would update title (DRY RUN)`);
      }
      return { status: 'fixed', newTitle: title, method: 'doi' };
    }
  }

  // Try PMID if DOI failed
  if (paper.pmid) {
    const title = await fetchTitleFromPMID(paper.pmid);
    if (title) {
      if (!dryRun) {
        await prisma.paper.update({
          where: { id: paper.id },
          data: { title },
        });
        console.log(`   ✅ Updated title in database`);
      } else {
        console.log(`   ℹ️  Would update title (DRY RUN)`);
      }
      return { status: 'fixed', newTitle: title, method: 'pmid' };
    }
  }

  // No way to fetch title
  if (!paper.doi && !paper.pmid) {
    console.log(`   ⏭️  Skipped: No DOI or PMID available`);
    return {
      status: 'skipped',
      newTitle: null,
      method: 'none',
      error: 'No DOI or PMID available',
    };
  }

  console.log(`   ❌ Failed: Could not fetch title from any source`);
  return {
    status: 'failed',
    newTitle: null,
    method: 'none',
    error: 'API calls failed',
  };
}

/**
 * Find papers that need title fixes
 */
async function findProblematicPapers(): Promise<PaperToFix[]> {
  console.log('🔍 Finding papers with missing or invalid titles...\n');

  const papers = await prisma.paper.findMany({
    where: {
      OR: [
        { title: null },
        { title: '' },
        // SQLite doesn't support regex, so we'll filter whitespace-only in code
      ],
    },
    select: {
      id: true,
      title: true,
      source: true,
      doi: true,
      pmid: true,
      userId: true,
    },
  });

  // Filter out whitespace-only titles
  const problematic = papers.filter(
    (p) => !p.title || p.title.trim().length === 0,
  );

  console.log(`Found ${problematic.length} papers needing fixes\n`);

  return problematic;
}

/**
 * Run the migration
 */
async function runMigration(
  dryRun: boolean = false,
  limit: number = 0,
): Promise<MigrationResult> {
  console.log('═'.repeat(80));
  console.log('🚀 PHASE 10.92 DAY 3 - PAPER TITLE NORMALIZATION MIGRATION');
  console.log('═'.repeat(80));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '✍️  LIVE (will modify database)'}`);
  console.log(`Limit: ${limit > 0 ? `${limit} papers` : 'All papers'}`);
  console.log('');

  const problematicPapers = await findProblematicPapers();

  if (problematicPapers.length === 0) {
    console.log('✅ No papers need fixing! All titles are valid.');
    return {
      total: 0,
      fixed: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };
  }

  const result: MigrationResult = {
    total: problematicPapers.length,
    fixed: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  const papersToProcess =
    limit > 0 ? problematicPapers.slice(0, limit) : problematicPapers;

  console.log(
    `Processing ${papersToProcess.length} of ${problematicPapers.length} papers...\n`,
  );
  console.log('─'.repeat(80));

  // Process each paper with rate limiting (1 request per second to be nice to APIs)
  for (let i = 0; i < papersToProcess.length; i++) {
    const paper = papersToProcess[i];

    // ✅ AUDIT FIX (DX #3): Add progress indicator
    const progressPercent = ((i + 1) / papersToProcess.length * 100).toFixed(1);
    console.log(`\n[${i + 1}/${papersToProcess.length}] (${progressPercent}%)`);

    const fixResult = await fixPaperTitle(paper, dryRun);

    result.details.push({
      id: paper.id,
      status: fixResult.status,
      oldTitle: paper.title,
      newTitle: fixResult.newTitle,
      source: paper.source,
      method: fixResult.method,
      error: fixResult.error,
    });

    if (fixResult.status === 'fixed') {
      result.fixed++;
    } else if (fixResult.status === 'failed') {
      result.failed++;
    } else {
      result.skipped++;
    }

    // Rate limiting: wait 1 second between requests (except for last one)
    if (i < papersToProcess.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return result;
}

/**
 * Print migration summary
 */
function printMigrationSummary(result: MigrationResult, dryRun: boolean): void {
  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  console.log(`Total papers processed: ${result.total}`);
  console.log(`✅ Fixed: ${result.fixed}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log('');

  if (result.fixed > 0) {
    const successRate = ((result.fixed / result.total) * 100).toFixed(1);
    console.log(`Success rate: ${successRate}%`);
    console.log('');

    console.log('Fixed papers by method:');
    const byMethod = result.details
      .filter((d) => d.status === 'fixed')
      .reduce(
        (acc, d) => {
          acc[d.method] = (acc[d.method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    for (const [method, count] of Object.entries(byMethod)) {
      console.log(`   • ${method.toUpperCase()}: ${count} papers`);
    }
    console.log('');
  }

  if (result.failed > 0) {
    console.log('❌ Failed papers (sample):');
    const failedSample = result.details
      .filter((d) => d.status === 'failed')
      .slice(0, 5);

    for (const detail of failedSample) {
      console.log(`   • ${detail.id} (${detail.source}) - ${detail.error}`);
    }

    if (result.failed > 5) {
      console.log(`   ... and ${result.failed - 5} more`);
    }
    console.log('');
  }

  if (result.skipped > 0) {
    console.log('⏭️  Skipped papers (no DOI/PMID):');
    console.log(`   ${result.skipped} papers need manual review`);
    console.log('');
  }

  if (dryRun) {
    console.log('ℹ️  This was a DRY RUN - no changes were made to the database');
    console.log('   Run without --dry-run flag to apply changes');
  } else {
    console.log('✅ Database has been updated');
  }

  console.log('');
  console.log('═'.repeat(80));
}

/**
 * Main function
 */
async function main(): void {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const limitArg = args.find((arg) => arg.startsWith('--limit='));
    // ✅ AUDIT FIX (BUG #2): Validate parseInt result
    let limit = 0;
    if (limitArg) {
      const parsedLimit = parseInt(limitArg.split('=')[1], 10);
      if (isNaN(parsedLimit) || parsedLimit < 0) {
        console.error('❌ Invalid --limit value. Must be a positive number.');
        process.exit(1);
      }
      limit = parsedLimit;
    }

    if (!dryRun) {
      console.log('⚠️  WARNING: This will modify your database!');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Run migration
    const result = await runMigration(dryRun, limit);

    // Print summary
    printMigrationSummary(result, dryRun);

    // Save detailed report
    // ✅ AUDIT FIX (SEC #2): Add error handling for file write
    const reportPath = `./migration-report-${Date.now()}.json`;
    try {
      fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (writeError: unknown) {
      const errorMessage = writeError instanceof Error ? writeError.message : String(writeError);
      console.warn(`\n⚠️  Could not save detailed report: ${errorMessage}`);
      console.warn('   Migration completed successfully, but report file could not be written.');
    }

    console.log('\n✅ Migration complete!');
    console.log('');
  } catch (error: unknown) {
    // ✅ AUDIT FIX (TYPE #1): Use unknown instead of any for error handling
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('\n❌ Migration failed:', errorMessage);
    if (errorStack) {
      console.error(errorStack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  main();
}

export { runMigration, findProblematicPapers };
