require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { detectCompetitorsComprehensive, queryCustomSearchAPI } = require('./comprehensiveCompetitorDetection');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint for comprehensive competitor detection
app.get('/api/test-competitors/:company', async (req, res) => {
  const { company } = req.params;
  const { industry = '' } = req.query;
  
  console.log(`\n🚀 API Request: Comprehensive competitor detection for "${company}"`);
  console.log(`📊 Industry context: ${industry || 'Not specified'}`);
  
  try {
    // Get initial search results
    const searchQuery = `${company} competitors ${industry}`.trim();
    console.log(`🔍 Search query: "${searchQuery}"`);
    
    const searchResults = await queryCustomSearchAPI(searchQuery);
    console.log(`📈 Found ${searchResults.length} initial search results`);
    
    // Run comprehensive competitor detection
    const competitors = await detectCompetitorsComprehensive(company, searchResults);
    
    // Return results
    const response = {
      success: true,
      company: company,
      industry: industry,
      totalCompetitors: competitors.length,
      competitors: competitors,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ API Response: Found ${competitors.length} competitors for "${company}"`);
    res.json(response);
    
  } catch (error) {
    console.error(`❌ API Error for "${company}":`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      company: company,
      industry: industry,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Comprehensive Competitor Detection API',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Comprehensive Competitor Detection API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test-competitors/Cloudfuze?industry=Cloud`);
});

module.exports = app; 