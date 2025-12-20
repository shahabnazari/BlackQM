/**
 * Diagnostic script to test OpenAlex journal metrics retrieval
 *
 * This script checks:
 * 1. If OpenAlex works endpoint returns source info
 * 2. If source has summary_stats with journal metrics
 * 3. If separate sources endpoint returns more data
 */

import axios from 'axios';

const OPENALEX_BASE = 'https://api.openalex.org';
const USER_AGENT = 'BlackQMethod-Research-Platform (mailto:research@blackqmethod.com)';

// Test DOIs - a mix of well-known journals
const TEST_DOIS = [
  '10.1038/nature12373',    // Nature
  '10.1126/science.1259855', // Science
  '10.1016/j.cell.2020.02.052', // Cell
  '10.1371/journal.pone.0185809', // PLOS ONE
  '10.3389/fpsyg.2021.721195', // Frontiers
];

interface SourceInfo {
  id: string;
  display_name: string;
  issn_l?: string;
  summary_stats?: {
    h_index?: number;
    i10_index?: number;
    '2yr_mean_citedness'?: number;
  };
}

interface WorkResult {
  id: string;
  title: string;
  primary_location?: {
    source?: SourceInfo;
  };
}

async function testWorkEndpoint(doi: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing DOI: ${doi}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch work by DOI
    const workUrl = `${OPENALEX_BASE}/works/doi:${encodeURIComponent(doi)}`;
    console.log(`\n📥 Fetching work: ${workUrl}`);

    const workResponse = await axios.get(workUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    const work = workResponse.data as WorkResult;
    console.log(`✅ Work found: "${work.title?.substring(0, 60)}..."`);

    // Step 2: Check source info in work response
    const source = work.primary_location?.source;
    if (!source) {
      console.log(`❌ No source info in work response`);
      return;
    }

    console.log(`\n📚 Source in work response:`);
    console.log(`   Name: ${source.display_name}`);
    console.log(`   ID: ${source.id}`);
    console.log(`   ISSN-L: ${source.issn_l || 'N/A'}`);

    // Check summary_stats in work response
    if (source.summary_stats) {
      console.log(`\n📊 summary_stats in work response:`);
      console.log(`   h_index: ${source.summary_stats.h_index ?? 'N/A'}`);
      console.log(`   i10_index: ${source.summary_stats.i10_index ?? 'N/A'}`);
      console.log(`   2yr_mean_citedness: ${source.summary_stats['2yr_mean_citedness'] ?? 'N/A'}`);
    } else {
      console.log(`\n⚠️  NO summary_stats in work response!`);
    }

    // Step 3: Fetch source directly
    const sourceId = source.id.split('/').pop();
    const sourceUrl = `${OPENALEX_BASE}/sources/${sourceId}`;
    console.log(`\n📥 Fetching source directly: ${sourceUrl}`);

    const sourceResponse = await axios.get(sourceUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000,
    });

    const fullSource = sourceResponse.data as SourceInfo;
    console.log(`\n📊 summary_stats from source endpoint:`);
    if (fullSource.summary_stats) {
      console.log(`   h_index: ${fullSource.summary_stats.h_index ?? 'N/A'}`);
      console.log(`   i10_index: ${fullSource.summary_stats.i10_index ?? 'N/A'}`);
      console.log(`   2yr_mean_citedness: ${fullSource.summary_stats['2yr_mean_citedness'] ?? 'N/A'}`);
    } else {
      console.log(`   ❌ Still no summary_stats from source endpoint!`);
    }

  } catch (error) {
    const err = error as { message?: string; response?: { status?: number } };
    console.log(`❌ Error: ${err.message || 'Unknown error'}`);
    if (err.response?.status) {
      console.log(`   Status: ${err.response.status}`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  OpenAlex Journal Metrics Diagnostic                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTesting ${TEST_DOIS.length} papers...\n`);

  let withMetrics = 0;
  let withoutMetrics = 0;

  for (const doi of TEST_DOIS) {
    await testWorkEndpoint(doi);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Papers tested: ${TEST_DOIS.length}`);
  console.log(`\n💡 If summary_stats is missing from work response but present`);
  console.log(`   in source endpoint, that's the root cause!`);
  console.log(`\n   Solution: Ensure getJournalMetrics() is always called`);
  console.log(`   for papers with sourceInfo.id to fetch full source data.`);
}

main().catch(console.error);
