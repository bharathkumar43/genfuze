require('dotenv').config();
const { detectCompetitorsEnhanced } = require('./enhancedCompetitorDetection');

async function testEnhancedCompetitorDetection() {
  console.log('🚀 Starting Enhanced Competitor Detection Test');
  console.log('=' .repeat(60));
  
  // Test cases with different companies and industries
  const testCases = [
    { company: 'OpenAI', industry: 'AI' },
    { company: 'Cloudfuze', industry: 'Cloud' },
    { company: 'Salesforce', industry: 'CRM' },
    { company: 'Microsoft', industry: 'Technology' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🎯 Testing: ${testCase.company} in ${testCase.industry} industry`);
    console.log('=' .repeat(60));
    
    try {
      const competitors = await detectCompetitorsEnhanced(testCase.company, testCase.industry);
      
      console.log(`\n✅ RESULTS for ${testCase.company}:`);
      console.log(`📊 Total Competitors Found: ${competitors.length}`);
      console.log(`📊 Final Competitors:`);
      
      competitors.forEach((competitor, index) => {
        console.log(`   ${index + 1}. ${competitor}`);
      });
      
      console.log('\n' + '=' .repeat(60));
      
    } catch (error) {
      console.error(`❌ Test failed for ${testCase.company}:`, error.message);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🏁 Enhanced competitor detection test completed!');
}

// Run the test
if (require.main === module) {
  testEnhancedCompetitorDetection()
    .then(() => {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedCompetitorDetection }; 