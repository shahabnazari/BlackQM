const axios = require('axios');

const baseURL = 'http://localhost:3001';

async function testExtraction() {
  try {
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');

    // Create test sources with minimal content
    const testSources = [
      {
        id: 'test-paper-1',
        type: 'paper',
        title: 'Study on Climate Change Impact',
        content: 'This paper explores the impact of climate change on coastal communities. Our research shows that rising sea levels pose significant threats to infrastructure and livelihoods. We conducted a comprehensive survey of 500 households across three coastal regions. The results indicate increasing vulnerability and the need for adaptive strategies. Community resilience was identified as a key factor in successful adaptation.',
        keywords: ['climate change', 'coastal communities', 'adaptation'],
        authors: ['John Doe']
      },
      {
        id: 'test-paper-2',
        type: 'paper',
        title: 'Community Resilience in Disaster Response',
        content: 'This research examines community resilience patterns in disaster scenarios. We found that social cohesion and local leadership are critical factors in effective disaster response. Communities with strong social networks demonstrated better recovery outcomes. The study highlights the importance of proactive community engagement and disaster preparedness programs.',
        keywords: ['resilience', 'disaster', 'community'],
        authors: ['Jane Smith']
      },
      {
        id: 'test-paper-3',
        type: 'paper',
        title: 'Social Networks and Environmental Adaptation',
        content: 'Our analysis focuses on the role of social networks in environmental adaptation processes. Strong interpersonal connections facilitate knowledge sharing and collective action. Communities with dense social networks show higher adaptive capacity. The findings suggest that interventions should prioritize strengthening social bonds alongside technical solutions.',
        keywords: ['social networks', 'adaptation', 'community'],
        authors: ['Bob Johnson']
      }
    ];

    // Test the V2 extraction endpoint
    console.log('🧪 Testing V2 extraction endpoint...');
    console.log('📊 Sources:', testSources.length);
    
    const extractResponse = await axios.post(
      `${baseURL}/literature/themes/extract-themes-v2`,
      {
        sources: testSources,
        purpose: 'qualitative_analysis',
        userExpertiseLevel: 'researcher',
        allowIterativeRefinement: false,
        methodology: 'reflexive_thematic',
        validationLevel: 'rigorous'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Extraction successful!');
    console.log('📈 Response status:', extractResponse.status);
    console.log('🎯 Themes extracted:', extractResponse.data.themes?.length || 0);
    
    if (extractResponse.data.themes && extractResponse.data.themes.length > 0) {
      console.log('\n📝 Sample theme:');
      console.log('  Label:', extractResponse.data.themes[0].label);
      console.log('  Confidence:', extractResponse.data.themes[0].confidence);
      console.log('  Sources:', extractResponse.data.themes[0].sources?.length);
    } else {
      console.log('⚠️ No themes returned!');
      console.log('Full response:', JSON.stringify(extractResponse.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testExtraction();
