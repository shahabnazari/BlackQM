/**
 * Phase 10.197: Live Full-Text Detection Test
 *
 * Tests the 8-tier Intelligent Full-Text Detection Service
 * on real papers from the database to measure detection rate.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';
import { IntelligentFullTextDetectionService } from '../src/modules/literature/services/intelligent-fulltext-detection.service';

const prisma = new PrismaClient();

interface DetectionStats {
  total: number;
  detected: number;
  notDetected: number;
  errors: number;
  byTier: Record<string, number>;
  byConfidence: Record<string, number>;
  bySource: Record<string, number>;
  avgDurationMs: number;
  samples: Array<{
    title: string;
    doi: string;
    detected: boolean;
    method: string;
    confidence: string;
    url: string | null;
  }>;
}

async function main() {
  console.log('🚀 Starting Live Full-Text Detection Test');
  console.log('='.repeat(70));

  // Bootstrap NestJS app to get the detection service
  console.log('\n📦 Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const detectionService = app.get(IntelligentFullTextDetectionService);
  console.log('✅ Detection service initialized');

  // Get papers with DOIs that don't have full text yet
  console.log('\n📄 Fetching papers to test...');
  const papers = await prisma.paper.findMany({
    where: {
      doi: { not: null },
      hasFullText: false,
    },
    select: {
      id: true,
      title: true,
      doi: true,
      url: true,
      source: true,
      pmid: true,
    },
    take: 50, // Test on 50 papers
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Found ${papers.length} papers without full-text to test`);

  if (papers.length === 0) {
    console.log('⚠️  No papers found. Getting papers with full-text to verify detection...');
    const papersWithFullText = await prisma.paper.findMany({
      where: {
        doi: { not: null },
        hasFullText: true,
      },
      select: {
        id: true,
        title: true,
        doi: true,
        url: true,
        source: true,
        pmid: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    papers.push(...papersWithFullText);
    console.log(`📊 Using ${papers.length} papers with full-text for verification`);
  }

  const stats: DetectionStats = {
    total: papers.length,
    detected: 0,
    notDetected: 0,
    errors: 0,
    byTier: {},
    byConfidence: {},
    bySource: {},
    avgDurationMs: 0,
    samples: [],
  };

  let totalDuration = 0;

  console.log('\n🔍 Running detection on papers...\n');

  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    const progress = `[${i + 1}/${papers.length}]`;

    try {
      // Convert to detection format
      const paperForDetection = {
        id: paper.id,
        title: paper.title || '',
        doi: paper.doi || undefined,
        url: paper.url || undefined,
        externalIds: paper.pmid ? { PubMedCentral: paper.pmid } : {},
      };

      const startTime = Date.now();
      const result = await detectionService.detectFullText(paperForDetection, {
        maxTiers: 6, // Skip AI tier for speed
        skipDatabaseCheck: true, // Force re-detection
      });
      const duration = Date.now() - startTime;
      totalDuration += duration;

      if (result.isAvailable) {
        stats.detected++;
        console.log(`${progress} ✅ DETECTED: ${paper.title?.substring(0, 50)}...`);
        console.log(`       Method: ${result.detectionMethod} | Confidence: ${result.confidence} | URL: ${result.primaryUrl?.substring(0, 60)}...`);
      } else {
        stats.notDetected++;
        console.log(`${progress} ❌ NOT FOUND: ${paper.title?.substring(0, 50)}...`);
      }

      // Track stats
      const method = result.detectionMethod || 'none';
      stats.byTier[method] = (stats.byTier[method] || 0) + 1;

      const confidence = result.confidence || 'none';
      stats.byConfidence[confidence] = (stats.byConfidence[confidence] || 0) + 1;

      if (result.sources) {
        for (const source of result.sources) {
          stats.bySource[source] = (stats.bySource[source] || 0) + 1;
        }
      }

      // Store sample
      if (stats.samples.length < 20) {
        stats.samples.push({
          title: paper.title?.substring(0, 60) || 'Untitled',
          doi: paper.doi || 'N/A',
          detected: result.isAvailable,
          method: result.detectionMethod || 'none',
          confidence: result.confidence || 'none',
          url: result.primaryUrl || null,
        });
      }

    } catch (error) {
      stats.errors++;
      console.log(`${progress} ⚠️  ERROR: ${paper.title?.substring(0, 50)}... - ${(error as Error).message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  stats.avgDurationMs = totalDuration / papers.length;

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 LIVE DETECTION TEST RESULTS');
  console.log('='.repeat(70));

  const detectionRate = (stats.detected / stats.total * 100).toFixed(1);

  console.log('\n📈 Overall Results:');
  console.log(`   Total papers tested: ${stats.total}`);
  console.log(`   ✅ Detected: ${stats.detected} (${detectionRate}%)`);
  console.log(`   ❌ Not found: ${stats.notDetected} (${(stats.notDetected / stats.total * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  Errors: ${stats.errors} (${(stats.errors / stats.total * 100).toFixed(1)}%)`);
  console.log(`   ⏱️  Avg detection time: ${stats.avgDurationMs.toFixed(0)}ms`);

  console.log('\n📊 Detection by Method (Tier):');
  const sortedTiers = Object.entries(stats.byTier).sort((a, b) => b[1] - a[1]);
  for (const [tier, count] of sortedTiers) {
    console.log(`   ${tier}: ${count} (${(count / stats.total * 100).toFixed(1)}%)`);
  }

  console.log('\n📊 Detection by Confidence:');
  const sortedConfidence = Object.entries(stats.byConfidence).sort((a, b) => b[1] - a[1]);
  for (const [conf, count] of sortedConfidence) {
    console.log(`   ${conf}: ${count} (${(count / stats.total * 100).toFixed(1)}%)`);
  }

  console.log('\n📊 Detection by Source:');
  const sortedSources = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);
  for (const [source, count] of sortedSources) {
    console.log(`   ${source}: ${count}`);
  }

  console.log('\n📄 Sample Results:');
  for (const sample of stats.samples.slice(0, 10)) {
    const icon = sample.detected ? '✅' : '❌';
    console.log(`   ${icon} ${sample.title}...`);
    console.log(`      DOI: ${sample.doi} | Method: ${sample.method} | Confidence: ${sample.confidence}`);
    if (sample.url) {
      console.log(`      URL: ${sample.url.substring(0, 70)}...`);
    }
  }

  // Grade
  console.log('\n' + '='.repeat(70));
  let grade = 'F';
  if (parseFloat(detectionRate) >= 80) grade = 'A+';
  else if (parseFloat(detectionRate) >= 70) grade = 'A';
  else if (parseFloat(detectionRate) >= 60) grade = 'B+';
  else if (parseFloat(detectionRate) >= 50) grade = 'B';
  else if (parseFloat(detectionRate) >= 40) grade = 'C';
  else if (parseFloat(detectionRate) >= 30) grade = 'D';

  console.log(`\n🎯 DETECTION RATE: ${detectionRate}% (Grade: ${grade})`);
  console.log('\n📝 Note: Detection rate shows WHERE full-text CAN be found.');
  console.log('   Actual extraction rate depends on PDF parsing & content access.');
  console.log('='.repeat(70));

  await app.close();
  await prisma.$disconnect();
}

main().catch(console.error);
