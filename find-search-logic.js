const fs = require('fs');

const filePath = 'backend/src/modules/literature/literature.service.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('=== FILE STATS ===');
console.log(`Total lines: ${lines.length}`);
console.log('');

// Find imports related to relevance/BM25
console.log('=== RELEVANCE/BM25 IMPORTS ===');
lines.forEach((line, idx) => {
  if (line.includes('relevance') || line.includes('BM25') || line.includes('bm25')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
console.log('');

// Find where papers are scored
console.log('=== PAPER SCORING LOCATIONS ===');
lines.forEach((line, idx) => {
  if (line.includes('relevanceScore') || line.includes('calculateRelevance')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
console.log('');

// Find main search method
console.log('=== SEARCH METHOD SIGNATURES ===');
lines.forEach((line, idx) => {
  if (line.match(/async\s+search|searchLiterature|async\s+\w+Search/)) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
console.log('');

// Find metadata construction
console.log('=== METADATA CONSTRUCTION ===');
lines.forEach((line, idx) => {
  if (line.includes('qualityWeights') || line.includes('qualificationCriteria')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
