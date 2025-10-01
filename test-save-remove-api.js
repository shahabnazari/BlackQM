const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// Test paper to save (only fields allowed by SavePaperDto)
const testPaper = {
  title: 'Test Paper for Save/Remove Functionality',
  authors: ['John Doe', 'Jane Smith'],
  year: 2024,
  abstract: 'This is a test paper for testing save and remove functionality.',
  venue: 'Test Conference',
  citationCount: 42,
  tags: ['test-tag'],
  doi: '10.1234/test.2024',
  url: 'https://example.com/test-paper',
};

// Full paper data (includes fields not in SavePaperDto)
const fullPaper = {
  id: 'test-paper-123',
  ...testPaper,
  source: 'test',
  keywords: ['testing', 'development'],
};

async function testSaveRemove() {
  try {
    console.log('🧪 Testing Save/Remove API Endpoints\n');

    // 1. Test public save endpoint
    console.log('1️⃣ Testing public save endpoint...');
    let savedPaperId;
    try {
      const saveRes = await axios.post(
        `${API_BASE}/literature/save/public`,
        testPaper
      );
      console.log('✅ Save successful:', saveRes.data);
      savedPaperId = saveRes.data.paperId || fullPaper.id;
    } catch (error) {
      console.error(
        '❌ Save failed:',
        error.response?.status,
        error.response?.data || error.message
      );
      savedPaperId = fullPaper.id; // Use fallback ID for testing
    }

    // 2. Test public library endpoint
    console.log('\n2️⃣ Testing public library endpoint...');
    try {
      const libraryRes = await axios.get(
        `${API_BASE}/literature/library/public`
      );
      console.log('✅ Library retrieved:', {
        total: libraryRes.data.total,
        papers: libraryRes.data.papers.length,
      });

      // Check if our test paper is in the library
      const found = libraryRes.data.papers.find(
        p => p.title === testPaper.title
      );
      if (found) {
        console.log('✅ Test paper found in library');
        savedPaperId = found.id; // Update with actual ID from database
      }
    } catch (error) {
      console.error(
        '❌ Library retrieval failed:',
        error.response?.status,
        error.response?.data || error.message
      );
    }

    // 3. Test public remove endpoint
    console.log('\n3️⃣ Testing public remove endpoint...');
    if (savedPaperId) {
      try {
        const removeRes = await axios.delete(
          `${API_BASE}/literature/library/public/${savedPaperId}`
        );
        console.log('✅ Remove successful:', removeRes.data);
      } catch (error) {
        console.error(
          '❌ Remove failed:',
          error.response?.status,
          error.response?.data || error.message
        );
      }
    } else {
      console.log('⚠️ No paper ID to remove');
    }

    // 4. Verify paper was removed
    console.log('\n4️⃣ Verifying paper was removed...');
    try {
      const libraryRes = await axios.get(
        `${API_BASE}/literature/library/public`
      );
      const found = libraryRes.data.papers.find(
        p => p.title === testPaper.title
      );
      if (!found) {
        console.log('✅ Paper successfully removed from library');
      } else {
        console.log('⚠️ Paper still in library after remove');
      }
    } catch (error) {
      console.error(
        '❌ Library verification failed:',
        error.response?.status,
        error.response?.data || error.message
      );
    }

    // 5. Test authenticated endpoints (should fail with 401)
    console.log('\n5️⃣ Testing authenticated endpoints (should fail)...');
    try {
      await axios.post(`${API_BASE}/literature/save`, testPaper);
      console.log('⚠️ Authenticated save should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authenticated save correctly requires auth (401)');
      } else {
        console.error('❌ Unexpected error:', error.response?.status);
      }
    }

    console.log('\n✨ Tests complete!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run tests
testSaveRemove();
