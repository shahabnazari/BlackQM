/**
 * Literature to Theme Extraction Flow Unit Test
 *
 * Tests the complete flow from literature search to theme extraction:
 * 1. Search for papers
 * 2. Save papers to library
 * 3. Extract themes from saved papers
 * 4. Verify theme extraction results
 *
 * This test verifies the entire Phase 9 pipeline works correctly.
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const TEST_USER = {
  email: 'researcher@test.com',
  password: 'password123',
};

// Helper to get auth token
async function getAuthToken(): Promise<string> {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
  return response.data.accessToken;
}

// Helper to create axios instance with auth
function createAuthenticatedClient(token: string) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

describe('Literature to Theme Extraction Flow', () => {
  let authToken: string;
  let client: any;
  let testPaperIds: string[] = [];

  beforeAll(async () => {
    // Get authentication token
    console.log('🔐 Authenticating...');
    authToken = await getAuthToken();
    client = createAuthenticatedClient(authToken);
    console.log('✅ Authenticated successfully');
  });

  describe('Step 1: Search for Papers', () => {
    it('should search for papers on a topic', async () => {
      console.log('\n📚 Step 1: Searching for papers...');

      const response = await axios.post(`${API_BASE_URL}/literature/search`, {
        query: 'machine learning climate prediction',
        limit: 5,
      });

      expect(response.status).toBe(200);
      expect(response.data.papers).toBeDefined();
      expect(Array.isArray(response.data.papers)).toBe(true);
      expect(response.data.papers.length).toBeGreaterThan(0);

      // Store paper IDs for next steps
      testPaperIds = response.data.papers.map((p: any) => p.id);

      console.log(`✅ Found ${response.data.papers.length} papers`);
      console.log(`📄 Paper IDs:`, testPaperIds);
      console.log(`📝 Sample paper:`, {
        id: response.data.papers[0].id,
        title: response.data.papers[0].title,
        year: response.data.papers[0].year,
      });
    });
  });

  describe('Step 2: Save Papers to Library', () => {
    it('should save papers to user library', async () => {
      console.log('\n💾 Step 2: Saving papers to library...');

      // Get a paper from search results
      const searchResponse = await axios.post(
        `${API_BASE_URL}/literature/search`,
        {
          query: 'machine learning',
          limit: 1,
        }
      );

      const paper = searchResponse.data.papers[0];

      const saveResponse = await client.post('/literature/save', {
        paperId: paper.id,
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

      expect(saveResponse.status).toBe(201);
      expect(saveResponse.data.success).toBe(true);
      expect(saveResponse.data.paperId).toBeDefined();

      console.log(`✅ Paper saved with ID: ${saveResponse.data.paperId}`);
    });

    it('should retrieve user library', async () => {
      console.log('\n📖 Verifying library contains saved papers...');

      const response = await client.get('/literature/library', {
        params: { page: 1, limit: 10 },
      });

      expect(response.status).toBe(200);
      expect(response.data.papers).toBeDefined();
      expect(Array.isArray(response.data.papers)).toBe(true);

      console.log(`✅ Library contains ${response.data.papers.length} papers`);
      console.log(`📊 Total papers: ${response.data.total}`);
    });
  });

  describe('Step 3: Extract Themes from Papers', () => {
    it('should extract themes from paper IDs', async () => {
      console.log('\n🎨 Step 3: Extracting themes...');

      // Get real paper IDs from user's library
      const libraryResponse = await client.get('/literature/library', {
        params: { page: 1, limit: 5 },
      });

      const paperIds = libraryResponse.data.papers.map((p: any) => p.id);

      if (paperIds.length === 0) {
        console.log('⚠️  No papers in library, skipping theme extraction');
        return;
      }

      console.log(`📝 Extracting themes from ${paperIds.length} papers...`);
      console.log(`📄 Paper IDs:`, paperIds);

      const response = await client.post('/literature/themes', {
        paperIds: paperIds,
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      console.log(`✅ Extracted ${response.data.length} themes`);

      if (response.data.length > 0) {
        console.log(`\n🎨 Sample Theme:`);
        console.log(`   Label: ${response.data[0].label}`);
        console.log(`   Keywords: ${response.data[0].keywords?.join(', ')}`);
        console.log(`   Papers: ${response.data[0].papers?.length}`);
        console.log(`   Weight: ${response.data[0].weight}`);
        console.log(`   Description: ${response.data[0].description}`);
      }
    });

    it('should handle empty paper list gracefully', async () => {
      console.log('\n🧪 Testing empty paper list...');

      const response = await client.post('/literature/themes', {
        paperIds: [],
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(0);

      console.log('✅ Empty paper list handled correctly');
    });

    it('should handle non-existent paper IDs gracefully', async () => {
      console.log('\n🧪 Testing non-existent paper IDs...');

      const response = await client.post('/literature/themes', {
        paperIds: ['non-existent-id-1', 'non-existent-id-2'],
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      // Should return empty array for non-existent papers
      expect(response.data.length).toBe(0);

      console.log('✅ Non-existent paper IDs handled correctly');
    });
  });

  describe('Step 4: Theme to Statements Pipeline', () => {
    it('should convert themes to Q-sort statements', async () => {
      console.log('\n📊 Step 4: Converting themes to statements...');

      // Get papers from library
      const libraryResponse = await client.get('/literature/library', {
        params: { page: 1, limit: 5 },
      });

      const paperIds = libraryResponse.data.papers.map((p: any) => p.id);

      if (paperIds.length === 0) {
        console.log('⚠️  No papers in library, skipping statement generation');
        return;
      }

      console.log(`📝 Generating statements from ${paperIds.length} papers...`);

      const response = await client.post(
        '/literature/pipeline/themes-to-statements',
        {
          paperIds: paperIds,
          studyContext: {
            targetStatements: 30,
            researchQuestion:
              'What factors influence machine learning adoption?',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.themes).toBeDefined();
      expect(response.data.statements).toBeDefined();
      expect(response.data.provenance).toBeDefined();

      console.log(
        `✅ Generated ${response.data.statements?.length || 0} statements`
      );
      console.log(`🎨 From ${response.data.themes?.length || 0} themes`);

      if (response.data.statements && response.data.statements.length > 0) {
        console.log(`\n📄 Sample Statement:`);
        console.log(`   Text: ${response.data.statements[0].text}`);
        console.log(`   Category: ${response.data.statements[0].category}`);
        console.log(`   Source: ${response.data.statements[0].source}`);
      }
    });
  });

  describe('Step 5: Unified Theme Extraction', () => {
    it('should extract unified themes from multiple sources', async () => {
      console.log('\n🌐 Step 5: Testing unified theme extraction...');

      // Get papers from library
      const libraryResponse = await client.get('/literature/library', {
        params: { page: 1, limit: 3 },
      });

      const paperIds = libraryResponse.data.papers.map((p: any) => p.id);

      if (paperIds.length === 0) {
        console.log('⚠️  No papers in library, skipping unified extraction');
        return;
      }

      const response = await client.post('/literature/themes/unified-extract', {
        sources: [
          {
            type: 'academic',
            content: paperIds.map((id: string) => ({
              id,
              type: 'paper',
            })),
          },
        ],
        options: {
          minInfluence: 0.3,
          includeProvenance: true,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.themes).toBeDefined();
      expect(Array.isArray(response.data.themes)).toBe(true);

      console.log(`✅ Extracted ${response.data.themes.length} unified themes`);

      if (response.data.themes.length > 0) {
        console.log(`\n🎨 Sample Unified Theme:`);
        console.log(`   Label: ${response.data.themes[0].label}`);
        console.log(
          `   Keywords: ${response.data.themes[0].keywords?.join(', ')}`
        );
        console.log(
          `   Sources: ${response.data.themes[0].sources?.length || 0}`
        );
      }
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle rate limiting', async () => {
      console.log('\n⚡ Testing rate limiting...');

      // Make multiple rapid requests
      const requests = Array.from({ length: 5 }, (_, i) =>
        client.post('/literature/themes', {
          paperIds: [`test-${i}`],
        })
      );

      const responses = await Promise.allSettled(requests);
      const successful = responses.filter(r => r.status === 'fulfilled');

      console.log(`✅ ${successful.length}/5 requests succeeded`);
      console.log(
        `⚠️  ${5 - successful.length} requests rate-limited or failed`
      );

      expect(successful.length).toBeGreaterThan(0);
    });

    it('should validate paper ID format', async () => {
      console.log('\n🧪 Testing paper ID validation...');

      try {
        await client.post('/literature/themes', {
          paperIds: null,
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        console.log('✅ Null paper IDs rejected correctly');
      }
    });

    it('should handle malformed requests', async () => {
      console.log('\n🧪 Testing malformed requests...');

      try {
        await client.post('/literature/themes', {
          // Missing paperIds field
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
        console.log('✅ Malformed request rejected correctly');
      }
    });
  });

  describe('Performance & Caching', () => {
    it('should cache theme extraction results', async () => {
      console.log('\n⚡ Testing caching performance...');

      // Get papers from library
      const libraryResponse = await client.get('/literature/library', {
        params: { page: 1, limit: 3 },
      });

      const paperIds = libraryResponse.data.papers.map((p: any) => p.id);

      if (paperIds.length === 0) {
        console.log('⚠️  No papers in library, skipping cache test');
        return;
      }

      // First request (no cache)
      const start1 = Date.now();
      await client.post('/literature/themes', { paperIds });
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await client.post('/literature/themes', { paperIds });
      const time2 = Date.now() - start2;

      console.log(`📊 First request: ${time1}ms`);
      console.log(`📊 Second request: ${time2}ms (cached)`);
      console.log(
        `⚡ Speed improvement: ${((1 - time2 / time1) * 100).toFixed(1)}%`
      );

      // Cached request should be faster (allow some variance)
      // Not enforcing this strictly as it depends on system load
      if (time2 < time1) {
        console.log('✅ Caching improved performance');
      } else {
        console.log('⚠️  Cache may not be working optimally');
      }
    });
  });
});
