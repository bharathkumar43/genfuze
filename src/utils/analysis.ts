// Calculate accuracy score (simplified)
export function calculateAccuracy(question: string, answer: string, content: string): number {
  const questionWords = question.toLowerCase().split(' ');
  const answerWords = answer.toLowerCase().split(' ');
  const contentWords = content.toLowerCase().split(' ');
  
  // Check relevance
  let relevanceScore = 0;
  questionWords.forEach(word => {
    if (word.length > 3 && answerWords.includes(word)) {
      relevanceScore += 1;
    }
  });
  
  // Check content coverage
  let coverageScore = 0;
  answerWords.forEach(word => {
    if (word.length > 3 && contentWords.includes(word)) {
      coverageScore += 1;
    }
  });
  
  // Calculate final score
  const maxRelevance = Math.max(questionWords.length, 1);
  const maxCoverage = Math.max(answerWords.length, 1);
  
  const accuracy = ((relevanceScore / maxRelevance) * 0.6 + (coverageScore / maxCoverage) * 0.4) * 100;
  return Math.min(Math.max(accuracy, 0), 100);
}

// Sentiment analysis (simplified)
export function analyzeSentiment(text: string): string {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'positive', 'helpful', 'useful', 'clear', 'effective'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'unclear', 'confusing', 'useless', 'ineffective', 'poor'];
  
  const words = text.toLowerCase().split(' ');
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'Positive';
  if (negativeCount > positiveCount) return 'Negative';
  return 'Neutral';
}

import { callGeminiAPI } from './geminiApi';

// Helper: Split content into chunks of maxLength (overlapping by overlap chars)
function chunkContent(content: string, maxLength: number = 3500, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + maxLength, content.length);
    chunks.push(content.slice(start, end));
    if (end === content.length) break;
    start += maxLength - overlap;
  }
  return chunks;
}

// Calculate confidence using Gemini API (relevance only, full content or chunked)
export async function calculateConfidenceWithGemini(
  question: string, 
  content: string, 
  apiKey: string, 
  model: string = 'gemini-1.5-flash'
): Promise<number> {
  // Gemini 1.5 context window is ~30,000 tokens, but to be safe, use ~10,000 chars
  const MAX_CHARS = 9000;
  if (content.length <= MAX_CHARS) {
    // Content fits, send all
    const prompt = `Rate how relevant the following question is to the given blog content on a scale of 0 to 100, where 0 means not relevant at all and 100 means extremely relevant.\n\nOnly consider how closely the question relates to the topics, facts, or ideas present in the blog content.\n\nBlog Content:\n${content}\n\nQuestion: ${question}\n\nRespond with ONLY a number between 0 and 100.`;
    const result = await callGeminiAPI(prompt, apiKey, model, false);
    const confidenceText = result.text.trim();
    const confidenceMatch = confidenceText.match(/\d+/);
    if (confidenceMatch) {
      const confidence = parseInt(confidenceMatch[0]);
      return Math.min(Math.max(confidence, 0), 100);
    }
    return 50;
  } else {
    // Content too long, chunk and aggregate
    const chunks = chunkContent(content, MAX_CHARS, 500);
    const scores: number[] = [];
    for (const chunk of chunks) {
      const prompt = `Rate how relevant the following question is to the given blog content on a scale of 0 to 100, where 0 means not relevant at all and 100 means extremely relevant.\n\nOnly consider how closely the question relates to the topics, facts, or ideas present in the blog content.\n\nBlog Content:\n${chunk}\n\nQuestion: ${question}\n\nRespond with ONLY a number between 0 and 100.`;
      const result = await callGeminiAPI(prompt, apiKey, model, false);
      const confidenceText = result.text.trim();
      const confidenceMatch = confidenceText.match(/\d+/);
      if (confidenceMatch) {
        const confidence = parseInt(confidenceMatch[0]);
        scores.push(Math.min(Math.max(confidence, 0), 100));
      }
    }
    // Aggregate: use max score (most optimistic)
    if (scores.length > 0) {
      return Math.max(...scores);
    }
    return 50;
  }
}

