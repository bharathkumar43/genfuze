require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { detectCompetitorsEnhanced } = require('./enhancedCompetitorDetection');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced competitor detection endpoint
app.get('/api/enhanced-competitors/:company', async (req, res) => {
  const { company } = req.params;
  const { industry = '' } = req.query;
  
  console.log(`\n🚀 Enhanced API Request: Competitor detection for "${company}"`);
  console.log(`📊 Industry context: ${industry || 'Not specified'}`);
  
  try {
    // Run enhanced competitor detection
    const competitors = await detectCompetitorsEnhanced(company, industry);
    
    // Return results
    const response = {
      success: true,
      company: company,
      industry: industry,
      totalCompetitors: competitors.length,
      competitors: competitors,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Enhanced API Response: Found ${competitors.length} competitors for "${company}"`);
    res.json(response);
    
  } catch (error) {
    console.error(`❌ Enhanced API Error for "${company}":`, error.message);
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
    service: 'Enhanced Competitor Detection API',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Competitor Detection API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/enhanced-competitors/OpenAI?industry=AI`);
});

module.exports = app; 