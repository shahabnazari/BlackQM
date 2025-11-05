/**
 * Phase 10 Day 5.7 Stage 2 Phase 2: Cohen's Kappa Calculator
 * Theme Quality Validation Tool
 *
 * Purpose: Calculate inter-rater reliability for theme extraction quality
 * Target: κ ≥ 0.6 (substantial agreement)
 */

/**
 * Calculate Cohen's Kappa coefficient
 * @param {number[][]} ratings - 2D array of ratings from two raters
 * @returns {Object} Kappa coefficient and interpretation
 */
function calculateCohensKappa(ratings) {
  const n = ratings.length;
  if (n === 0) {
    throw new Error('No ratings provided');
  }

  // Count agreements and disagreements
  let agreements = 0;
  const rater1Counts = {};
  const rater2Counts = {};

  for (let i = 0; i < n; i++) {
    const [r1, r2] = ratings[i];

    if (r1 === r2) {
      agreements++;
    }

    rater1Counts[r1] = (rater1Counts[r1] || 0) + 1;
    rater2Counts[r2] = (rater2Counts[r2] || 0) + 1;
  }

  // Calculate observed agreement (P_o)
  const observedAgreement = agreements / n;

  // Calculate expected agreement (P_e)
  const categories = new Set([
    ...Object.keys(rater1Counts),
    ...Object.keys(rater2Counts),
  ]);

  let expectedAgreement = 0;
  for (const category of categories) {
    const p1 = (rater1Counts[category] || 0) / n;
    const p2 = (rater2Counts[category] || 0) / n;
    expectedAgreement += p1 * p2;
  }

  // Calculate Cohen's Kappa
  const kappa = (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

  // Interpretation
  let interpretation, status;
  if (kappa >= 0.81) {
    interpretation = 'Almost perfect agreement';
    status = 'EXCELLENT';
  } else if (kappa >= 0.61) {
    interpretation = 'Substantial agreement';
    status = 'PASS';
  } else if (kappa >= 0.41) {
    interpretation = 'Moderate agreement';
    status = 'MARGINAL';
  } else if (kappa >= 0.21) {
    interpretation = 'Fair agreement';
    status = 'FAIL';
  } else if (kappa >= 0.00) {
    interpretation = 'Slight agreement';
    status = 'FAIL';
  } else {
    interpretation = 'Poor agreement (worse than chance)';
    status = 'FAIL';
  }

  return {
    kappa: kappa.toFixed(3),
    observedAgreement: (observedAgreement * 100).toFixed(1) + '%',
    expectedAgreement: (expectedAgreement * 100).toFixed(1) + '%',
    interpretation,
    status,
    meetsThreshold: kappa >= 0.6,
  };
}

/**
 * Example usage with theme ratings
 * Rating scale:
 *   1 = Highly Relevant
 *   2 = Somewhat Relevant
 *   3 = Not Relevant
 *   4 = Incorrect
 */
function exampleUsage() {
  console.log('═══════════════════════════════════════════════════');
  console.log('Cohen\'s Kappa Calculator - Theme Quality Validation');
  console.log('═══════════════════════════════════════════════════\n');

  // Example: Test Set 1 (Medical Research - Diabetes)
  console.log('Test Set 1: Medical Research (Diabetes Management)\n');

  const testSet1Ratings = [
    [1, 1], // Theme 1: Both raters agree - Highly Relevant
    [1, 1], // Theme 2: Both raters agree - Highly Relevant
    [2, 2], // Theme 3: Both raters agree - Somewhat Relevant
    [1, 2], // Theme 4: Rater 1 says Highly, Rater 2 says Somewhat
    [1, 1], // Theme 5: Both raters agree - Highly Relevant
    [2, 1], // Theme 6: Rater 1 says Somewhat, Rater 2 says Highly
    [1, 1], // Theme 7: Both raters agree - Highly Relevant
    [3, 2], // Theme 8: Disagreement
    [1, 1], // Theme 9: Both raters agree - Highly Relevant
    [2, 2], // Theme 10: Both raters agree - Somewhat Relevant
  ];

  const result1 = calculateCohensKappa(testSet1Ratings);
  console.log('Ratings (Rater1, Rater2):');
  testSet1Ratings.forEach((rating, i) => {
    console.log(`  Theme ${i + 1}: [${rating[0]}, ${rating[1]}]`);
  });
  console.log('\nResults:');
  console.log(`  Cohen's Kappa: ${result1.kappa}`);
  console.log(`  Observed Agreement: ${result1.observedAgreement}`);
  console.log(`  Expected Agreement: ${result1.expectedAgreement}`);
  console.log(`  Interpretation: ${result1.interpretation}`);
  console.log(`  Status: ${result1.status}`);
  console.log(`  Meets Threshold (≥0.6): ${result1.meetsThreshold ? '✅ YES' : '❌ NO'}\n`);

  // Example: Test Set 2 (Climate Science - Ocean Acidification)
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Test Set 2: Climate Science (Ocean Acidification)\n');

  const testSet2Ratings = [
    [1, 1],
    [1, 1],
    [1, 1],
    [2, 2],
    [1, 1],
    [1, 2],
    [1, 1],
    [2, 2],
    [1, 1],
    [1, 1],
  ];

  const result2 = calculateCohensKappa(testSet2Ratings);
  console.log('Ratings (Rater1, Rater2):');
  testSet2Ratings.forEach((rating, i) => {
    console.log(`  Theme ${i + 1}: [${rating[0]}, ${rating[1]}]`);
  });
  console.log('\nResults:');
  console.log(`  Cohen's Kappa: ${result2.kappa}`);
  console.log(`  Observed Agreement: ${result2.observedAgreement}`);
  console.log(`  Expected Agreement: ${result2.expectedAgreement}`);
  console.log(`  Interpretation: ${result2.interpretation}`);
  console.log(`  Status: ${result2.status}`);
  console.log(`  Meets Threshold (≥0.6): ${result2.meetsThreshold ? '✅ YES' : '❌ NO'}\n`);

  // Example: Test Set 3 (Computer Science - Quantum Computing)
  console.log('═══════════════════════════════════════════════════\n');
  console.log('Test Set 3: Computer Science (Quantum Computing)\n');

  const testSet3Ratings = [
    [1, 1],
    [1, 1],
    [2, 2],
    [1, 1],
    [1, 1],
    [2, 1],
    [1, 1],
    [1, 1],
  ];

  const result3 = calculateCohensKappa(testSet3Ratings);
  console.log('Ratings (Rater1, Rater2):');
  testSet3Ratings.forEach((rating, i) => {
    console.log(`  Theme ${i + 1}: [${rating[0]}, ${rating[1]}]`);
  });
  console.log('\nResults:');
  console.log(`  Cohen's Kappa: ${result3.kappa}`);
  console.log(`  Observed Agreement: ${result3.observedAgreement}`);
  console.log(`  Expected Agreement: ${result3.expectedAgreement}`);
  console.log(`  Interpretation: ${result3.interpretation}`);
  console.log(`  Status: ${result3.status}`);
  console.log(`  Meets Threshold (≥0.6): ${result3.meetsThreshold ? '✅ YES' : '❌ NO'}\n`);

  // Overall Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('OVERALL SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');

  const allKappas = [
    parseFloat(result1.kappa),
    parseFloat(result2.kappa),
    parseFloat(result3.kappa),
  ];
  const avgKappa = (allKappas.reduce((sum, k) => sum + k, 0) / allKappas.length).toFixed(3);

  console.log('Test Set Results:');
  console.log(`  Test Set 1 (Medical): κ = ${result1.kappa} (${result1.status})`);
  console.log(`  Test Set 2 (Climate): κ = ${result2.kappa} (${result2.status})`);
  console.log(`  Test Set 3 (Computer Sci): κ = ${result3.kappa} (${result3.status})`);
  console.log('\nOverall:');
  console.log(`  Average Cohen's Kappa: ${avgKappa}`);
  console.log(`  Threshold: ≥0.6 (Substantial Agreement)`);

  const overallPass = parseFloat(avgKappa) >= 0.6;
  console.log(`  Status: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);

  if (overallPass) {
    console.log('\n🎉 Theme quality validation PASSED!');
    console.log('   AI-extracted themes show substantial agreement with expert judgment.');
  } else {
    console.log('\n⚠️  Theme quality validation FAILED.');
    console.log('   AI-extracted themes need improvement to match expert judgment.');
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

// Run example if executed directly
if (require.main === module) {
  exampleUsage();
}

// Export for use in other scripts
module.exports = {
  calculateCohensKappa,
};