// Enhanced confidence calculation with detailed scoring criteria
export async function calculateEnhancedConfidence(
  question: string, 
  content: string, 
  apiKey: string, 
  model: string = 'gemini-1.5-flash'
): Promise<{ confidence: number, breakdown: { relevance: number, answerability: number, specificity: number, depth: number } }> {
  try {
    const prompt = `Analyze this question's relevance to the given content using these specific criteria:

1. RELEVANCE (0-25 points): How directly related is the question to the main topics and themes in the content?
2. ANSWERABILITY (0-25 points): Can the question be definitively answered using only the provided content?
3. SPECIFICITY (0-25 points): Is the question specific enough to have a clear, unambiguous answer?
4. DEPTH (0-25 points): Does the question test meaningful understanding rather than just surface-level facts?

Blog Content:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Question: ${question}

Respond with ONLY the scores in this exact format:
RELEVANCE: [0-25]
ANSWERABILITY: [0-25]
SPECIFICITY: [0-25]
DEPTH: [0-25]
TOTAL: [sum of all scores]`;

    const { callGeminiAPI } = await import('./geminiApi');
    const result = await callGeminiAPI(prompt, apiKey, model, false);
    
    const response = result.text.trim();
    
    // Extract individual scores
    const relevanceMatch = response.match(/RELEVANCE:\s*(\d+)/i);
    const answerabilityMatch = response.match(/ANSWERABILITY:\s*(\d+)/i);
    const specificityMatch = response.match(/SPECIFICITY:\s*(\d+)/i);
    const depthMatch = response.match(/DEPTH:\s*(\d+)/i);
    const totalMatch = response.match(/TOTAL:\s*(\d+)/i);
    
    const relevance = relevanceMatch ? Math.min(Math.max(parseInt(relevanceMatch[1]), 0), 25) : 12;
    const answerability = answerabilityMatch ? Math.min(Math.max(parseInt(answerabilityMatch[1]), 0), 25) : 12;
    const specificity = specificityMatch ? Math.min(Math.max(parseInt(specificityMatch[1]), 0), 25) : 12;
    const depth = depthMatch ? Math.min(Math.max(parseInt(depthMatch[1]), 0), 25) : 12;
    
    const total = totalMatch ? Math.min(Math.max(parseInt(totalMatch[1]), 0), 100) : 
                  relevance + answerability + specificity + depth;
    
    return {
      confidence: total,
      breakdown: { relevance, answerability, specificity, depth }
    };
    
  } catch (error) {
    console.error('Error calculating enhanced confidence:', error);
    return {
      confidence: 50,
      breakdown: { relevance: 12, answerability: 12, specificity: 12, depth: 14 }
    };
  }
}

// Filter questions by confidence threshold
export function filterQuestionsByConfidence(
  questions: string[],
  confidences: number[],
  minConfidence: number = 95
): { filteredQuestions: string[], filteredConfidences: number[], removedCount: number } {
  const filteredQuestions: string[] = [];
  const filteredConfidences: number[] = [];
  let removedCount = 0;
  
  questions.forEach((question, index) => {
    const confidence = confidences[index] || 0;
    if (confidence >= minConfidence) {
      filteredQuestions.push(question);
      filteredConfidences.push(confidence);
    } else {
      removedCount++;
    }
  });
  
  return { filteredQuestions, filteredConfidences, removedCount };
}

// Calculate confidence statistics
export function calculateConfidenceStats(confidences: number[]): {
  average: number;
  median: number;
  min: number;
  max: number;
  above95: number;
  above80: number;
  above60: number;
} {
  if (confidences.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0, above95: 0, above80: 0, above60: 0 };
  }
  
  const sorted = [...confidences].sort((a, b) => a - b);
  const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = Math.min(...confidences);
  const max = Math.max(...confidences);
  
  const above95 = confidences.filter(conf => conf >= 95).length;
  const above80 = confidences.filter(conf => conf >= 80).length;
  const above60 = confidences.filter(conf => conf >= 60).length;
  
  return { average, median, min, max, above95, above80, above60 };
}

