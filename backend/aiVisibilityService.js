const axios = require('axios');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'r1-1776';

// Improved helper to extract the first valid JSON object or array from a string
function extractJson(text) {
  // Remove <think>...</think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove markdown code blocks
  text = text.replace(/```json[\s\S]*?```/gi, '');
  text = text.replace(/```[\s\S]*?```/gi, '');
  // Try to find a JSON array
  const arrMatch = text.match(/\[.*?\]/s);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch {}
  }
  // Try to find a JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch {}
  }
  // Fallback: try to parse the whole text
  try { return JSON.parse(text); } catch {}
  return null;
}

// Helper to call Perplexity API and request JSON output
async function callPerplexity(prompt) {
  console.log('[Perplexity] Sending prompt:', prompt); // Log prompt
  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: PERPLEXITY_MODEL,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[Perplexity] Got response:', JSON.stringify(response.data)); // Log response
    return { answer: response.data.choices[0].message.content };
  } catch (error) {
    console.error('Perplexity API error:', error.response?.data || error.message);
    throw new Error('Failed to fetch from Perplexity API');
  }
}

// 1. Identify closest competitors for a company/product
async function identifyCompetitors(company) {
  const prompt = `List the closest competitors of ${company}. Respond ONLY with a JSON array of competitor names, and nothing else.`;
  const { answer } = await callPerplexity(prompt);
  const competitors = extractJson(answer);
  console.log(`[Competitors] Raw:`, answer, '\nParsed:', competitors);
  if (Array.isArray(competitors)) return competitors;
  return answer.split(',').map(s => s.trim()).filter(Boolean);
}

// 2. Get Citation Count for a competitor (with retry and logging)
async function getCitationCount(competitor) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = `How many times has ${competitor} been cited in academic papers, news articles, or reputable sources? Respond ONLY in JSON: { "citationCount": number } If unknown, use 0.`;
    const { answer } = await callPerplexity(prompt);
    const obj = extractJson(answer);
    console.log(`[CitationCount][${competitor}] Attempt ${attempt + 1}:`, answer, '\nParsed:', obj);
    if (obj && typeof obj.citationCount === 'number') return obj.citationCount;
  }
  return null;
}

// 3. Get General Customer Rating for a competitor (not just AI industry)
async function getCustomerRating(competitor) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = `What is the average customer rating for ${competitor} on major review platforms (G2, Capterra, Trustpilot)? Respond ONLY in JSON: { "rating": number } If unknown, use 0.`;
    const { answer } = await callPerplexity(prompt);
    const obj = extractJson(answer);
    console.log(`[CustomerRating][${competitor}] Attempt ${attempt + 1}:`, answer, '\nParsed:', obj);
    if (obj && typeof obj.rating === 'number') return obj.rating;
  }
  return null;
}

// 4. Get Share of Voice for all competitors
async function getShareOfVoice(competitors) {
  const prompt = `Given the companies ${competitors.join(', ')}, estimate their share of voice in terms of media and online mentions. Respond ONLY in JSON: { "shares": [{ "company": string, "percent": number }] } If unknown, use 0 for percent.`;
  const { answer } = await callPerplexity(prompt);
  const obj = extractJson(answer);
  console.log(`[ShareOfVoice] Raw:`, answer, '\nParsed:', obj);
  return obj && Array.isArray(obj.shares) ? obj.shares : [];
}

// Main function: get all data for a company
async function getVisibilityData(company) {
  let competitors = await identifyCompetitors(company);
  if (!competitors.map(c => c.toLowerCase()).includes(company.toLowerCase())) {
    competitors = [company, ...competitors];
  } else {
    competitors = [company, ...competitors.filter(c => c.toLowerCase() !== company.toLowerCase())];
  }
  const shareOfVoiceArr = await getShareOfVoice(competitors);
  const results = [];
  for (const competitor of competitors) {
    const [citationCount, customerRating] = await Promise.all([
      getCitationCount(competitor),
      getCustomerRating(competitor),
    ]);
    // Always map share of voice percent, default to 0 if not found or not a number
    let sovPercent = 0;
    if (Array.isArray(shareOfVoiceArr)) {
      const sov = shareOfVoiceArr.find(s => s.company.toLowerCase() === competitor.toLowerCase());
      if (sov && typeof sov.percent === 'number') sovPercent = sov.percent;
    }
    results.push({
      name: competitor,
      citationCount,
      shareOfVoice: sovPercent,
      customerRating,
    });
  }
  return { company, competitors: results };
}

module.exports = {
  getVisibilityData,
}; 