/**
 * Phase 10.197: Simple Full-Text Detection Test
 *
 * Uses axios to test Unpaywall API directly on papers from DB
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const UNPAYWALL_EMAIL = 'research@blackq.app';

interface DetectionResult {
  doi: string;
  title: string;
  detected: boolean;
  source: string;
  url: string | null;
  isOA: boolean;
}

async function checkUnpaywall(doi: string): Promise<{ isOA: boolean; pdfUrl: string | null; source: string }> {
  try {
    const url = `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${UNPAYWALL_EMAIL}`;
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    if (data.is_oa && data.best_oa_location?.url_for_pdf) {
      return { isOA: true, pdfUrl: data.best_oa_location.url_for_pdf, source: 'unpaywall_pdf' };
    }
    if (data.is_oa && data.best_oa_location?.url) {
      return { isOA: true, pdfUrl: data.best_oa_location.url, source: 'unpaywall_html' };
    }
    return { isOA: data.is_oa || false, pdfUrl: null, source: 'unpaywall_closed' };
  } catch {
    return { isOA: false, pdfUrl: null, source: 'unpaywall_error' };
  }
}

async function checkPMC(doi: string): Promise<{ found: boolean; url: string | null }> {
  try {
    // Check if DOI is in PMC via NCBI API
    const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids=${encodeURIComponent(doi)}&format=json`;
    const response = await axios.get(url, { timeout: 5000 });
    const records = response.data?.records || [];
    if (records.length > 0 && records[0].pmcid) {
      return { found: true, url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${records[0].pmcid}/` };
    }
    return { found: false, url: null };
  } catch {
    return { found: false, url: null };
  }
}

async function checkCORE(title: string): Promise<{ found: boolean; url: string | null }> {
  try {
    // CORE requires API key, skip for now
    return { found: false, url: null };
  } catch {
    return { found: false, url: null };
  }
}

async function main() {
  console.log('🚀 Simple Full-Text Detection Test');
  console.log('='.repeat(70));

  // Get papers with DOIs that don't have full text
  const papers = await prisma.paper.findMany({
    where: {
      doi: { not: null },
      hasFullText: false,
    },
    select: {
      id: true,
      title: true,
      doi: true,
    },
    take: 30,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n📄 Testing ${papers.length} papers without full-text\n`);

  const results: DetectionResult[] = [];
  let detected = 0;
  let oaCount = 0;

  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    const progress = `[${i + 1}/${papers.length}]`;
    const doi = paper.doi!;

    // Check Unpaywall first (most reliable)
    const unpaywall = await checkUnpaywall(doi);

    if (unpaywall.pdfUrl) {
      detected++;
      oaCount++;
      console.log(`${progress} ✅ DETECTED (Unpaywall): ${paper.title?.substring(0, 50)}...`);
      console.log(`       URL: ${unpaywall.pdfUrl.substring(0, 70)}...`);
      results.push({
        doi,
        title: paper.title || '',
        detected: true,
        source: unpaywall.source,
        url: unpaywall.pdfUrl,
        isOA: true,
      });
      continue;
    }

    // Check PMC
    const pmc = await checkPMC(doi);
    if (pmc.found) {
      detected++;
      console.log(`${progress} ✅ DETECTED (PMC): ${paper.title?.substring(0, 50)}...`);
      console.log(`       URL: ${pmc.url}`);
      results.push({
        doi,
        title: paper.title || '',
        detected: true,
        source: 'pmc',
        url: pmc.url,
        isOA: true,
      });
      continue;
    }

    if (unpaywall.isOA) {
      oaCount++;
    }

    console.log(`${progress} ❌ NOT FOUND: ${paper.title?.substring(0, 50)}...`);
    results.push({
      doi,
      title: paper.title || '',
      detected: false,
      source: unpaywall.source,
      url: null,
      isOA: unpaywall.isOA,
    });

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 DETECTION RESULTS');
  console.log('='.repeat(70));

  const detectionRate = (detected / papers.length * 100).toFixed(1);
  const oaRate = (oaCount / papers.length * 100).toFixed(1);

  console.log(`\n📈 Summary:`);
  console.log(`   Total papers: ${papers.length}`);
  console.log(`   ✅ Full-text detected: ${detected} (${detectionRate}%)`);
  console.log(`   📖 Open Access: ${oaCount} (${oaRate}%)`);
  console.log(`   ❌ Not found: ${papers.length - detected} (${(100 - parseFloat(detectionRate)).toFixed(1)}%)`);

  console.log(`\n📊 Detection by Source:`);
  const bySource: Record<string, number> = {};
  for (const r of results) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  }
  for (const [source, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${source}: ${count}`);
  }

  console.log('\n' + '='.repeat(70));

  // Also check papers that DO have full text to see what sources worked
  console.log('\n📊 Checking successful extractions in database...');

  const successfulPapers = await prisma.paper.groupBy({
    by: ['fullTextSource'],
    where: { hasFullText: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log('\n📊 Full-Text Sources in Database:');
  for (const s of successfulPapers) {
    if (s.fullTextSource) {
      console.log(`   ${s.fullTextSource}: ${s._count.id}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