// AI-Powered confidence calculation for individual questions - RELEVANCE ONLY
export async function calculateQuestionConfidence(
  question: string, 
  content: string, 
  apiKey: string, 
  model: string = 'gemini-1.5-flash'
): Promise<{
  confidence: number;
  reasoning: string;
  outputTokens: number;
}> {
  try {
    const prompt = `Rate how relevant the following question is to the given blog content on a scale of 0 to 100, where 0 means not relevant at all and 100 means extremely relevant.

Only consider how closely the question relates to the topics, facts, or ideas present in the blog content.

Blog Content:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Question: ${question}

Respond with ONLY a number between 0 and 100.`;

    const { callGeminiAPI } = await import('./geminiApi');
    const result = await callGeminiAPI(prompt, apiKey, model, false);
    
    const response = result.text.trim();
    
    // Extract confidence score
    const confidenceMatch = response.match(/\d+/);
    const confidence = confidenceMatch ? Math.min(Math.max(parseInt(confidenceMatch[0]), 0), 100) : 50;
    
    const reasoning = `AI Relevance Score: ${confidence}/100 - ${confidence >= 80 ? 'Highly relevant' : confidence >= 60 ? 'Moderately relevant' : 'Low relevance'} to the content`;
    
    return {
      confidence,
      reasoning,
      outputTokens: result.outputTokens
    };
    
  } catch (error) {
    console.error('Error calculating question confidence:', error);
    return {
      confidence: 50,
      reasoning: 'Error in AI analysis - using fallback score',
      outputTokens: 0
    };
  }
}

/**
 * Calculate a simple GEO score for a Q&A pair.
 * Heuristic: based on answer length, keyword overlap, and structure.
 * - +40 if answer length is reasonable (30-300 chars)
 * - +30 if at least 3 keywords from the question appear in the answer
 * - +20 if answer contains at least one list or heading (\n, -, *, 1.)
 * - +10 if answer ends with a period/question mark/exclamation
 * Max score: 100
 */
export function calculateGeoScore(question: string, answer: string): number {
  let score = 0;
  const answerLen = answer.length;
  if (answerLen >= 30 && answerLen <= 300) score += 40;

  // Keyword overlap
  const qWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const aWords = answer.toLowerCase().split(/\W+/);
  const overlap = qWords.filter(qw => aWords.includes(qw));
  if (overlap.length >= 3) score += 30;

  // Structure: list or heading
  if (/\n\s*[-*1.]/.test(answer)) score += 20;

  // Ends with punctuation
  if (/[.!?]$/.test(answer.trim())) score += 10;

  return Math.min(score, 100);
}

/**
 * Calculate advanced GEO score for a Q&A pair using multiple factors.
 * Returns { geoScore, breakdown }
 */
