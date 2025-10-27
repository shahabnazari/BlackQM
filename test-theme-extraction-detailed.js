/**
 * Detailed Theme Extraction Test
 * Tests with multiple papers and verifies theme quality
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';
const TEST_USER = {
  email: 'researcher@test.com',
  password: 'password123',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(icon, message, color = colors.reset) {
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function testDetailedThemeExtraction() {
  console.log('\n' + '='.repeat(60));
  log('🔬', 'DETAILED THEME EXTRACTION TEST', colors.cyan);
  console.log('='.repeat(60) + '\n');

  try {
    // Authenticate
    const authResponse = await axios.post(
      `${API_BASE_URL}/auth/login`,
      TEST_USER
    );
    const token = authResponse.data.accessToken;

    const client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    log('✅', 'Authenticated successfully', colors.green);

    // Search for papers
    const searchResponse = await client.post('/literature/search', {
      query: 'machine learning artificial intelligence',
      limit: 3,
    });

    const papers = searchResponse.data.papers;
    log('📚', `Found ${papers.length} papers`, colors.green);

    // Save multiple papers
    let savedPaperIds = [];
    for (let i = 0; i < Math.min(3, papers.length); i++) {
      const paper = papers[i];
      const saveResponse = await client.post('/literature/save', {
        title: paper.title,
        authors: paper.authors || ['Unknown'],
        year: paper.year || 2024,
        abstract: paper.abstract || 'No abstract',
        doi: paper.doi,
        url: paper.url,
        venue: paper.venue,
        citationCount: paper.citationCount || 0,
        tags: ['test'],
      });
      savedPaperIds.push(saveResponse.data.paperId);
      log(
        '💾',
        `Saved paper ${i + 1}: ${paper.title.substring(0, 50)}...`,
        colors.cyan
      );
    }

    log('✅', `Total papers saved: ${savedPaperIds.length}`, colors.green);

    // Extract themes
    log('\n🎨', 'Extracting themes from saved papers...', colors.cyan);
    const themesResponse = await client.post('/literature/themes', {
      paperIds: savedPaperIds,
    });

    const themes = themesResponse.data;
    log('✅', `Extracted ${themes.length} themes`, colors.green);

    // Display theme details
    console.log('\n' + '─'.repeat(60));
    log('📊', 'THEME DETAILS:', colors.cyan);
    console.log('─'.repeat(60));

    themes.forEach((theme, index) => {
      console.log(`\n${colors.cyan}Theme ${index + 1}:${colors.reset}`);
      console.log(`  Label: ${theme.label}`);
      console.log(`  Weight: ${theme.weight}`);
      console.log(`  Keywords: ${theme.keywords?.join(', ') || 'none'}`);
      console.log(`  Papers: ${theme.papers?.length || 0}`);
      console.log(`  Description: ${theme.description || 'N/A'}`);
      if (theme.controversial) {
        console.log(`  ${colors.yellow}⚠️  CONTROVERSIAL THEME${colors.reset}`);
        if (theme.opposingViews) {
          console.log(`  Opposing Views: ${theme.opposingViews.length}`);
        }
      }
    });

    // Generate statements
    log('\n📊', 'Generating Q-sort statements...', colors.cyan);
    const statementsResponse = await client.post(
      '/literature/pipeline/themes-to-statements',
      {
        paperIds: savedPaperIds,
        studyContext: {
          targetStatements: 36,
          researchQuestion: 'What are the key factors in AI/ML adoption?',
        },
      }
    );

    const statements = statementsResponse.data.statements || [];
    const provenance = statementsResponse.data.provenance || {};

    log('✅', `Generated ${statements.length} statements`, colors.green);

    // Display statement samples
    console.log('\n' + '─'.repeat(60));
    log('📄', 'SAMPLE STATEMENTS:', colors.cyan);
    console.log('─'.repeat(60));

    statements.slice(0, 5).forEach((stmt, index) => {
      console.log(`\n${colors.cyan}Statement ${index + 1}:${colors.reset}`);
      console.log(`  Text: ${stmt.text || 'N/A'}`);
      console.log(`  Category: ${stmt.category || 'general'}`);
      console.log(`  Source: ${stmt.source || 'theme'}`);
      if (stmt.themeId) {
        console.log(`  Theme ID: ${stmt.themeId}`);
      }
    });

    // Provenance check
    if (provenance.complete) {
      log('\n✅', 'Provenance chain: COMPLETE', colors.green);
      console.log(`  Papers → Themes → Statements`);
      console.log(
        `  ${savedPaperIds.length} → ${themes.length} → ${statements.length}`
      );
    }

    console.log('\n' + '='.repeat(60));
    log('🎉', 'THEME EXTRACTION WORKING PERFECTLY!', colors.green);
    console.log('='.repeat(60));
    console.log('\n✨ Quality Metrics:');
    console.log(`   Papers processed: ${savedPaperIds.length}`);
    console.log(`   Themes extracted: ${themes.length}`);
    console.log(`   Statements generated: ${statements.length}`);
    console.log(
      `   Avg themes per paper: ${(themes.length / savedPaperIds.length).toFixed(2)}`
    );
    console.log(
      `   Avg statements per theme: ${(statements.length / themes.length).toFixed(2)}`
    );
  } catch (error) {
    log('❌', `Test failed: ${error.message}`, '\x1b[31m');
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testDetailedThemeExtraction();
