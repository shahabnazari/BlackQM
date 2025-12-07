/**
 * End-to-End Literature Search Test
 * Tests all fixes: PMC, CORE, Springer
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:4000/api';
const SEARCH_QUERY = 'impact of roof design on energy efficiency';

// Test user credentials
const TEST_USER = {
  email: 'test@vqmethod.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

console.log('🧪 END-TO-END LITERATURE SEARCH TEST');
console.log('=====================================\n');

/**
 * Make HTTP POST request
 */
function post(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Make authenticated POST request
 */
function authPost(url, data, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Main test flow
 */
async function runTest() {
  try {
    // Step 1: Try to login (if user exists) or register
    console.log('📝 Step 1: Authenticating...');
    let token;

    // Try login first
    const loginRes = await post(`${API_BASE}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (loginRes.status === 200 || loginRes.status === 201) {
      token = loginRes.data.accessToken || loginRes.data.access_token;
      console.log('✅ Login successful');
    } else {
      // Register new user
      console.log('   User not found, registering...');
      const registerRes = await post(`${API_BASE}/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name
      });

      if (registerRes.status === 200 || registerRes.status === 201) {
        token = registerRes.data.accessToken || registerRes.data.access_token;
        console.log('✅ Registration successful');
      } else {
        console.log('❌ Authentication failed:', registerRes.data);
        return;
      }
    }

    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Execute literature search
    console.log('🔍 Step 2: Executing Literature Search...');
    console.log(`   Query: "${SEARCH_QUERY}"`);
    console.log('   Searching across all sources...\n');

    const startTime = Date.now();

    const searchRes = await authPost(`${API_BASE}/literature/search`, {
      query: SEARCH_QUERY,
      limit: 50
    }, token);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (searchRes.status !== 200) {
      console.log('❌ Search failed:', searchRes.data);
      return;
    }

    const results = searchRes.data;
    console.log(`✅ Search completed in ${duration}s\n`);

    // Step 3: Analyze results by source
    console.log('📊 Step 3: Analyzing Results by Source...');
    console.log('=========================================\n');

    const papers = results.papers || [];
    const sourceStats = {};

    // Count papers by source
    papers.forEach(paper => {
      const source = paper.source || 'unknown';
      if (!sourceStats[source]) {
        sourceStats[source] = 0;
      }
      sourceStats[source]++;
    });

    // Display results
    const fixedSources = ['PMC', 'CORE', 'SPRINGER'];
    const workingSources = ['CROSSREF', 'ARXIV', 'PUBMED', 'SSRN'];

    console.log('🔧 FIXED SOURCES (should have papers):');
    console.log('---------------------------------------');

    let pmc = sourceStats['PMC'] || 0;
    let core = sourceStats['CORE'] || 0;
    let springer = sourceStats['SPRINGER'] || 0;

    console.log(`   PMC:      ${pmc.toString().padStart(4)} papers ${pmc > 0 ? '✅' : '❌ FAILED - expected ~400'}`);
    console.log(`   CORE:     ${core.toString().padStart(4)} papers ${core > 0 ? '✅' : '❌ FAILED - expected >0'}`);
    console.log(`   Springer: ${springer.toString().padStart(4)} papers ${springer > 0 ? '✅' : '❌ FAILED - expected ~15-25'}`);
    console.log('');

    console.log('✅ WORKING SOURCES (should continue working):');
    console.log('----------------------------------------------');

    workingSources.forEach(source => {
      const count = sourceStats[source] || 0;
      console.log(`   ${source.padEnd(10)}: ${count.toString().padStart(4)} papers ${count > 0 ? '✅' : '⚠️'}`);
    });
    console.log('');

    // Step 4: Overall statistics
    console.log('📈 Step 4: Overall Statistics');
    console.log('=============================\n');

    const totalPapers = papers.length;
    const previousTotal = 762;  // From original problem
    const expectedTotal = 1135;  // Lower bound of expected
    const improvement = totalPapers - previousTotal;
    const improvementPercent = ((improvement / previousTotal) * 100).toFixed(1);

    console.log(`   Total Papers Found: ${totalPapers}`);
    console.log(`   Previous Total:     ${previousTotal}`);
    console.log(`   Expected Total:     ${expectedTotal}+`);
    console.log(`   Improvement:        +${improvement} papers (+${improvementPercent}%)`);
    console.log('');

    if (totalPapers >= expectedTotal) {
      console.log('   ✅ SUCCESS: Total meets or exceeds expectations!');
    } else {
      console.log(`   ⚠️  WARNING: Total is ${expectedTotal - totalPapers} papers below expected`);
    }
    console.log('');

    // Step 5: Sample papers from fixed sources
    console.log('📚 Step 5: Sample Papers from Fixed Sources');
    console.log('============================================\n');

    const pmcPapers = papers.filter(p => p.source === 'PMC').slice(0, 2);
    const corePapers = papers.filter(p => p.source === 'CORE').slice(0, 2);
    const springerPapers = papers.filter(p => p.source === 'SPRINGER').slice(0, 2);

    if (pmcPapers.length > 0) {
      console.log('PMC Papers:');
      pmcPapers.forEach((paper, idx) => {
        console.log(`   ${idx + 1}. ${paper.title.substring(0, 80)}...`);
        console.log(`      DOI: ${paper.doi || 'N/A'}`);
      });
      console.log('');
    }

    if (corePapers.length > 0) {
      console.log('CORE Papers:');
      corePapers.forEach((paper, idx) => {
        console.log(`   ${idx + 1}. ${paper.title.substring(0, 80)}...`);
        console.log(`      DOI: ${paper.doi || 'N/A'}`);
      });
      console.log('');
    }

    if (springerPapers.length > 0) {
      console.log('Springer Papers:');
      springerPapers.forEach((paper, idx) => {
        console.log(`   ${idx + 1}. ${paper.title.substring(0, 80)}...`);
        console.log(`      DOI: ${paper.doi || 'N/A'}`);
      });
      console.log('');
    }

    // Final verdict
    console.log('🎯 FINAL VERDICT');
    console.log('================\n');

    const pmcFixed = pmc > 0;
    const coreFixed = core > 0;
    const springerFixed = springer > 0;
    const totalImproved = totalPapers > previousTotal;

    const allFixed = pmcFixed && coreFixed && springerFixed;

    if (allFixed && totalImproved) {
      console.log('✅ SUCCESS! All fixes are working correctly!');
      console.log('   - PMC returns papers ✅');
      console.log('   - CORE returns papers ✅');
      console.log('   - Springer returns papers ✅');
      console.log(`   - Total improved by ${improvement} papers ✅`);
    } else {
      console.log('⚠️  PARTIAL SUCCESS - Some issues detected:');
      if (!pmcFixed) console.log('   - PMC still returning 0 papers ❌');
      if (!coreFixed) console.log('   - CORE still returning 0 papers ❌');
      if (!springerFixed) console.log('   - Springer still returning 0 papers ❌');
      if (!totalImproved) console.log(`   - Total not improved ❌`);
    }

    console.log('\n📋 Detailed source breakdown:');
    Object.keys(sourceStats)
      .sort((a, b) => sourceStats[b] - sourceStats[a])
      .forEach(source => {
        console.log(`   ${source.padEnd(15)}: ${sourceStats[source]} papers`);
      });

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runTest();