export async function calculateGeoScoreV2({
  accuracy,
  question,
  answer,
  importantQuestions,
  allConfidences,
  sourceUrl,
  content
}: {
  accuracy: number;
  question: string;
  answer: string;
  importantQuestions: string[];
  allConfidences: number[];
  sourceUrl: string;
  content: string;
}): Promise<{ geoScore: number, breakdown: any }> {
  // Dynamic Coverage Score - Calculate based on content similarity and question relevance
  let coverage = 0;
  if (importantQuestions.length > 0) {
    let totalCoverageScore = 0;
    for (let i = 0; i < importantQuestions.length; i++) {
      const importantQ = importantQuestions[i];
      const confidence = allConfidences[i] || 0;
      
      // Calculate semantic similarity between current question and important question
      const similarity = calculateQuestionSimilarity(question, importantQ);
      
      // Weight by confidence and similarity
      const questionCoverage = (confidence * similarity) / 100;
      totalCoverageScore += questionCoverage;
    }
    coverage = (totalCoverageScore / importantQuestions.length) * 100;
  }

  // Dynamic Structure Score - More comprehensive analysis
  let structure = 0;
  
  // 1. Answer Length Analysis (0-20 points)
  const answerLength = answer.length;
  if (answerLength >= 50 && answerLength <= 500) {
    structure += 20; // Optimal length
  } else if (answerLength >= 30 && answerLength <= 800) {
    structure += 15; // Good length
  } else if (answerLength >= 20 && answerLength <= 1000) {
    structure += 10; // Acceptable length
  }
  
  // 2. Formatting and Structure (0-30 points)
  if (/^Q:|<h[1-6]>|<h[1-6] /.test(answer) || /<h[1-6]>/.test(content)) structure += 15;
  if (/\n\s*[-*1.]/.test(answer) || /<ul>|<ol>/.test(answer)) structure += 15;
  
  // 3. Readability Analysis (0-25 points)
  const sentences = answer.split(/[.!?]/).filter(s => s.trim().length > 0);
  const words = answer.split(/\s+/).filter(w => w.length > 0);
  const avgSentenceLen = sentences.length > 0 ? words.length / sentences.length : 0;
  
  if (avgSentenceLen >= 10 && avgSentenceLen <= 25) {
    structure += 25; // Optimal sentence length
  } else if (avgSentenceLen >= 8 && avgSentenceLen <= 30) {
    structure += 20; // Good sentence length
  } else if (avgSentenceLen >= 5 && avgSentenceLen <= 35) {
    structure += 15; // Acceptable sentence length
  }
  
  // 4. Content Organization (0-25 points)
  let organizationScore = 0;
  
  // Check for logical flow indicators
  if (/first|second|third|finally|in conclusion|to summarize/i.test(answer)) organizationScore += 10;
  if (/however|but|although|while|on the other hand/i.test(answer)) organizationScore += 5;
  if (/for example|such as|including|specifically/i.test(answer)) organizationScore += 5;
  if (/therefore|thus|as a result|consequently/i.test(answer)) organizationScore += 5;
  
  structure += Math.min(organizationScore, 25);
  
  // Cap structure at 100
  if (structure > 100) structure = 100;

  // Schema Presence
  let schema = /@type\s*[:=]\s*['"]?FAQPage['"]?/i.test(answer) || /@type\s*[:=]\s*['"]?FAQPage['"]?/i.test(content) ? 1 : 0;

  // Accessibility Score
  let access = 1;
  try {
    const robotsUrl = sourceUrl.replace(/\/$/, '') + '/robots.txt';
    const res = await axios.get(robotsUrl, { timeout: 2000 });
    if (/Disallow:\s*\//i.test(res.data)) access = 0;
  } catch (e) {
    access = 1; // If fetch fails, assume accessible
  }

  // Updated GEO Score formula using accuracy instead of aiConfidence
  const geoScore = 0.4 * accuracy + 0.2 * coverage + 0.2 * structure + 0.1 * schema * 100 + 0.1 * access * 100;
  return {
    geoScore: Math.round(geoScore),
    breakdown: { accuracy, coverage, structure, schema, access }
  };
}

// Helper function to calculate question similarity
function calculateQuestionSimilarity(question1: string, question2: string): number {
  // Convert to lowercase and split into words
  const words1 = question1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = question2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  // Calculate Jaccard similarity
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
}

/**
 * Calculate answer accuracy using Gemini AI.
 * Returns a score from 0 to 100 based on how well the answer is supported by the content.
 */
export async function calculateAccuracyWithGemini(
  answer: string,
  content: string,
  apiKey: string,
  model: string = 'gemini-1.5-flash'
): Promise<number> {
  const prompt = `Rate how well the following answer is supported by the given content on a scale of 0 to 100, where 0 means not supported at all and 100 means fully supported.\n\nContent:\n${content}\n\nAnswer:\n${answer}\n\nRespond with ONLY a number between 0 and 100.`;
  const result = await callGeminiAPI(prompt, apiKey, model, false);
  const response = result.text.trim();
  const match = response.match(/\d+/);
  return match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
}

/**
 * Applies Gemini suggestions to HTML code using DOM manipulation.
 * @param {string} htmlString - The original HTML code as a string.
 * @param {Array<{type: string, description: string, implementation: string, [key: string]: any}>} suggestions - List of suggestions from Gemini.
 * @returns {string} - The improved HTML code as a string.
 */
export function applySuggestionsWithDOM(htmlString: string, suggestions: Array<{type: string, description: string, implementation: string, [key: string]: any}>) {
  // Parse HTML string to DOM
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  suggestions.forEach(suggestion => {
    // Example: Add meta description
    if (suggestion.type === 'meta_description') {
      if (!doc.querySelector('meta[name="description"]')) {
        const meta = doc.createElement('meta');
        meta.name = 'description';
        meta.content = suggestion.implementation || 'Improved meta description.';
        doc.head.appendChild(meta);
      }
    }
    // Example: Add schema markup
    if (suggestion.type === 'schema' && suggestion.implementation) {
      const script = doc.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = suggestion.implementation;
      doc.head.appendChild(script);
    }
    // Example: Change all <b> to <strong>
    if (suggestion.type === 'replace_b_with_strong') {
      doc.querySelectorAll('b').forEach(b => {
        const strong = doc.createElement('strong');
        strong.innerHTML = b.innerHTML;
        b.parentNode.replaceChild(strong, b);
      });
    }
    // Example: Add/Update title
    if (suggestion.type === 'title') {
      let title = doc.querySelector('title');
      if (!title) {
        title = doc.createElement('title');
        doc.head.appendChild(title);
      }
      title.textContent = suggestion.implementation || 'Improved Title';
    }
    // Add more rules as needed based on suggestion.type
  });

  // Serialize DOM back to HTML string
  return doc.documentElement.outerHTML;
}