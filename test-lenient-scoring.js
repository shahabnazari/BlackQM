/**
 * Phase 10.1 Day 12: Test Lenient Scoring
 *
 * Demonstrates the difference between strict and lenient thresholds
 */

// Import quality scoring functions
const {
  calculateCitationImpactScore,
  calculateJournalPrestigeScore,
  calculateContentDepthScore,
  calculateQualityScore,
  getQualityTier,
} = require('./backend/dist/modules/literature/utils/paper-quality.util');

console.log('═══════════════════════════════════════════════════════════');
console.log('  LENIENT SCORING TEST - Phase 10.1 Day 12');
console.log('═══════════════════════════════════════════════════════════\n');

// Test Papers
const testPapers = [
  {
    name: 'Typical Quality Paper',
    citationsPerYear: 2,
    impactFactor: 2.0,
    quartile: 'Q2',
    wordCount: 1000,
  },
  {
    name: 'Good Journal, Few Citations',
    citationsPerYear: 1,
    impactFactor: 3.5,
    quartile: 'Q1',
    wordCount: 1500,
  },
  {
    name: 'Highly Cited, Lower Journal',
    citationsPerYear: 10,
    impactFactor: 1.5,
    quartile: 'Q3',
    wordCount: 3000,
  },
  {
    name: 'Sage Article (Real Example)',
    citationsPerYear: 19.4, // 175 citations / 9 years
    impactFactor: 4.91,
    quartile: 'Q1',
    hIndexJournal: 201,
    wordCount: 1500,
  },
  {
    name: 'Emerging Journal Paper',
    citationsPerYear: 0.5,
    impactFactor: 1.0,
    quartile: 'Q4',
    wordCount: 800,
  },
  {
    name: 'Preprint (No Journal)',
    citationsPerYear: 5,
    impactFactor: null,
    quartile: null,
    wordCount: 2000,
  },
];

console.log('Testing ' + testPapers.length + ' papers with LENIENT thresholds:\n');

testPapers.forEach((paper, index) => {
  console.log('─────────────────────────────────────────────────────────');
  console.log(`📄 Paper ${index + 1}: ${paper.name}`);
  console.log('─────────────────────────────────────────────────────────');

  // Calculate component scores
  const citationScore = calculateCitationImpactScore(paper.citationsPerYear);
  const journalScore = calculateJournalPrestigeScore({
    impactFactor: paper.impactFactor,
    quartile: paper.quartile,
    hIndex: paper.hIndexJournal || null,
  });
  const contentScore = calculateContentDepthScore(paper.wordCount);

  // Calculate final score
  const finalScore =
    citationScore * 0.4 + journalScore * 0.35 + contentScore * 0.25;
  const tier = getQualityTier(finalScore);

  console.log('\nInput Metrics:');
  console.log(`  • Citations/year: ${paper.citationsPerYear}`);
  console.log(`  • Impact Factor: ${paper.impactFactor || 'N/A'}`);
  console.log(`  • Quartile: ${paper.quartile || 'N/A'}`);
  if (paper.hIndexJournal) {
    console.log(`  • h-index: ${paper.hIndexJournal}`);
  }
  console.log(`  • Word Count: ${paper.wordCount}`);

  console.log('\nComponent Scores (0-100):');
  console.log(`  • Citation Impact (40%): ${citationScore.toFixed(1)}`);
  console.log(`  • Journal Prestige (35%): ${journalScore.toFixed(1)}`);
  console.log(`  • Content Depth (25%): ${contentScore.toFixed(1)}`);

  console.log('\n' + '═'.repeat(57));
  console.log(`  FINAL SCORE: ${finalScore.toFixed(1)} / 100`);
  console.log(`  TIER: ${tier}`);
  console.log('═'.repeat(57) + '\n');
});

console.log('\n' + '═'.repeat(57));
console.log('  KEY IMPROVEMENTS WITH LENIENT SCORING');
console.log('═'.repeat(57));
console.log('\n✅ Citations: 2/year now scores 50 points (was ~35)');
console.log('✅ Journal: IF=2 now scores 24 points (was 12) - DOUBLED');
console.log('✅ Journal: h=20 now scores 24 points (was 12) - DOUBLED');
console.log('✅ Content: 1000 words now scores 50 points (was 40)');
console.log('\n🎯 Result: More papers reach "Good" (≥50) tier!');
console.log('🎯 Typical quality papers no longer penalized\n');
