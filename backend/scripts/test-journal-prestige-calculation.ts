/**
 * Quick test to verify journal prestige calculation works correctly
 */

import {
  calculateQualityScore,
  calculateJournalPrestigeScore,
  calculateMetadataCompleteness
} from '../src/modules/literature/utils/paper-quality.util';
import { LiteratureSource } from '../src/modules/literature/dto/literature.dto';

// Test data from real OpenAlex enrichment logs
const testCases = [
  {
    name: 'Nature paper',
    impactFactor: 21.90,
    hIndexJournal: 1812,
    quartile: 'Q1' as const,
  },
  {
    name: 'arXiv paper',
    impactFactor: 0.53,
    hIndexJournal: 687,
    quartile: 'Q1' as const,
  },
  {
    name: 'Scientific Reports paper',
    impactFactor: 4.91,
    hIndexJournal: 438,
    quartile: 'Q1' as const,
  },
  {
    name: 'PLOS ONE paper',
    impactFactor: 3.36,
    hIndexJournal: 579,
    quartile: 'Q1' as const,
  },
  {
    name: 'No journal metrics',
    impactFactor: undefined,
    hIndexJournal: undefined,
    quartile: undefined,
  },
];

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  Journal Prestige Calculation Test                       ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Test 1: Direct calculateJournalPrestigeScore
console.log('=== TEST 1: calculateJournalPrestigeScore ===\n');
for (const tc of testCases) {
  const score = calculateJournalPrestigeScore({
    impactFactor: tc.impactFactor,
    hIndex: tc.hIndexJournal,
    quartile: tc.quartile,
    sjrScore: undefined,
  });
  console.log(`${tc.name}:`);
  console.log(`  Input: IF=${tc.impactFactor ?? 'N/A'}, h-index=${tc.hIndexJournal ?? 'N/A'}, Quartile=${tc.quartile ?? 'N/A'}`);
  console.log(`  Output: journalPrestige = ${score}`);
  console.log();
}

// Test 2: Full calculateQualityScore
console.log('\n=== TEST 2: Full calculateQualityScore ===\n');
for (const tc of testCases) {
  const paper = {
    citationCount: 100,
    year: 2023,
    wordCount: 5000,
    venue: 'Test Journal',
    source: LiteratureSource.SEMANTIC_SCHOLAR,
    impactFactor: tc.impactFactor,
    sjrScore: null as number | null,
    quartile: tc.quartile,
    hIndexJournal: tc.hIndexJournal,
    fwci: undefined,
    isOpenAccess: false,
    hasDataCode: false,
    altmetricScore: undefined,
  };

  const result = calculateQualityScore(paper);
  console.log(`${tc.name}:`);
  console.log(`  Input: IF=${tc.impactFactor ?? 'N/A'}, h-index=${tc.hIndexJournal ?? 'N/A'}, Quartile=${tc.quartile ?? 'N/A'}`);
  console.log(`  journalPrestige: ${result.journalPrestige}`);
  console.log(`  totalScore: ${result.totalScore}`);
  console.log(`  citationImpact: ${result.citationImpact}`);
  console.log(`  recencyBoost: ${result.recencyBoost}`);
  console.log();
}

// Test 3: Check metadata completeness
console.log('\n=== TEST 3: Metadata Completeness ===\n');
for (const tc of testCases) {
  const paper = {
    citationCount: 100,
    year: 2023,
    abstract: 'This is a long abstract with more than 50 characters for testing purposes.',
    impactFactor: tc.impactFactor,
    sjrScore: null as number | null,
    quartile: tc.quartile,
    hIndexJournal: tc.hIndexJournal,
  };

  const metadata = calculateMetadataCompleteness(paper);
  console.log(`${tc.name}:`);
  console.log(`  hasJournalMetrics: ${metadata.hasJournalMetrics}`);
  console.log(`  completenessScore: ${metadata.completenessScore}%`);
  console.log();
}

console.log('\n✅ Test complete!');
