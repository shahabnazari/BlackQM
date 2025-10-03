#!/usr/bin/env node
/**
 * Test YouTube Data API v3 integration
 * Verifies the API key is working and returns real video data
 */

require('dotenv').config();
const https = require('https');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TEST_QUERY = 'climate change';

console.log('🔍 Testing YouTube Data API v3...\n');
console.log(`API Key: ${YOUTUBE_API_KEY ? `${YOUTUBE_API_KEY.substring(0, 20)}...` : 'NOT FOUND'}`);
console.log(`Query: "${TEST_QUERY}"\n`);

if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your-youtube-api-key-here') {
  console.error('❌ ERROR: YouTube API key not configured in .env file');
  process.exit(1);
}

const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&q=${encodeURIComponent(TEST_QUERY)}&part=snippet&type=video&maxResults=5&order=relevance`;

https.get(searchUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.error) {
        console.error('❌ YouTube API Error:');
        console.error(`   Code: ${response.error.code}`);
        console.error(`   Message: ${response.error.message}`);
        console.error(`   Details: ${JSON.stringify(response.error.errors, null, 2)}`);
        process.exit(1);
      }

      if (!response.items || response.items.length === 0) {
        console.warn('⚠️  No results returned from YouTube API');
        process.exit(0);
      }

      console.log(`✅ SUCCESS! Retrieved ${response.items.length} real YouTube videos:\n`);

      response.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.snippet.title}`);
        console.log(`   Channel: ${item.snippet.channelTitle}`);
        console.log(`   Published: ${new Date(item.snippet.publishedAt).toLocaleDateString()}`);
        console.log(`   URL: https://www.youtube.com/watch?v=${item.id.videoId}`);
        console.log(`   Description: ${item.snippet.description.substring(0, 100)}...`);
        console.log('');
      });

      console.log('✅ YouTube API integration working correctly!');
      console.log('✅ API key is valid and returning real video data');
      console.log('✅ Demo data can now be safely removed\n');
    } catch (error) {
      console.error('❌ Failed to parse YouTube API response:', error.message);
      console.error('Response:', data);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('❌ Network error:', error.message);
  process.exit(1);
});
