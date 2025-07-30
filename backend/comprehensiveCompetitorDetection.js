const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Google Custom Search API with retry logic
async function queryCustomSearchAPI(query) {
  const maxRetries = 3;
  const baseDelay = 2000;
  
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
    throw new Error('Google API credentials not configured');
  }
  
  console.log(`   🔍 Google Search: "${query}"`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   📡 Google Search attempt ${attempt}/${maxRetries}...`);
      const response = await axios.get(
        `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}`
      );
      const results = response.data.items.map(item => ({
        name: item.title,
        link: item.link,
        snippet: item.snippet
      }));
      console.log(`   ✅ Google Search successful: ${results.length} results`);
      return results;
    } catch (error) {
      if (error?.response?.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Rate limited, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      if (attempt === maxRetries) {
        console.error(`   ❌ Google Search failed after ${maxRetries} attempts:`, error.message);
        throw error;
      }
      console.log(`   ⏳ Google Search attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
    }
  }
}

// Method 1: Industry news search
async function searchIndustryNewsCompetitors(companyName) {
  try {
    console.log(`   📰 Method 1: Industry news search for "${companyName}"`);
    
    // Multiple industry news search queries
    const searchQueries = [
      `${companyName} vs competitors`,
      `${companyName} market analysis`,
      `${companyName} industry report`,
      `${companyName} competitive landscape`,
      `${companyName} market share analysis`
    ];
    
    let allSearchResults = [];
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`   🔍 Industry news query ${i + 1}: "${query}"`);
      
      try {
        const searchResults = await queryCustomSearchAPI(query);
        console.log(`   📄 Found ${searchResults.length} results for query ${i + 1}`);
        allSearchResults = allSearchResults.concat(searchResults);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`   ❌ Industry news query ${i + 1} failed:`, error.message);
      }
    }
    
    console.log(`   📊 Total industry news results: ${allSearchResults.length}`);
    const competitors = await extractCompetitorNames(companyName, allSearchResults);
    console.log(`   🎯 Extracted ${competitors.length} competitors from industry news:`, competitors);
    return competitors;
  } catch (error) {
    console.error('❌ Industry news search error:', error.message);
    return [];
  }
}

// Method 2: Public company database search
async function searchPublicCompanyDatabase(companyName) {
  try {
    console.log(`   🏢 Method 2: Public company database search for "${companyName}"`);
    
    // Multiple public database search queries
    const searchQueries = [
      `${companyName} company profile`,
      `${companyName} competitors list`,
      `${companyName} industry competitors`,
      `${companyName} market competitors`,
      `${companyName} business competitors`
    ];
    
    let allSearchResults = [];
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`   🔍 Public database query ${i + 1}: "${query}"`);
      
      try {
        const searchResults = await queryCustomSearchAPI(query);
        console.log(`   📄 Found ${searchResults.length} results for query ${i + 1}`);
        allSearchResults = allSearchResults.concat(searchResults);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`   ❌ Public database query ${i + 1} failed:`, error.message);
      }
    }
    
    console.log(`   📊 Total public database results: ${allSearchResults.length}`);
    const competitors = await extractCompetitorNames(companyName, allSearchResults);
    console.log(`   🎯 Extracted ${competitors.length} competitors from public database:`, competitors);
    return competitors;
  } catch (error) {
    console.error('❌ Public database search error:', error.message);
    return [];
  }
}

// Method 3: Web search with relaxed filtering
async function extractCompetitorsWithRelaxedFiltering(searchResults, companyName) {
  try {
    console.log(`   🌐 Method 3: Web search with relaxed filtering for "${companyName}"`);
    
    // Use existing search results and extract competitors with relaxed criteria
    const competitors = await extractCompetitorNames(companyName, searchResults);
    console.log(`   🎯 Extracted ${competitors.length} competitors with relaxed filtering:`, competitors);
    return competitors;
  } catch (error) {
    console.error('❌ Web search with relaxed filtering error:', error.message);
    return [];
  }
}

// Method 4: Wikipedia-based search
async function searchWikipediaCompetitors(companyName) {
  try {
    console.log(`   📚 Method 4: Wikipedia-based search for "${companyName}"`);
    
    // Multiple Wikipedia search queries
    const searchQueries = [
      `${companyName} wikipedia competitors`,
      `${companyName} wikipedia alternative companies`,
      `${companyName} wikipedia industry companies`,
      `${companyName} wikipedia market companies`
    ];
    
    let allSearchResults = [];
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`   🔍 Wikipedia query ${i + 1}: "${query}"`);
      
      try {
        const searchResults = await queryCustomSearchAPI(query);
        console.log(`   📄 Found ${searchResults.length} results for query ${i + 1}`);
        allSearchResults = allSearchResults.concat(searchResults);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`   ❌ Wikipedia query ${i + 1} failed:`, error.message);
      }
    }
    
    console.log(`   📊 Total Wikipedia results: ${allSearchResults.length}`);
    const competitors = await extractCompetitorNames(companyName, allSearchResults);
    console.log(`   🎯 Extracted ${competitors.length} competitors from Wikipedia:`, competitors);
    return competitors;
  } catch (error) {
    console.error('❌ Wikipedia search error:', error.message);
    return [];
  }
}

