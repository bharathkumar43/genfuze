require('dotenv').config();
const { detectCompetitorsComprehensive, queryCustomSearchAPI } = require('./comprehensiveCompetitorDetection');

async function testComprehensiveCompetitorDetection() {
  console.log('🚀 Starting Comprehensive Competitor Detection Test');
  console.log('=' .repeat(60));
  
  // Test company
  const testCompany = 'Cloudfuze';
  const testIndustry = 'Cloud';
  
  console.log(`🎯 Target Company: ${testCompany}`);
  console.log(`📊 Industry Context: ${testIndustry}`);
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get initial search results
    console.log('\n📡 Step 1: Getting initial search results...');
    const searchQuery = `${testCompany} competitors ${testIndustry}`.trim();
    console.log(`🔍 Search query: "${searchQuery}"`);
    
    const searchResults = await queryCustomSearchAPI(searchQuery);
    console.log(`📈 Found ${searchResults.length} initial search results`);
    
    // Step 2: Run comprehensive competitor detection
    console.log('\n🔍 Step 2: Running comprehensive competitor detection...');
    console.log('=' .repeat(60));
    
    const competitors = await detectCompetitorsComprehensive(testCompany, searchResults);
    
    // Step 3: Display final results
    console.log('\n🎉 COMPREHENSIVE COMPETITOR DETECTION COMPLETE');
    console.log('=' .repeat(60));
    console.log(`📊 Target Company: ${testCompany}`);
    console.log(`📊 Industry: ${testIndustry}`);
    console.log(`📊 Total Competitors Found: ${competitors.length}`);
    console.log(`📊 Final Competitors:`);
    
    competitors.forEach((competitor, index) => {
      console.log(`   ${index + 1}. ${competitor}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testComprehensiveCompetitorDetection()
    .then(() => {
      console.log('\n🏁 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testComprehensiveCompetitorDetection }; 