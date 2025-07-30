const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');

// API Keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// AI-specific prompts for each model
function getChatGPTPrompts(company, industry) {
  return [
    `Which companies are leading in ${industry}?`,
    `What are the top companies offering ${industry} solutions in ${industry}?`,
    `Compare ${company} with other companies in the ${industry}.`,
    `How does ${company} leverage AI in ${industry}?`
  ];
}

function getGeminiPrompts(company, industry) {
  return [
    `Which companies are leading in ${industry}?`,
    `What are the top companies offering ${industry} solutions in ${industry}?`,
    `Compare ${company} with other companies in the ${industry}.`,
    `How does ${company} leverage AI in ${industry}?`
  ];
}

function getPerplexityPrompts(company, industry) {
  return [
    `Which companies are leading in ${industry}?`,
    `What are the top companies offering ${industry} solutions in ${industry}?`,
    `Compare ${company} with other companies in the ${industry}.`,
    `How does ${company} leverage AI in ${industry}?`
  ];
}

function getClaudePrompts(company, industry) {
  return [
    `Which companies are leading in ${industry}?`,
    `What are the top companies offering ${industry} solutions in ${industry}?`,
    `Compare ${company} with other companies in the ${industry}.`,
    `How does ${company} leverage AI in ${industry}?`
  ];
}

// Automatic industry and product detection functions
async function detectIndustryAndProduct(companyName) {
  console.log(`🔍 Detecting industry and product for: ${companyName}`);
  
  try {
    // Use Google search to find company information
    const searchQueries = [
      `${companyName} company profile`,
      `${companyName} what do they do`,
      `${companyName} industry sector`,
      `${companyName} products services`
    ];
    
    let allSearchResults = [];
    
    for (const query of searchQueries) {
      try {
        const results = await queryCustomSearchAPI(query);
        allSearchResults = allSearchResults.concat(results);
      } catch (error) {
        console.log(`   ⚠️ Search failed for: ${query}`);
      }
    }
    
    if (allSearchResults.length === 0) {
      console.log(`   ⚠️ No search results found for ${companyName}`);
      return { industry: '', product: '' };
    }
    
    // Use AI to analyze search results and extract industry/product
    const analysisPrompt = `Analyze these search results about "${companyName}" and determine:
1. The primary industry/sector this company operates in
2. The main products/services they offer

Search results:
${allSearchResults.map(item => `${item.name}: ${item.snippet}`).join('\n\n')}

Return ONLY a JSON object with this format:
{
  "industry": "the primary industry",
  "product": "the main product or service"
}`;
    
    if (GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent(analysisPrompt);
      const response = result.response.candidates[0]?.content?.parts[0]?.text || '';
      
      try {
        // Clean the response to remove markdown formatting
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
        
        const jsonMatch = cleanedResponse.match(/\{.*\}/s);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }
        
        const analysis = JSON.parse(cleanedResponse);
        console.log(`   ✅ Detected industry: ${analysis.industry}`);
        console.log(`   ✅ Detected product: ${analysis.product}`);
        return analysis;
      } catch (error) {
        console.error('   ❌ Failed to parse AI analysis:', error.message);
        return { industry: '', product: '' };
      }
    } else {
      console.log(`   ⚠️ No Gemini API key, using fallback detection`);
      return { industry: '', product: '' };
    }
    
  } catch (error) {
    console.error(`❌ Industry/product detection error:`, error.message);
    return { industry: '', product: '' };
  }
}

