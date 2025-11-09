/**
 * Phase 10 Day 30: Batch Process Papers for Full-Text Extraction
 *
 * This script queues all papers that have DOI/PMID/URL but no full-text
 * for background processing using the waterfall system.
 *
 * Run with: npx ts-node src/scripts/batch-process-papers.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LiteratureService } from '../modules/literature/literature.service';
import { PDFQueueService } from '../modules/literature/services/pdf-queue.service';
import { PrismaService } from '../common/prisma.service';

async function batchProcessPapers() {
  console.log('🚀 Starting batch processing of papers...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const pdfQueueService = app.get(PDFQueueService);

  try {
    // Find all papers without full-text that have DOI/PMID/URL
    console.log('📋 Finding papers to process...');
    const papers = await prisma.paper.findMany({
      where: {
        OR: [
          { doi: { not: null } },
          { pmid: { not: null } },
          { url: { not: null } },
        ],
        AND: [
          {
            OR: [
              { fullTextStatus: 'not_fetched' },
              { fullTextStatus: null },
              { fullTextStatus: 'failed' }, // Retry failed papers
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        doi: true,
        pmid: true,
        url: true,
        fullTextStatus: true,
      },
    });

    console.log(`   Found ${papers.length} papers to process\n`);

    if (papers.length === 0) {
      console.log('✅ No papers to process. All papers either have full-text or no sources.');
      await app.close();
      return;
    }

    // Queue each paper
    console.log('📤 Queueing papers for processing...\n');
    let queued = 0;
    for (const paper of papers) {
      try {
        const sources = [
          paper.pmid ? `PMID:${paper.pmid}` : null,
          paper.doi ? `DOI:${paper.doi}` : null,
          paper.url ? 'URL' : null,
        ].filter(Boolean).join(', ');

        console.log(`   Queueing: "${paper.title?.substring(0, 60)}..."`);
        console.log(`      Sources: ${sources}`);
        console.log(`      Status: ${paper.fullTextStatus || 'not_fetched'}`);

        const jobId = await pdfQueueService.addJob(paper.id);
        queued++;

        console.log(`      ✅ Queued with job ID: ${jobId}\n`);
      } catch (error) {
        console.error(`      ❌ Failed to queue paper ${paper.id}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   • Total papers found: ${papers.length}`);
    console.log(`   • Successfully queued: ${queued}`);
    console.log(`   • Failed to queue: ${papers.length - queued}`);

    console.log(`\n🔄 Processing Status:`);
    const stats = pdfQueueService.getStats();
    console.log(`   • Queue length: ${stats.queueLength}`);
    console.log(`   • Total jobs: ${stats.totalJobs}`);
    console.log(`   • Processing: ${stats.processing}`);
    console.log(`   • Completed: ${stats.completed}`);
    console.log(`   • Failed: ${stats.failed}`);
    console.log(`   • Queued: ${stats.queued}`);

    console.log(`\n💡 The queue will process papers in the background.`);
    console.log(`   Check backend logs for progress updates.`);
    console.log(`   Rate limit: 10 papers per minute`);
    console.log(`   Expected completion: ~${Math.ceil(papers.length / 10)} minutes`);

  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run batch processing
batchProcessPapers()
  .then(() => {
    console.log(`\n✅ Batch processing initiated successfully!`);
    console.log(`   Papers are now being processed in the background.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
