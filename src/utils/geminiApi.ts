import { ApiResult } from '../types';

// Gemini API pricing (per 1K tokens)
export const PRICING = {
  'gemini-1.5-flash': {
    input: 0.000075,
    output: 0.0003
  },
  'gemini-1.5-pro': {
    input: 0.00125,
    output: 0.005
  },
  'gemini-pro': {
    input: 0.0005,
    output: 0.0015
  }
};

// Token estimation function (approximate)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Make API call to Gemini
export async function callGeminiAPI(
  prompt: string, 
  apiKey: string, 
  model: string, 
  isQuestion = false
): Promise<ApiResult> {
  if (!apiKey) {
    throw new Error('Please enter your Gemini API key');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: isQuestion ? 0.8 : 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: isQuestion ? 1024 : 2048,
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';
  
  // Estimate tokens
  const inputTokens = estimateTokens(prompt);
  const outputTokens = estimateTokens(generatedText);
  
  return {
    text: generatedText,
    inputTokens,
    outputTokens
  };
}

// Generate high-confidence questions with detailed relevance analysis
export async function generateHighConfidenceQuestions(
  content: string,
  questionCount: number,
  apiKey: string,
  model: string
): Promise<{ questions: string[], confidences: number[], attempts: number }> {
  const maxAttempts = 3; // Maximum attempts to generate high-confidence questions
  let attempts = 0;
  let bestQuestions: string[] = [];
  let bestConfidences: number[] = [];
  let bestAverageConfidence = 0;

  while (attempts < maxAttempts) {
    attempts++;
    
    const prompt = `Generate exactly ${questionCount} questions based on the following blog content. Each question must be extremely relevant to the content—so relevant that it would receive a relevance score of 95 or higher out of 100, where 100 means the question is directly about the main topics, facts, or ideas in the blog content. Only generate questions that are clearly and strongly related to the blog content. Avoid questions that are only loosely related or require outside knowledge. Blog Content: ${content} List the ${questionCount} questions, each on a new line starting with "Q:".`;

    try {
      const result = await callGeminiAPI(prompt, apiKey, model, true);
      
      const questions = result.text.split('\n')
        .filter(line => line.trim().startsWith('Q:'))
        .map(line => line.replace(/^Q:\s*/, '').trim())
        .filter(q => q.length > 0)
        .slice(0, questionCount);

      if (questions.length === 0) {
        continue;
      }

      // Calculate confidence for these questions individually
      const { calculateConfidenceWithGemini } = await import('./analysis');
      const confidences: number[] = [];
      for (const question of questions) {
        const confidence = await calculateConfidenceWithGemini(question, content, apiKey, model);
        confidences.push(confidence);
      }
      
      const averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
      
      // Keep the best set of questions
      if (averageConfidence > bestAverageConfidence) {
        bestQuestions = questions;
        bestConfidences = confidences;
        bestAverageConfidence = averageConfidence;
      }

      // If we achieve average confidence >= 95, we can stop early
      if (averageConfidence >= 95) {
        break;
      }

      // Add delay between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      continue;
    }
  }

  return {
    questions: bestQuestions,
    confidences: bestConfidences,
    attempts
  };
}

// Enhanced confidence calculation with detailed analysis
export async function calculateDetailedConfidence(
  question: string,
  content: string,
  apiKey: string,
  model: string
): Promise<{ confidence: number, reasoning: string }> {
  const prompt = `Analyze the relevance and answerability of this question based on the given content.

Content:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Question: ${question}

Provide a detailed analysis and score the question on a scale of 0-100 based on:

1. RELEVANCE (0-25 points): How directly related is the question to the content?
2. ANSWERABILITY (0-25 points): Can the question be answered using only the provided content?
3. SPECIFICITY (0-25 points): Is the question specific enough to have a clear answer?
4. DEPTH (0-25 points): Does the question test meaningful understanding of the content?

Respond in this exact format:
SCORE: [number 0-100]
REASONING: [brief explanation of the score]

Example:
SCORE: 85
REASONING: High relevance to main topics, directly answerable from content, specific focus on key concepts, tests deep understanding.`;

  try {
    const result = await callGeminiAPI(prompt, apiKey, model, false);
    const response = result.text.trim();
    
    // Extract score and reasoning
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
    const reasoningMatch = response.match(/REASONING:\s*(.+)/i);
    
    const confidence = scoreMatch ? Math.min(Math.max(parseInt(scoreMatch[1]), 0), 100) : 50;
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Analysis unavailable';
    
    return { confidence, reasoning };
    
  } catch (error) {
    console.error('Error calculating detailed confidence:', error);
    return { confidence: 50, reasoning: 'Error in analysis' };
  }
}