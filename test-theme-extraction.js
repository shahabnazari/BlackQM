// Test script to verify theme extraction is working

const axios = require('axios');

async function testThemeExtraction() {
  try {
    console.log('Testing theme extraction endpoint...\n');
    
    // Test the public endpoint
    const response = await axios.post('http://localhost:4000/api/literature/themes/public', {
      paperIds: ['paper-1', 'paper-2', 'paper-3'],
      numThemes: 5
    });
    
    console.log('✅ Theme extraction successful!');
    console.log('\nExtracted themes:');
    response.data.forEach((theme, index) => {
      console.log(`\n${index + 1}. ${theme.name}`);
      console.log(`   Keywords: ${theme.keywords.join(', ')}`);
      console.log(`   Relevance: ${theme.relevanceScore}`);
      console.log(`   Trend: ${theme.trendDirection}`);
    });
    
  } catch (error) {
    console.error('❌ Theme extraction failed:');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testThemeExtraction();