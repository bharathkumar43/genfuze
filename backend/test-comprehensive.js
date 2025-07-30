const axios = require('axios');

async function testComprehensiveAnalysis() {
  try {
    console.log('🧪 Testing Comprehensive Competitor Analysis...\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful\n');

    // Step 2: Test comprehensive analysis
    console.log('2. Testing comprehensive analysis for google.com...');
    const analysisResponse = await axios.post('http://localhost:5000/api/competitor/comprehensive-analysis', {
      domain: 'google.com',
      userWebsite: 'mycompany.com'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Analysis completed successfully!');
    console.log(`📊 Found ${analysisResponse.data.analysis.competitors.length} competitors`);
    console.log(`🏭 Industry: ${analysisResponse.data.analysis.industry}`);
    console.log(`🆔 Analysis ID: ${analysisResponse.data.analysis.analysisId}\n`);

    // Step 3: Display top 3 competitors
    console.log('3. Top 3 Competitors:');
    analysisResponse.data.analysis.competitors.slice(0, 3).forEach((comp, index) => {
      console.log(`   ${index + 1}. ${comp.name} (${comp.domain})`);
      console.log(`      Overall Score: ${comp.scores.overall}/100`);
      console.log(`      Content: ${comp.scores.content}/100`);
      console.log(`      Citations: ${comp.scores.citation}/100`);
      console.log(`      Rating: ${comp.scores.rating}/100`);
      console.log('');
    });

    // Step 4: Test loading analyses
    console.log('4. Testing load analyses...');
    const loadResponse = await axios.get('http://localhost:5000/api/competitor/comprehensive-analyses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Loaded ${loadResponse.data.analyses.length} previous analyses\n`);

    console.log('🎉 All tests passed! The comprehensive competitor analysis is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testComprehensiveAnalysis(); 