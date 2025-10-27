/**
 * Literature to Theme Extraction Flow Test
 *
 * Tests the complete flow from literature search to theme extraction
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';
const TEST_USER = {
  email: 'researcher@test.com',
  password: 'password123',
};

let authToken = null;
let client = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(icon, message, color = colors.reset) {
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    return response.data.accessToken;
  } catch (error) {
    log('❌', `Authentication failed: ${error.message}`, colors.red);
    throw error;
  }
}

function createAuthenticatedClient(token) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

async function testStep1_SearchPapers() {
  log('📚', 'STEP 1: Searching for papers...', colors.cyan);

  try {
    const response = await client.post('/literature/search', {
      query: 'machine learning climate prediction',
      limit: 5,
    });

    log('✅', `Found ${response.data.papers.length} papers`, colors.green);

    if (response.data.papers.length > 0) {
      const paper = response.data.papers[0];
      log('📄', `Sample: "${paper.title}" (${paper.year})`, colors.blue);
      return response.data.papers.map(p => p.id);
    }

    return [];
  } catch (error) {
    log('❌', `Search failed: ${error.message}`, colors.red);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    throw error;
  }
}

async function testStep2_SavePapers() {
  log('\n💾', 'STEP 2: Saving papers to library...', colors.cyan);

  try {
    // First search for a paper
    const searchResponse = await client.post('/literature/search', {
      query: 'machine learning',
      limit: 1,
    });

    if (searchResponse.data.papers.length === 0) {
      log('⚠️ ', 'No papers found to save', colors.yellow);
      return null;
    }

    const paper = searchResponse.data.papers[0];

    // Save the paper (note: paperId is NOT in SavePaperDto, papers are saved without pre-existing ID)
    const saveResponse = await client.post('/literature/save', {
      title: paper.title,
      authors: paper.authors || ['Unknown'],
      year: paper.year || 2024,
      abstract: paper.abstract || 'No abstract available',
      doi: paper.doi,
      url: paper.url,
      venue: paper.venue,
      citationCount: paper.citationCount || 0,
      tags: ['test', 'machine-learning'],
    });

    log(
      '✅',
      `Paper saved with ID: ${saveResponse.data.paperId}`,
      colors.green
    );
    return saveResponse.data.paperId;
  } catch (error) {
    log('❌', `Save failed: ${error.message}`, colors.red);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return null;
  }
}

async function testStep3_GetLibrary() {
  log('\n📖', 'STEP 3: Retrieving user library...', colors.cyan);

  try {
    const response = await client.get('/literature/library', {
      params: { page: 1, limit: 10 },
    });

    log(
      '✅',
      `Library contains ${response.data.papers.length} papers`,
      colors.green
    );
    log('📊', `Total papers in database: ${response.data.total}`, colors.blue);

    return response.data.papers.map(p => p.id);
  } catch (error) {
    log('❌', `Library retrieval failed: ${error.message}`, colors.red);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return [];
  }
}

async function testStep4_ExtractThemes(paperIds) {
  log('\n🎨', 'STEP 4: Extracting themes...', colors.cyan);

  if (!paperIds || paperIds.length === 0) {
    log(
      '⚠️ ',
      'No paper IDs provided, skipping theme extraction',
      colors.yellow
    );
    return [];
  }

  log('📝', `Extracting themes from ${paperIds.length} papers`, colors.blue);
  log('📄', `Paper IDs: ${paperIds.join(', ')}`, colors.blue);

  try {
    const response = await client.post('/literature/themes', {
      paperIds: paperIds,
    });

    log('✅', `Extracted ${response.data.length} themes`, colors.green);

    if (response.data.length > 0) {
      const theme = response.data[0];
      log('\n🎨', 'Sample Theme:', colors.cyan);
      log('  ', `Label: ${theme.label}`, colors.blue);
      log(
        '  ',
        `Keywords: ${theme.keywords?.join(', ') || 'none'}`,
        colors.blue
      );
      log('  ', `Papers: ${theme.papers?.length || 0}`, colors.blue);
      log('  ', `Weight: ${theme.weight}`, colors.blue);
      if (theme.description) {
        log('  ', `Description: ${theme.description}`, colors.blue);
      }
    } else {
      log(
        '⚠️ ',
        'No themes extracted - papers may lack abstracts',
        colors.yellow
      );
    }

    return response.data;
  } catch (error) {
    log('❌', `Theme extraction failed: ${error.message}`, colors.red);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log(
        'Response data:',
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}

async function testStep5_ThemesToStatements(paperIds) {
  log('\n📊', 'STEP 5: Converting themes to statements...', colors.cyan);

  if (!paperIds || paperIds.length === 0) {
    log(
      '⚠️ ',
      'No paper IDs provided, skipping statement generation',
      colors.yellow
    );
    return null;
  }

  try {
    const response = await client.post(
      '/literature/pipeline/themes-to-statements',
      {
        paperIds: paperIds,
        studyContext: {
          targetStatements: 30,
          researchQuestion: 'What factors influence machine learning adoption?',
        },
      }
    );

    const themes = response.data.themes || [];
    const statements = response.data.statements || [];

    log(
      '✅',
      `Generated ${statements.length} statements from ${themes.length} themes`,
      colors.green
    );

    if (statements.length > 0) {
      const stmt = statements[0];
      log('\n📄', 'Sample Statement:', colors.cyan);
      log('  ', `Text: ${stmt.text}`, colors.blue);
      log('  ', `Category: ${stmt.category || 'none'}`, colors.blue);
      log('  ', `Source: ${stmt.source || 'theme'}`, colors.blue);
    }

    return response.data;
  } catch (error) {
    log('❌', `Statement generation failed: ${error.message}`, colors.red);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
    return null;
  }
}

async function testStep6_ErrorCases() {
  log('\n🧪', 'STEP 6: Testing error cases...', colors.cyan);

  // Test empty paper list
  try {
    const response = await client.post('/literature/themes', {
      paperIds: [],
    });
    log('✅', 'Empty paper list handled correctly', colors.green);
  } catch (error) {
    log('❌', `Empty paper list test failed: ${error.message}`, colors.red);
  }

  // Test non-existent paper IDs
  try {
    const response = await client.post('/literature/themes', {
      paperIds: ['non-existent-1', 'non-existent-2'],
    });
    log(
      '✅',
      `Non-existent IDs handled correctly (returned ${response.data.length} themes)`,
      colors.green
    );
  } catch (error) {
    log('❌', `Non-existent ID test failed: ${error.message}`, colors.red);
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('🚀', 'LITERATURE TO THEME EXTRACTION FLOW TEST', colors.cyan);
  console.log('='.repeat(60) + '\n');

  try {
    // Authenticate
    log('🔐', 'Authenticating...', colors.cyan);
    authToken = await getAuthToken();
    client = createAuthenticatedClient(authToken);
    log('✅', 'Authentication successful', colors.green);

    // Run test steps
    const searchPaperIds = await testStep1_SearchPapers();
    await testStep2_SavePapers();
    const libraryPaperIds = await testStep3_GetLibrary();
    const themes = await testStep4_ExtractThemes(libraryPaperIds);
    await testStep5_ThemesToStatements(libraryPaperIds);
    await testStep6_ErrorCases();

    console.log('\n' + '='.repeat(60));
    log('🎉', 'ALL TESTS COMPLETED', colors.green);
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log('💥', 'TEST FAILED', colors.red);
    console.log('='.repeat(60));
    console.error('\nError details:', error.message);
    if (error.response) {
      console.log('\nAPI Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
runAllTests();