// Enhanced prompt generation with automatic detection
function getEnhancedPrompts(company, industry = '', product = '') {
  const industryContext = industry || '[industry]';
  const productContext = product || '[product/service]';
  
  return {
    chatgpt: [
      `Which companies are leading in ${industryContext}?`,
      `What are the top companies offering ${productContext} in ${industryContext}?`,
      `Compare ${company} with other companies in the ${industryContext}.`,
      `How does ${company} leverage AI in ${industryContext}?`
    ],
    gemini: [
      `Which companies are leading in ${industryContext}?`,
      `What are the top companies offering ${productContext} in ${industryContext}?`,
      `Compare ${company} with other companies in the ${industryContext}.`,
      `How does ${company} leverage AI in ${industryContext}?`
    ],
    perplexity: [
      `Which companies are leading in ${industryContext}?`,
      `What are the top companies offering ${productContext} in ${industryContext}?`,
      `Compare ${company} with other companies in the ${industryContext}.`,
      `How does ${company} leverage AI in ${industryContext}?`
    ],
    claude: [
      `Which companies are leading in ${industryContext}?`,
      `What are the top companies offering ${productContext} in ${industryContext}?`,
      `Compare ${company} with other companies in the ${industryContext}.`,
      `How does ${company} leverage AI in ${industryContext}?`
    ]
  };
}

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
      
      // Check if response has items
      if (!response.data || !response.data.items) {
        console.log(`   ⚠️ Google Search returned no results for: "${query}"`);
        return [];
      }
      
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
        // Return empty array instead of throwing error
        console.log(`   ⚠️ Returning empty results for: "${query}"`);
        return [];
      }
      console.log(`   ⏳ Google Search attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, baseDelay));
    }
  }
  
  // If we get here, return empty array
  console.log(`   ⚠️ Returning empty results for: "${query}"`);
  return [];
}

// Industry news search method
async function searchIndustryNewsCompetitors(companyName) {
  try {
    console.log(`   📰 Method 1: Industry news search for "${companyName}"`);
    
    // Multiple industry news search queries
    const searchQueries = [
      `${companyName} vs competitors`,
      `${companyName} market analysis`,
      `${companyName} industry report`,
      `top companies like ${companyName}`,
      `${companyName} competitive landscape`
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

// Public company database search method
async function searchPublicCompanyDatabase(companyName) {
  try {
    console.log(`   🏢 Method 2: Public company database search for "${companyName}"`);
    
    // Multiple public database search queries
    const searchQueries = [
      `${companyName} company profile`,
      `${companyName} competitors list`,
      `${companyName} industry competitors`,
      `${companyName} market competitors`
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

// Web search with relaxed filtering
async function extractCompetitorsWithRelaxedFiltering(searchResults, companyName) {
  try {
    console.log(`   🔍 Extracting competitors from ${searchResults.length} search results`);
    const competitors = await extractCompetitorNames(companyName, searchResults);
    console.log(`   🎯 Extracted ${competitors.length} competitors from web search`);
    const filtered = competitors.filter(name => 
      name.toLowerCase() !== companyName.toLowerCase() &&
      name.length > 2
    );
    console.log(`   ✅ Filtered to ${filtered.length} valid competitors`);
    return filtered;
  } catch (error) {
    console.error('❌ Relaxed filtering error:', error.message);
    return [];
  }
}

// Wikipedia-based search
async function searchWikipediaCompetitors(companyName) {
  try {
    console.log(`   📚 Method 4: Wikipedia-based search for "${companyName}"`);
    
    // Multiple Wikipedia search queries
    const searchQueries = [
      `${companyName} wikipedia competitors`,
      `${companyName} wikipedia alternative companies`,
      `${companyName} wikipedia similar companies`,
      `${companyName} wikipedia industry competitors`
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

// Validate competitors using AI
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

// Multi-method competitor detection
async function detectCompetitors(companyName, searchResults) {
  console.log('\n🔍 Starting multi-method competitor detection...');
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
  
  // Rank competitors by frequency
  console.log('\n📊 Ranking competitors by frequency...');
  const rankedCompetitors = Array.from(allCompetitors.entries())
    .map(([name, frequency]) => ({ name, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
  
  console.log('📈 Competitor frequency ranking:');
  rankedCompetitors.forEach((comp, index) => {
    console.log(`   ${index + 1}. ${comp.name} (found ${comp.frequency} times)`);
  });
  
  const competitorNames = rankedCompetitors.map(c => c.name);
  
  // Validate competitors
  console.log('\n✅ Validating competitors with AI...');
  const validatedCompetitors = await validateCompetitors(companyName, competitorNames, searchResults);
  console.log(`🎯 Final validated competitors:`, validatedCompetitors);
  
  return validatedCompetitors;
}

// Web scraping functionality
async function scrapeWebsite(url) {
  console.log(`   🌐 Scraping website: ${url}`);
  
  try {
    console.log(`   📄 Loading page...`);
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    const companyData = {
      name: $('title').text() || 'No title available',
      description: $('meta[name="description"]').attr('content') || 'No description available'
      };
    
    console.log(`   ✅ Scraping successful: "${companyData.name}"`);
    return companyData;
  } catch (error) {
    console.error(`   ❌ Scraping failed:`, error.message);
    return { error: 'Scraping failed', details: error.message };
  }
}

// Analyze visibility from AI response
// Enhanced visibility analysis with detailed scoring
function analyzeVisibility(responseText, company) {
  const name = company.name || company;
  
  // A. Mentions Count (35% weight)
  const mentions = (responseText.match(new RegExp(name, 'gi')) || []);
  const mentionsCount = mentions.length;
  
  // B. Position Score (30% weight) - 1 if mentioned anywhere, 0 if not
  const position = responseText.toLowerCase().indexOf(name.toLowerCase()) >= 0 ? 1 : 0;
  
  // C. Sentiment Score (20% weight)
  let sentiment = 0.5; // Default neutral
  const positiveWords = responseText.match(/best|leading|top|innovative|recommended|trusted|popular/gi) || [];
  const negativeWords = responseText.match(/problem|issue|concern|negative|bad|poor|not recommended/gi) || [];
  
  if (positiveWords.length > 0) {
    sentiment = 1; // Positive
  } else if (negativeWords.length > 0) {
    sentiment = 0; // Negative
  }
  
  // D. Brand Mentions (10% weight) - Same as mentions count but with different weight
  const brandMentions = mentionsCount;
  
  console.log(`   [DEBUG] Raw values for ${name}:`);
  console.log(`   [DEBUG] Mentions count: ${mentionsCount}`);
  console.log(`   [DEBUG] Position: ${position}`);
  console.log(`   [DEBUG] Sentiment: ${sentiment}`);
  console.log(`   [DEBUG] Brand mentions: ${brandMentions}`);
  
  return { 
    mentions, 
    position, 
    sentiment, 
    brandMentions,
    mentionsCount,
    positiveWords: positiveWords.length,
    negativeWords: negativeWords.length
  };
}

// Calculate weighted visibility score
function calculateVisibilityScore(response, companyName = '') {
  if (typeof response === 'string') {
    const analysis = analyzeVisibility(response, companyName);
    
    // Weighted scoring formula
    const mentionsScore = analysis.mentionsCount * 0.35; // 35% weight
    const positionScore = analysis.position * 0.3; // 30% weight
    const sentimentScore = analysis.sentiment * 0.2; // 20% weight
    const brandMentionsScore = analysis.brandMentions * 0.1; // 10% weight
    
    const totalScore = mentionsScore + positionScore + sentimentScore + brandMentionsScore;
    
    console.log(`   [DEBUG] Weighted scores for ${companyName}:`);
    console.log(`   [DEBUG] Mentions score (35%): ${analysis.mentionsCount} x 0.35 = ${mentionsScore.toFixed(2)}`);
    console.log(`   [DEBUG] Position score (30%): ${analysis.position} x 0.3 = ${positionScore.toFixed(2)}`);
    console.log(`   [DEBUG] Sentiment score (20%): ${analysis.sentiment} x 0.2 = ${sentimentScore.toFixed(2)}`);
    console.log(`   [DEBUG] Brand mentions score (10%): ${analysis.brandMentions} x 0.1 = ${brandMentionsScore.toFixed(2)}`);
    console.log(`   [DEBUG] Total visibility score: ${totalScore.toFixed(4)}`);
    
    return {
      totalScore: totalScore,
      breakdown: {
        mentionsScore,
        positionScore,
        sentimentScore,
        brandMentionsScore
      },
      analysis
    };
  }
  
  if (response && typeof response === 'object') {
    const score = response.visibilityScore || response.score || response.rating || 5;
    return {
      totalScore: Math.min(Math.max(parseFloat(score) || 5, 1), 10),
      breakdown: {
        mentionsScore: 0,
        positionScore: 0,
        sentimentScore: 0,
        brandMentionsScore: 0
      },
      analysis: {}
    };
  }
  
  return {
    totalScore: 5,
    breakdown: {
      mentionsScore: 0,
      positionScore: 0,
      sentimentScore: 0,
      brandMentionsScore: 0
    },
    analysis: {}
  };
}

// Query Gemini for visibility analysis
async function queryGeminiVisibility(competitorName, industry = '', customPrompts = null) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompts = customPrompts || getGeminiPrompts(competitorName, industry);
  let allResponsesText = '';
  
  console.log(`   🤖 Gemini: Analyzing ${competitorName} with ${prompts.length} prompts`);
  console.log(`   📝 Gemini prompts to be used:`);
  prompts.forEach((prompt, i) => {
    console.log(`   ${i + 1}. ${prompt}`);
  });
  
  // Retry mechanism for service overload
  const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error.message.includes('overloaded') || error.message.includes('503') || error.message.includes('429')) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`   ⏳ Gemini service overloaded, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
  };
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    try {
      console.log(`   📝 Gemini prompt ${i + 1}: ${prompt.substring(0, 50)}...`);
      
      const response = await retryWithBackoff(async () => {
        const result = await model.generateContent(prompt);
        return result.response.candidates[0]?.content?.parts[0]?.text || '';
      });
      
      allResponsesText += response + ' ';
      console.log(`   ✅ Gemini prompt ${i + 1} completed (${response.length} chars)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    } catch (error) {
      console.error(`   ❌ Gemini prompt ${i + 1} error after retries:`, error.message);
      // Continue with other prompts even if one fails
    }
  }
  
  console.log(`   [DEBUG] Analyzing visibility for: ${competitorName}`);
  console.log(`   [DEBUG] Response text length: ${allResponsesText.length} characters`);
  
  const scoreResult = calculateVisibilityScore(allResponsesText, competitorName);
  
  console.log(`   📊 Gemini analysis: ${scoreResult.analysis.mentionsCount} mentions, sentiment: ${scoreResult.analysis.sentiment}, score: ${scoreResult.totalScore.toFixed(4)}`);
  
  return { 
    analysis: allResponsesText || 'No analysis available', 
    visibilityScore: scoreResult.totalScore,
    keyMetrics: scoreResult.analysis,
    breakdown: scoreResult.breakdown
  };
}

// Query Perplexity for visibility analysis
async function queryPerplexity(competitorName, industry = '', customPrompts = null) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not set');
  }
  
  const prompts = customPrompts || getPerplexityPrompts(competitorName, industry);
  let allResponsesText = '';
  
  console.log(`   🤖 Perplexity: Analyzing ${competitorName} with ${prompts.length} prompts`);
  console.log(`   📝 Perplexity prompts to be used:`);
  prompts.forEach((prompt, i) => {
    console.log(`   ${i + 1}. ${prompt}`);
  });
  
  // Retry mechanism for service overload
  const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error.message.includes('overloaded') || error.message.includes('503') || error.message.includes('429') || error.response?.status === 503 || error.response?.status === 429) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`   ⏳ Perplexity service overloaded, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
  };
  
  for (let i = 0; i < prompts.length; i += 3) {
    const batch = prompts.slice(i, i + 3);
    console.log(`   [DEBUG] Processing Perplexity batch ${Math.floor(i/3) + 1}/${Math.ceil(prompts.length/3)}...`);
    
    const batchPromises = batch.map(async (prompt, index) => {
      try {
        console.log(`   📝 Perplexity prompt ${i + index + 1}: ${prompt.substring(0, 50)}...`);
        
        const responseText = await retryWithBackoff(async () => {
          const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
              model: 'r1-1776',
              messages: [
                { role: 'system', content: 'You are a helpful business analyst specializing in AI market analysis.' },
                { role: 'user', content: prompt }
              ]
            },
            { 
              headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
              timeout: 60000
            }
          );
          return response.data?.choices?.[0]?.message?.content || '';
        });
        
        console.log(`   ✅ Perplexity prompt ${i + index + 1} completed (${responseText.length} chars)`);
        return responseText;
      } catch (error) {
        console.error(`   ❌ Perplexity prompt ${i + index + 1} error after retries:`, error.message);
        return '';
      }
    });
    
    const batchResponses = await Promise.all(batchPromises);
    allResponsesText += batchResponses.join(' ');
    
    if (i + 3 < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`   [DEBUG] Analyzing visibility for: ${competitorName}`);
  console.log(`   [DEBUG] Response text length: ${allResponsesText.length} characters`);
  
  const scoreResult = calculateVisibilityScore(allResponsesText, competitorName);
  
  console.log(`   📊 Perplexity analysis: ${scoreResult.analysis.mentionsCount} mentions, sentiment: ${scoreResult.analysis.sentiment}, score: ${scoreResult.totalScore.toFixed(4)}`);
  
  return { 
    analysis: allResponsesText, 
    visibilityScore: scoreResult.totalScore,
    keyMetrics: scoreResult.analysis,
    breakdown: scoreResult.breakdown
  };
}