// Clean competitor names
function cleanCompetitorNames(names) {
  return names
    .filter(name => name && typeof name === 'string')
    .map(name => name.trim())
    .filter(name => 
      name.length > 0 && 
      !name.toLowerCase().includes('wikipedia') &&
      !name.toLowerCase().includes('linkedin') &&
      !name.toLowerCase().includes('news') &&
      !name.toLowerCase().includes('article')
    );
}

// Extract competitor names from search results using AI
async function extractCompetitorNames(companyName, searchResults) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const searchText = searchResults.map(item => item.name).join('\n');
  
  // Enhanced prompt for better competitor extraction
  const prompt = `Analyze these search results and extract ONLY the competitor company names for "${companyName}".

Instructions:
1. Focus on companies that compete directly with ${companyName}
2. Exclude ${companyName} itself from the results
3. Exclude generic terms like "competitors", "companies", "businesses"
4. Return ONLY a JSON array of company names
5. No explanations, no markdown formatting

Search results:
${searchText}

Return format: ["Company1", "Company2", "Company3"]`;

  console.log(`   🤖 Extracting competitors using AI for "${companyName}"`);
  console.log(`   📄 Analyzing ${searchResults.length} search results`);
  
  const result = await model.generateContent(prompt);
  const response = result.response.candidates[0]?.content?.parts[0]?.text || '';
  
  try {
    // Clean the response to remove markdown formatting
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
    
    // Try to extract JSON array
    const jsonMatch = cleanedResponse.match(/\[.*\]/s);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    const competitors = JSON.parse(cleanedResponse);
    const validCompetitors = Array.isArray(competitors) ? competitors : [];
    
    console.log(`   ✅ AI extracted ${validCompetitors.length} competitors`);
    return validCompetitors;
  } catch (error) {
    console.error('❌ Failed to parse competitor names:', error.message);
    console.error('Raw response:', response);
    return [];
  }
}

// Validate competitors using AI with scoring
async function validateCompetitors(companyName, competitorNames, searchResults) {
  if (!GEMINI_API_KEY) {
    console.log(`   ⚠️ No Gemini API key, returning top 10 competitors without validation`);
    return competitorNames.slice(0, 10);
  }
  
  console.log(`   🤖 Validating ${competitorNames.length} competitors for "${companyName}"`);
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const validatedCompetitors = [];
  
  for (const competitor of competitorNames) {
    try {
      console.log(`   [DEBUG] Validating competitor: ${competitor}`);
      
      const scoringPrompt = `You are a business analyst. Rate how likely it is that ${competitor} is a direct competitor to ${companyName} on a scale of 0-100. Consider factors like:
- Same industry/market
- Similar products/services
- Target customers
- Business model

Return only a number between 0-100.`;
      
      const result = await model.generateContent(scoringPrompt);
      const response = result.response.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract numeric score from response
      const scoreMatch = response.match(/(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      
      console.log(`   [DEBUG] ${competitor} scored ${score}/100 - ${score >= 50 ? 'VALID' : 'REJECTED'}`);
      
      if (score >= 50) {
        validatedCompetitors.push(competitor);
        console.log(`   ✅ ${competitor} validated as competitor`);
      } else {
        console.log(`   ❌ ${competitor} rejected as competitor`);
      }
      
      // Rate limiting between validations
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Error validating ${competitor}:`, error.message);
      // If validation fails, include the competitor as a fallback
      validatedCompetitors.push(competitor);
    }
  }
  
  console.log(`   ✅ Validation complete: ${validatedCompetitors.length} valid competitors`);
  return validatedCompetitors;
}

// Main comprehensive competitor detection function
async function detectCompetitorsComprehensive(companyName, searchResults) {
  console.log('\n🔍 Starting comprehensive competitor detection...');
  const allCompetitors = new Map();
  const methodResults = {};
  
  // Method 1: Industry news search
  console.log('📰 Method 1: Industry news search...');
  let competitors = await searchIndustryNewsCompetitors(companyName);
  await new Promise(resolve => setTimeout(resolve, 2000));
  if (competitors.length > 0) {
    competitors = cleanCompetitorNames(competitors);
    methodResults.industryNews = competitors;
    console.log(`   ✅ Found ${competitors.length} competitors via industry news:`, competitors);
    competitors.forEach(comp => {
      allCompetitors.set(comp, (allCompetitors.get(comp) || 0) + 1);
    });
  } else {
    console.log('   ⚠️ No competitors found via industry news');
  }
  
  // Method 2: Public company database search
  console.log('🏢 Method 2: Public company database search...');
  competitors = await searchPublicCompanyDatabase(companyName);
  await new Promise(resolve => setTimeout(resolve, 2000));
  if (competitors.length > 0) {
    competitors = cleanCompetitorNames(competitors);
    methodResults.publicDatabase = competitors;
    console.log(`   ✅ Found ${competitors.length} competitors via public database:`, competitors);
    competitors.forEach(comp => {
      allCompetitors.set(comp, (allCompetitors.get(comp) || 0) + 1);
    });
  } else {
    console.log('   ⚠️ No competitors found via public database');
  }
  
  // Method 3: Web search with relaxed filtering
  console.log('🌐 Method 3: Web search with relaxed filtering...');
  competitors = await extractCompetitorsWithRelaxedFiltering(searchResults, companyName);
  await new Promise(resolve => setTimeout(resolve, 2000));
  if (competitors.length > 0) {
    competitors = cleanCompetitorNames(competitors);
    methodResults.webSearch = competitors;
    console.log(`   ✅ Found ${competitors.length} competitors via web search:`, competitors);
    competitors.forEach(comp => {
      allCompetitors.set(comp, (allCompetitors.get(comp) || 0) + 1);
    });
  } else {
    console.log('   ⚠️ No competitors found via web search');
  }
  
  // Method 4: Wikipedia-based search
  console.log('📚 Method 4: Wikipedia-based search...');
  competitors = await searchWikipediaCompetitors(companyName);
  await new Promise(resolve => setTimeout(resolve, 2000));
  if (competitors.length > 0) {
    competitors = cleanCompetitorNames(competitors);
    methodResults.wikipedia = competitors;
    console.log(`   ✅ Found ${competitors.length} competitors via Wikipedia:`, competitors);
    competitors.forEach(comp => {
      allCompetitors.set(comp, (allCompetitors.get(comp) || 0) + 1);
    });
  } else {
    console.log('   ⚠️ No competitors found via Wikipedia');
  }
  
  // Combine results and rank by frequency
  console.log('\n📊 Combining results from all methods...');
  console.log('📈 Method results:', methodResults);
  
  const totalUniqueCompetitors = allCompetitors.size;
  console.log(`📊 Total unique competitors found: ${totalUniqueCompetitors}`);
  console.log('📈 Frequency map:', Object.fromEntries(allCompetitors));
  
  // Rank competitors by frequency
  const rankedCompetitors = Array.from(allCompetitors.entries())
    .map(([name, frequency]) => ({ name, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
  
  console.log('📈 Ranked competitors by frequency:');
  rankedCompetitors.forEach((comp, index) => {
    console.log(`   ${index + 1}. ${comp.name} (frequency: ${comp.frequency})`);
  });
  
  // Show detailed method breakdown
  console.log('📊 Detailed method breakdown:');
  rankedCompetitors.forEach(comp => {
    const methods = [];
    if (methodResults.industryNews?.includes(comp.name)) methods.push('industryNews');
    if (methodResults.publicDatabase?.includes(comp.name)) methods.push('publicDatabase');
    if (methodResults.webSearch?.includes(comp.name)) methods.push('webSearch');
    if (methodResults.wikipedia?.includes(comp.name)) methods.push('wikipedia');
    console.log(`   - ${comp.name}: found by ${methods.join(', ')}`);
  });
  
  const competitorNames = rankedCompetitors.map(c => c.name);
  
  // Validate competitors
  console.log('\n✅ Validating competitors with AI...');
  const validatedCompetitors = await validateCompetitors(companyName, competitorNames, searchResults);
  console.log(`🎯 Final validated competitors:`, validatedCompetitors);
  
  return validatedCompetitors;
}

module.exports = {
  detectCompetitorsComprehensive,
  searchIndustryNewsCompetitors,
  searchPublicCompanyDatabase,
  extractCompetitorsWithRelaxedFiltering,
  searchWikipediaCompetitors,
  validateCompetitors,
  extractCompetitorNames,
  cleanCompetitorNames,
  queryCustomSearchAPI
}; 