// Query Claude for visibility analysis
async function queryClaude(competitorName, industry = '', customPrompts = null) {
  if (!ANTHROPIC_API_KEY) {
    console.log(`   ⚠️ Claude: ANTHROPIC_API_KEY not set, returning fallback response`);
    return { 
      analysis: 'Claude analysis unavailable - API key not configured', 
      visibilityScore: 5, 
      keyMetrics: {},
      breakdown: {},
      error: 'api_key_not_set'
    };
  }
  
  const prompts = customPrompts || getClaudePrompts(competitorName, industry);
  let allResponsesText = '';
  
  console.log(`   🤖 Claude: Analyzing ${competitorName} with ${prompts.length} prompts`);
  console.log(`   📝 Claude prompts to be used:`);
  prompts.forEach((prompt, i) => {
    console.log(`   ${i + 1}. ${prompt}`);
  });
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    try {
      console.log(`   📝 Claude prompt ${i + 1}: ${prompt.substring(0, 50)}...`);
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: { 
            'Authorization': `Bearer ${ANTHROPIC_API_KEY}`, 
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      const content = response.data?.content?.[0]?.text || '';
      allResponsesText += content + ' ';
      console.log(`   ✅ Claude prompt ${i + 1} completed (${content.length} chars)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    } catch (error) {
      console.error(`   ❌ Claude prompt ${i + 1} error:`, error.message);
    }
  }
  
  console.log(`   [DEBUG] Analyzing visibility for: ${competitorName}`);
  console.log(`   [DEBUG] Response text length: ${allResponsesText.length} characters`);
  
  const scoreResult = calculateVisibilityScore(allResponsesText, competitorName);
  
  console.log(`   📊 Claude analysis: ${scoreResult.analysis.mentionsCount} mentions, sentiment: ${scoreResult.analysis.sentiment}, score: ${scoreResult.totalScore.toFixed(4)}`);
  
  return { 
    analysis: allResponsesText, 
    visibilityScore: scoreResult.totalScore,
    keyMetrics: scoreResult.analysis,
    breakdown: scoreResult.breakdown
  };
}

// Query ChatGPT for visibility analysis
async function queryChatGPT(competitorName, industry = '', customPrompts = null) {
  if (!OPENAI_API_KEY) {
    console.log(`   ⚠️ ChatGPT: OPENAI_API_KEY not set, returning fallback response`);
    return { 
      analysis: 'ChatGPT analysis unavailable - API key not configured', 
      visibilityScore: 5, 
      keyMetrics: {},
      breakdown: {},
      error: 'api_key_not_set'
    };
  }
  
  const prompts = customPrompts || getChatGPTPrompts(competitorName, industry);
  let allResponsesText = '';
  
  console.log(`   🤖 ChatGPT: Analyzing ${competitorName} with ${prompts.length} prompts`);
  console.log(`   📝 ChatGPT prompts to be used:`);
  prompts.forEach((prompt, i) => {
    console.log(`   ${i + 1}. ${prompt}`);
  });
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    try {
      console.log(`   📝 ChatGPT prompt ${i + 1}: ${prompt.substring(0, 50)}...`);
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a helpful business analyst specializing in AI market analysis.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        },
        {
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }
        }
      );
      
      const content = response.data?.choices?.[0]?.message?.content || '';
      allResponsesText += content + ' ';
      console.log(`   ✅ ChatGPT prompt ${i + 1} completed (${content.length} chars)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    } catch (error) {
      console.error(`   ❌ ChatGPT prompt ${i + 1} error:`, error.message);
    }
  }
  
  console.log(`   [DEBUG] Analyzing visibility for: ${competitorName}`);
  console.log(`   [DEBUG] Response text length: ${allResponsesText.length} characters`);
  
  const scoreResult = calculateVisibilityScore(allResponsesText, competitorName);
  
  console.log(`   📊 ChatGPT analysis: ${scoreResult.analysis.mentionsCount} mentions, sentiment: ${scoreResult.analysis.sentiment}, score: ${scoreResult.totalScore.toFixed(4)}`);
  
  return { 
    analysis: allResponsesText, 
    visibilityScore: scoreResult.totalScore,
    keyMetrics: scoreResult.analysis,
    breakdown: scoreResult.breakdown
  };
}

// Main AI visibility analysis function
async function getVisibilityData(companyName, industry = '') {
  console.log('🚀 Starting AI Visibility Analysis for:', companyName);
  console.log('📊 Industry context:', industry || 'Not specified');
  
  try {
    // Automatic industry and product detection if not provided
    let detectedIndustry = industry;
    let detectedProduct = '';
    
    if (!industry) {
      console.log('🔍 No industry specified, detecting automatically...');
      const detection = await detectIndustryAndProduct(companyName);
      detectedIndustry = detection.industry;
      detectedProduct = detection.product;
      console.log(`📊 Detected industry: ${detectedIndustry || 'Unknown'}`);
      console.log(`📊 Detected product: ${detectedProduct || 'Unknown'}`);
    }
    
    // Get search results for competitors
    const searchQuery = `${companyName} competitors ${detectedIndustry}`.trim();
    console.log('🔍 Search query:', searchQuery);
    
    let searchResults = [];
    try {
      searchResults = await queryCustomSearchAPI(searchQuery);
      console.log('📈 Found', searchResults.length, 'search results');
    } catch (error) {
      console.error('❌ Search API error:', error.message);
      console.log('⚠️ Using empty search results, will rely on competitor detection');
      searchResults = [];
    }
    
    // Detect competitors using enhanced multi-method approach
    console.log('🎯 Starting enhanced multi-method competitor detection...');
    let competitors = [];
    
    try {
      // Try to use enhanced competitor detection first
      const { detectCompetitorsEnhanced } = require('./enhancedCompetitorDetection');
      competitors = await detectCompetitorsEnhanced(companyName, industry);
      console.log('✅ Enhanced competitor detection complete. Found', competitors.length, 'competitors:', competitors);
    } catch (error) {
      console.error('❌ Enhanced competitor detection failed:', error.message);
      console.log('🔄 Falling back to original competitor detection...');
      
      try {
        competitors = await detectCompetitors(companyName, searchResults);
        console.log('✅ Original competitor detection complete. Found', competitors.length, 'competitors:', competitors);
      } catch (fallbackError) {
        console.error('❌ Original competitor detection also failed:', fallbackError.message);
        competitors = [];
      }
    }
    
    // No fallback competitors - only use detected competitors
    if (competitors.length === 0) {
      console.log('⚠️ No competitors detected - proceeding with empty competitor list');
    }
    
    // Analyze AI visibility across multiple AI models in parallel
    console.log('🤖 Starting parallel multi-AI model analysis...');
    
    // Include the main company in analysis
    const allCompanies = [companyName, ...competitors];
    console.log('📋 Companies to analyze:', allCompanies);
    
    // Process all companies in parallel for maximum speed
    const analysisPromises = allCompanies.map(async (competitorName) => {
      console.log(`🎯 Starting analysis for: ${competitorName}`);
      
      // Scrape competitor website if available
      let scrapedData = null;
      try {
        const searchResult = searchResults.find(item => 
          item.name.toLowerCase().includes(competitorName.toLowerCase())
        );
        if (searchResult?.link) {
          console.log(`🌐 Scraping website for ${competitorName}:`, searchResult.link);
          scrapedData = await scrapeWebsite(searchResult.link);
          console.log(`✅ Scraping complete for ${competitorName}:`, scrapedData.name || 'No title');
        } else {
          console.log(`⚠️ No website link found for ${competitorName}`);
        }
      } catch (error) {
        console.error(`❌ Scraping error for ${competitorName}:`, error.message);
      }
      
      console.log(`🤖 Starting AI analysis for ${competitorName}...`);
      
      // Use enhanced prompts with detected industry and product
      const enhancedPrompts = getEnhancedPrompts(competitorName, detectedIndustry, detectedProduct);
      
      // Query all AI engines in parallel for this competitor with enhanced error handling
      const [
        geminiResponse, perplexityResponse, 
        claudeResponse, chatgptResponse
      ] = await Promise.all([
        queryGeminiVisibility(competitorName, detectedIndustry, enhancedPrompts.gemini).catch(err => {
          console.error(`❌ Gemini error for ${competitorName}:`, err.message);
          return { 
            analysis: 'Gemini analysis unavailable due to service overload', 
            visibilityScore: 5, 
            keyMetrics: {},
            breakdown: {},
            error: 'service_overload'
          };
        }),
        queryPerplexity(competitorName, detectedIndustry, enhancedPrompts.perplexity).catch(err => {
          console.error(`❌ Perplexity error for ${competitorName}:`, err.message);
          return { 
            analysis: 'Perplexity analysis unavailable due to service overload', 
            visibilityScore: 5, 
            keyMetrics: {},
            breakdown: {},
            error: 'service_overload'
          };
        }),
        queryClaude(competitorName, detectedIndustry, enhancedPrompts.claude).catch(err => {
          console.error(`❌ Claude error for ${competitorName}:`, err.message);
          return { 
            analysis: 'Claude analysis unavailable due to service overload', 
            visibilityScore: 5, 
            keyMetrics: {},
            breakdown: {},
            error: 'service_overload'
          };
        }),
        queryChatGPT(competitorName, detectedIndustry, enhancedPrompts.chatgpt).catch(err => {
          console.error(`❌ ChatGPT error for ${competitorName}:`, err.message);
          return { 
            analysis: 'ChatGPT analysis unavailable due to service overload', 
            visibilityScore: 5, 
            keyMetrics: {},
            breakdown: {},
            error: 'service_overload'
          };
        })
      ]);
      
      console.log(`✅ AI analysis complete for ${competitorName}`);
      console.log(`📊 Gemini score: ${geminiResponse.visibilityScore.toFixed(4)}`);
      console.log(`📊 Perplexity score: ${perplexityResponse.visibilityScore.toFixed(4)}`);
      console.log(`📊 Claude score: ${claudeResponse.visibilityScore.toFixed(4)}`);
      console.log(`📊 ChatGPT score: ${chatgptResponse.visibilityScore.toFixed(4)}`);
      
      // Calculate average score from all AI models
      const scores = {
        gemini: geminiResponse.visibilityScore,
        perplexity: perplexityResponse.visibilityScore,
        claude: claudeResponse.visibilityScore,
        chatgpt: chatgptResponse.visibilityScore
      };
      
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
      
      // Check service availability and provide detailed logging
      const serviceStatus = {
        gemini: !geminiResponse.error,
        perplexity: !perplexityResponse.error,
        claude: !claudeResponse.error,
        chatgpt: !chatgptResponse.error
      };
      
      const availableServices = Object.values(serviceStatus).filter(Boolean).length;
      console.log(`📊 Service Status for ${competitorName}:`);
      console.log(`   - Gemini: ${serviceStatus.gemini ? '✅ Available' : '❌ Overloaded'}`);
      console.log(`   - Perplexity: ${serviceStatus.perplexity ? '✅ Available' : '❌ Overloaded'}`);
      console.log(`   - Claude: ${serviceStatus.claude ? '✅ Available' : '❌ Overloaded'}`);
      console.log(`   - ChatGPT: ${serviceStatus.chatgpt ? '✅ Available' : '❌ Overloaded'}`);
      console.log(`   - Available Services: ${availableServices}/4`);
      
      console.log(`📈 Calculated scores for ${competitorName}:`);
      console.log(`   - Gemini: ${scores.gemini.toFixed(4)} ${!serviceStatus.gemini ? '(fallback)' : ''}`);
      console.log(`   - Perplexity: ${scores.perplexity.toFixed(4)} ${!serviceStatus.perplexity ? '(fallback)' : ''}`);
      console.log(`   - Claude: ${scores.claude.toFixed(4)} ${!serviceStatus.claude ? '(fallback)' : ''}`);
      console.log(`   - ChatGPT: ${scores.chatgpt.toFixed(4)} ${!serviceStatus.chatgpt ? '(fallback)' : ''}`);
      console.log(`   - Average Score: ${totalScore.toFixed(4)}`);
      
      if (availableServices < 2) {
        console.log(`⚠️ Warning: Only ${availableServices}/4 AI services available. Results may be less accurate.`);
      }
      
      return {
        name: competitorName,
        citationCount: Math.floor(totalScore * 100), // Mock citation count based on score
        aiScores: scores,
        totalScore: Number(totalScore.toFixed(4)),
        breakdowns: {
          gemini: geminiResponse.breakdown || {},
          perplexity: perplexityResponse.breakdown || {},
          claude: claudeResponse.breakdown || {},
          chatgpt: chatgptResponse.breakdown || {}
        },
        keyMetrics: {
          gemini: geminiResponse.keyMetrics || {},
          perplexity: perplexityResponse.keyMetrics || {},
          claude: claudeResponse.keyMetrics || {},
          chatgpt: chatgptResponse.keyMetrics || {}
        },
        scrapedData: scrapedData,
        analysis: {
          gemini: geminiResponse.analysis || 'No analysis available',
          perplexity: perplexityResponse.analysis || 'No analysis available',
          claude: claudeResponse.analysis || 'No analysis available',
          chatgpt: chatgptResponse.analysis || 'No analysis available'
        }
      };
    });
    
    // Wait for all competitor analyses to complete
    console.log('⏳ Waiting for all parallel analyses to complete...');
    const analysisResults = await Promise.all(analysisPromises);
    console.log('✅ All parallel analyses completed!');
    
    console.log('\n🎉 AI Visibility Analysis complete!');
    console.log('📋 Final results:');
    analysisResults.forEach(comp => {
      console.log(`   - ${comp.name}: Score ${comp.totalScore}/10`);
    });
    
    // Calculate overall service status
    const overallServiceStatus = {
      gemini: analysisResults.some(r => !r.breakdowns?.gemini?.error),
      perplexity: analysisResults.some(r => !r.breakdowns?.perplexity?.error),
      claude: analysisResults.some(r => !r.breakdowns?.claude?.error),
      chatgpt: analysisResults.some(r => !r.breakdowns?.chatgpt?.error)
    };
    
    return {
      company: companyName,
      industry: industry,
      competitors: analysisResults,
      serviceStatus: overallServiceStatus
    };
    
  } catch (error) {
    console.error('AI Visibility Analysis error:', error);
    throw new Error(`Failed to analyze AI visibility: ${error.message}`);
  }
}

// Analyze a single competitor for AI visibility
async function analyzeSingleCompetitor(competitorName, industry = '') {
  console.log(`\n🎯 Analyzing single competitor: ${competitorName}`);
  console.log(`📋 Industry context: ${industry || 'Not specified'}`);
  
  try {
    // Detect industry and product if not provided
    let detectedIndustry = industry;
    let detectedProduct = '';
    
    if (!industry) {
      console.log('🔍 Detecting industry and product automatically...');
      const detection = await detectIndustryAndProduct(competitorName);
      detectedIndustry = detection.industry;
      detectedProduct = detection.product;
      console.log(`   ✅ Detected industry: ${detectedIndustry}`);
      console.log(`   ✅ Detected product: ${detectedProduct}`);
    }
    
    // Get enhanced prompts
    const enhancedPrompts = getEnhancedPrompts(competitorName, detectedIndustry, detectedProduct);
    
    console.log('\n🤖 Querying AI models in parallel for visibility analysis...');
    
    // Query all AI models in parallel for maximum speed
    const [
      geminiResponse, perplexityResponse, 
      claudeResponse, chatgptResponse
    ] = await Promise.all([
      queryGeminiVisibility(competitorName, detectedIndustry, enhancedPrompts).catch(err => {
        console.error(`❌ Gemini error for ${competitorName}:`, err.message);
        return { analysis: 'Analysis unavailable', visibilityScore: 5, keyMetrics: {} };
      }),
      queryPerplexity(competitorName, detectedIndustry, enhancedPrompts).catch(err => {
        console.error(`❌ Perplexity error for ${competitorName}:`, err.message);
        return { analysis: 'Analysis unavailable', visibilityScore: 5, keyMetrics: {} };
      }),
      queryClaude(competitorName, detectedIndustry, enhancedPrompts).catch(err => {
        console.error(`❌ Claude error for ${competitorName}:`, err.message);
        return { analysis: 'Analysis unavailable', visibilityScore: 5, keyMetrics: {} };
      }),
      queryChatGPT(competitorName, detectedIndustry, enhancedPrompts).catch(err => {
        console.error(`❌ ChatGPT error for ${competitorName}:`, err.message);
        return { analysis: 'Analysis unavailable', visibilityScore: 5, keyMetrics: {} };
      })
    ]);
    
    // Calculate scores
    const scores = {
      gemini: geminiResponse.score,
      perplexity: perplexityResponse.score,
      claude: claudeResponse.score,
      chatgpt: chatgptResponse.score
    };
    
    const totalScore = (scores.gemini + scores.perplexity + scores.claude + scores.chatgpt) / 4;
    
    console.log(`\n📊 AI Visibility Scores for ${competitorName}:`);
    console.log(`   - Gemini: ${scores.gemini.toFixed(4)}`);
    console.log(`   - Perplexity: ${scores.perplexity.toFixed(4)}`);
    console.log(`   - Claude: ${scores.claude.toFixed(4)}`);
    console.log(`   - ChatGPT: ${scores.chatgpt.toFixed(4)}`);
    console.log(`   - Average: ${totalScore.toFixed(4)}`);
    
    const competitorAnalysis = {
      name: competitorName,
      citationCount: Math.floor(totalScore * 100),
      aiScores: scores,
      totalScore: Number(totalScore.toFixed(4)),
      breakdowns: {
        gemini: geminiResponse.breakdown || {},
        perplexity: perplexityResponse.breakdown || {},
        claude: claudeResponse.breakdown || {},
        chatgpt: chatgptResponse.breakdown || {}
      },
      keyMetrics: {
        gemini: geminiResponse.keyMetrics || {},
        perplexity: perplexityResponse.keyMetrics || {},
        claude: claudeResponse.keyMetrics || {},
        chatgpt: chatgptResponse.keyMetrics || {}
      },
      scrapedData: null, // Not needed for single competitor
      analysis: {
        gemini: geminiResponse.analysis || 'No analysis available',
        perplexity: perplexityResponse.analysis || 'No analysis available',
        claude: claudeResponse.analysis || 'No analysis available',
        chatgpt: chatgptResponse.analysis || 'No analysis available'
      }
    };
    
    console.log(`\n✅ Single competitor analysis complete for ${competitorName}`);
    console.log(`📋 Final result: Score ${totalScore.toFixed(4)}/10`);
    
    return competitorAnalysis;
    
  } catch (error) {
    console.error('Single competitor analysis error:', error);
    throw new Error(`Failed to analyze competitor ${competitorName}: ${error.message}`);
  }
}

module.exports = {
  getVisibilityData,
  queryCustomSearchAPI,
  detectCompetitors,
  queryGeminiVisibility,
  queryPerplexity,
  queryClaude,
  queryChatGPT,
  scrapeWebsite,
  analyzeVisibility,
  calculateVisibilityScore,
  getGeminiPrompts,
  getPerplexityPrompts,
  getClaudePrompts,
  getChatGPTPrompts,
  detectIndustryAndProduct,
  getEnhancedPrompts,
  analyzeSingleCompetitor
}; 