const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class LLMService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.serperApiKey = process.env.SERPER_API_KEY;
    
    this.geminiBaseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.perplexityBaseUrl = process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai';
    this.serperBaseUrl = process.env.SERPER_BASE_URL || 'https://google.serper.dev';

    // Debug logs for LLM provider API keys
    console.log('[LLMService] Provider API Key Status:');
    console.log('  Gemini:      ', this.geminiApiKey ? 'SET' : 'NOT SET');
    console.log('  OpenAI:      ', this.openaiApiKey ? 'SET' : 'NOT SET');
    console.log('  Perplexity:  ', this.perplexityApiKey ? 'SET' : 'NOT SET');
    console.log('  Serper:      ', this.serperApiKey ? 'SET' : 'NOT SET');
  }

  // Estimate tokens (approximate)
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  // Gemini API call
  async callGeminiAPI(prompt, model = 'gemini-1.5-flash', isQuestion = false, retryCount = 0, continuation = false, accumulated = '') {
    if (!this.geminiApiKey) {
      console.error('[Gemini API] API key not configured');
      throw new Error('Gemini API key not configured');
    }

    console.log('[Gemini API] Making request to:', `${this.geminiBaseUrl}/models/${model}:generateContent`);
    console.log('[Gemini API] Model:', model, 'Prompt length:', prompt.length);

    try {
      const response = await require('axios').post(
        `${this.geminiBaseUrl}/models/${model}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: isQuestion ? 0.8 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: isQuestion ? 1024 : 4096,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000 // 60 second timeout
        }
      );

      console.log('[Gemini API] Response received, status:', response.status);
      const generatedText = response.data.candidates[0]?.content?.parts[0]?.text || '';
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(generatedText);
      console.log('[Gemini API] Generated text length:', generatedText.length);

      // Multi-turn completion: if output is near limit or ends mid-tag, continue
      let fullText = (accumulated || '') + generatedText;
      const nearLimit = outputTokens > 3900;
      const endsMidTag = /<[^>]*$/.test(generatedText) || /<html[\s>]*$/i.test(generatedText) || /<body[\s>]*$/i.test(generatedText);
      if (!continuation && (nearLimit || endsMidTag)) {
        console.warn('[Gemini API] Output near limit or ends mid-tag, requesting continuation...');
        // Prompt Gemini to continue
        const continuePrompt = 'Continue the previous HTML from where you left off. Return ONLY the remaining HTML inside a markdown code block (```html ... ```).';
        const contResult = await this.callGeminiAPI(continuePrompt, model, isQuestion, retryCount, true, fullText);
        fullText += contResult.text;
        return {
          text: fullText,
          inputTokens: inputTokens + contResult.inputTokens,
          outputTokens: outputTokens + contResult.outputTokens,
          model: model,
          provider: 'gemini'
        };
      }

      return {
        text: fullText,
        inputTokens,
        outputTokens,
        model: model,
        provider: 'gemini'
      };
    } catch (error) {
      // Retry on 503 or timeout, up to 3 times
      const isRetryable = (error.response && error.response.status === 503) ||
        (error.code === 'ECONNABORTED') ||
        (error.message && error.message.includes('timeout'));
      if (isRetryable && retryCount < 3) {
        await new Promise(res => setTimeout(res, 1000 * (retryCount + 1)));
        return this.callGeminiAPI(prompt, model, isQuestion, retryCount + 1, continuation, accumulated);
      }
      if (error.response?.status === 400) {
        throw new Error(`Gemini API Bad Request: ${error.response.data?.error?.message || error.message}`);
      } else if (error.response?.status === 401) {
        throw new Error('Gemini API Unauthorized: Check your API key');
      } else if (error.response?.status === 403) {
        throw new Error('Gemini API Forbidden: API key may be invalid or quota exceeded');
      } else if (error.response?.status === 429) {
        throw new Error('Gemini API Rate Limited: Too many requests');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Gemini API Timeout: Request took too long');
      } else if (error.response?.status === 503) {
        throw new Error('Gemini API Error: Request failed with status code 503');
      } else {
        throw new Error(`Gemini API Error: ${error.message}`);
      }
    }
  }

  // OpenAI/ChatGPT API call
  async callOpenAIAPI(prompt, model = 'gpt-3.5-turbo', isQuestion = false) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.post(
      `${this.openaiBaseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: isQuestion 
              ? 'You are an expert at generating relevant questions from content. Generate clear, specific questions that can be answered from the provided content.'
              : 'You are an expert at providing comprehensive and accurate answers based on the given content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: isQuestion ? 0.8 : 0.7,
        max_tokens: isQuestion ? 1024 : 2048,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        }
      }
    );

    const generatedText = response.data.choices[0]?.message?.content || '';
    const inputTokens = response.data.usage?.prompt_tokens || this.estimateTokens(prompt);
    const outputTokens = response.data.usage?.completion_tokens || this.estimateTokens(generatedText);

    return {
      text: generatedText,
      inputTokens,
      outputTokens,
      model: model,
      provider: 'openai'
    };
  }

  // Perplexity API call
  async callPerplexityAPI(prompt, model = 'r1-1776', isQuestion = false) {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await axios.post(
      `${this.perplexityBaseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: isQuestion 
              ? 'You are an expert at generating relevant questions from content. Generate clear, specific questions that can be answered from the provided content.'
              : 'You are an expert at providing comprehensive and accurate answers based on the given content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: isQuestion ? 0.8 : 0.7,
        max_tokens: isQuestion ? 1024 : 2048,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        }
      }
    );

    const generatedText = response.data.choices[0]?.message?.content || '';
    const inputTokens = response.data.usage?.prompt_tokens || this.estimateTokens(prompt);
    const outputTokens = response.data.usage?.completion_tokens || this.estimateTokens(generatedText);

    return {
      text: generatedText,
      inputTokens,
      outputTokens,
      model: model,
      provider: 'perplexity'
    };
  }

  // Google Serper API call (Answer provider only)
  async callSerperAPI(prompt, model = 'serper-search', isQuestion = false) {
    if (!this.serperApiKey) {
      throw new Error('Serper API key not configured');
    }

    // Serper is only for answers, not questions
    if (isQuestion) {
      throw new Error('Serper API is only available for answer generation, not question generation');
    }

    // Extract the question from the prompt (remove any context/instructions)
    const question = prompt.replace(/.*?(?:question|query):\s*/i, '').trim();
    
    const response = await axios.post(
      `${this.serperBaseUrl}/search`,
      {
        q: question,
        num: 10, // Number of results to fetch
        gl: 'us', // Country
        hl: 'en'  // Language
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.serperApiKey
        }
      }
    );

    // Process the search results and create a comprehensive answer
    const searchResults = response.data;
    const organicResults = searchResults.organic || [];
    const answerBox = searchResults.answerBox;
    const knowledgeGraph = searchResults.knowledgeGraph;

    let answer = '';
    
    // Start with answer box if available
    if (answerBox && answerBox.answer) {
      answer += `**Direct Answer:** ${answerBox.answer}\n\n`;
    }

    // Add knowledge graph information if available
    if (knowledgeGraph && knowledgeGraph.description) {
      answer += `**Overview:** ${knowledgeGraph.description}\n\n`;
    }

    // Add relevant search results
    if (organicResults.length > 0) {
      answer += `**Search Results:**\n\n`;
      organicResults.slice(0, 5).forEach((result, index) => {
        answer += `${index + 1}. **${result.title}**\n`;
        answer += `   ${result.snippet}\n`;
        answer += `   Source: ${result.link}\n\n`;
      });
    }

    // If no results found, provide a helpful response
    if (!answer) {
      answer = `I couldn't find specific information about "${question}". Please try rephrasing your question or check if the search terms are correct.`;
    }

    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(answer);

    return {
      text: answer,
      inputTokens,
      outputTokens,
      model: model,
      provider: 'serper'
    };
  }

  // Main method to call any LLM provider
  async callLLM(prompt, provider, model, isQuestion = false) {
    switch (provider.toLowerCase()) {
      case 'gemini':
        return this.callGeminiAPI(prompt, model, isQuestion);
      case 'openai':
      case 'chatgpt':
        return this.callOpenAIAPI(prompt, model, isQuestion);
      case 'perplexity':
        return this.callPerplexityAPI(prompt, model, isQuestion);
      case 'serper':
        return this.callSerperAPI(prompt, model, isQuestion);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  // Get available models for each provider
  getAvailableModels() {
    return {
      gemini: [
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Recommended)', pricing: { input: 0.000075, output: 0.0003 } },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', pricing: { input: 0.00125, output: 0.005 } },
        { value: 'gemini-pro', label: 'Gemini 1.0 Pro (Legacy)', pricing: { input: 0.0005, output: 0.0015 } }
      ],
      openai: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Recommended)', pricing: { input: 0.0005, output: 0.0015 } },
        { value: 'gpt-4', label: 'GPT-4', pricing: { input: 0.03, output: 0.06 } },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', pricing: { input: 0.01, output: 0.03 } }
      ],
      perplexity: [
        { value: 'r1-1776', label: 'R1-1776 (Recommended)', pricing: { input: 0.0002, output: 0.0002 } },
        { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar Small', pricing: { input: 0.0002, output: 0.0002 } },
        { value: 'llama-3.1-sonar-medium-128k-online', label: 'Llama 3.1 Sonar Medium', pricing: { input: 0.0006, output: 0.0006 } },
        { value: 'llama-3.1-sonar-large-128k-online', label: 'Llama 3.1 Sonar Large', pricing: { input: 0.001, output: 0.001 } }
      ],
      serper: [
        { value: 'serper-search', label: 'Google Search (Answer Only)', pricing: { input: 0.001, output: 0.001 } }
      ]
    };
  }

  // Check if a provider is configured
  isProviderConfigured(provider) {
    switch (provider.toLowerCase()) {
      case 'gemini':
        return !!this.geminiApiKey;
      case 'openai':
      case 'chatgpt':
        return !!this.openaiApiKey;
      case 'perplexity':
        return !!this.perplexityApiKey;
      case 'serper':
        return !!this.serperApiKey;
      default:
        return false;
    }
  }

  // Get configured providers
  getConfiguredProviders() {
    const providers = [];
    if (this.geminiApiKey) providers.push('gemini');
    if (this.openaiApiKey) providers.push('openai');
    if (this.perplexityApiKey) providers.push('perplexity');
    if (this.serperApiKey) providers.push('serper');
    return providers;
  }

  // Check relevance between two questions using LLM
  async checkQuestionRelevance(question1, question2, provider, model) {
    const prompt = `Please analyze the relevance between these two questions and provide a relevance score from 0.0 to 1.0, where 1.0 means they are asking the exact same thing and 0.0 means they are completely unrelated.

Question 1: "${question1}"
Question 2: "${question2}"

Please respond in the following JSON format:
{
  "relevanceScore": 0.85,
  "reasoning": "Both questions are asking about the same topic but with slightly different focus..."
}

Consider:
- Are they asking about the same topic/subject?
- Are they seeking similar information?
- Do they have similar intent?
- Are they asking about the same aspect of the content?

Only respond with valid JSON.`;

    try {
      const result = await this.callLLM(prompt, provider, model, false);
      
      // Parse the JSON response
      const responseText = result.text.trim();
      let parsedResponse;
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Fallback: try to extract a score from the text
        const scoreMatch = responseText.match(/relevanceScore["\s:]+([0-9]*\.?[0-9]+)/i);
        const reasoningMatch = responseText.match(/reasoning["\s:]+["']?([^"']+)["']?/i);
        
        parsedResponse = {
          relevanceScore: scoreMatch ? parseFloat(scoreMatch[1]) : 0.5,
          reasoning: reasoningMatch ? reasoningMatch[1] : 'Unable to parse reasoning from response'
        };
      }

      // Ensure relevance score is between 0 and 1
      const relevanceScore = Math.max(0, Math.min(1, parsedResponse.relevanceScore || 0.5));
      
      return {
        relevanceScore,
        reasoning: parsedResponse.reasoning || 'Relevance analysis completed',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens
      };
    } catch (error) {
      console.error('Error checking question relevance:', error);
      // Return a default response if LLM fails
      return {
        relevanceScore: 0.5,
        reasoning: 'Unable to determine relevance due to LLM error',
        inputTokens: 0,
        outputTokens: 0
      };
    }
  }

  // Compare two questions for similarity
  async compareQuestions(question1, question2, provider, model) {
    const prompt = `Please analyze the similarity between these two questions and provide a similarity score from 0 to 100, where 100 means they are asking the exact same thing and 0 means they are completely different.

Question 1: "${question1}"
Question 2: "${question2}"

Please respond in the following JSON format:
{
  "similarity": 85,
  "reasoning": "Both questions are asking about the same topic but with slightly different focus..."
}

Consider:
- Are they asking about the same topic/subject?
- Are they seeking similar information?
- Do they have similar intent?
- Are they asking about the same aspect of the content?
- How similar are the keywords and concepts used?

Only respond with valid JSON.`;

    try {
      const result = await this.callLLM(prompt, provider, model, false);
      
      // Parse the JSON response
      const responseText = result.text.trim();
      let parsedResponse;
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Fallback: try to extract a score from the text
        const scoreMatch = responseText.match(/similarity["\s:]+([0-9]+)/i);
        const reasoningMatch = responseText.match(/reasoning["\s:]+["']?([^"']+)["']?/i);
        
        parsedResponse = {
          similarity: scoreMatch ? parseInt(scoreMatch[1]) : 50,
          reasoning: reasoningMatch ? reasoningMatch[1] : 'Unable to parse reasoning from response'
        };
      }

      // Ensure similarity score is between 0 and 100
      const similarity = Math.max(0, Math.min(100, parsedResponse.similarity || 50));
      
      return {
        similarity,
        reasoning: parsedResponse.reasoning || 'Similarity analysis completed',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        provider,
        model
      };
    } catch (error) {
      console.error('Error comparing questions:', error);
      // Return a default response if LLM fails
      return {
        similarity: 50,
        reasoning: 'Unable to determine similarity due to LLM error',
        inputTokens: 0,
        outputTokens: 0,
        provider,
        model
      };
    }
  }

  // Calculate confidence for a question based on content relevance
  async calculateConfidence(question, content, provider, model) {
    const prompt = `Rate how relevant the following question is to the given blog content on a scale of 0 to 100, where 0 means not relevant at all and 100 means extremely relevant.

Only consider how closely the question relates to the topics, facts, or ideas present in the blog content.

Blog Content:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Question: ${question}

Please respond in the following JSON format:
{
  "confidence": 85,
  "reasoning": "This question is highly relevant because it directly asks about the main topic discussed in the content..."
}

Only respond with valid JSON.`;

    try {
      const result = await this.callLLM(prompt, provider, model, false);
      
      // Parse the JSON response
      const responseText = result.text.trim();
      let parsedResponse;
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(responseText);
        }
      } catch (parseError) {
        // Fallback: try to extract a score from the text
        const scoreMatch = responseText.match(/confidence["\s:]+([0-9]+)/i);
        const reasoningMatch = responseText.match(/reasoning["\s:]+["']?([^"']+)["']?/i);
        
        parsedResponse = {
          confidence: scoreMatch ? parseInt(scoreMatch[1]) : 50,
          reasoning: reasoningMatch ? reasoningMatch[1] : 'Unable to parse reasoning from response'
        };
      }

      // Ensure confidence score is between 0 and 100
      const confidence = Math.max(0, Math.min(100, parsedResponse.confidence || 50));
      
      return {
        confidence,
        reasoning: parsedResponse.reasoning || 'Confidence analysis completed',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        provider,
        model
      };
    } catch (error) {
      console.error('Error calculating confidence:', error);
      // Return a default response if LLM fails
      return {
        confidence: 50,
        reasoning: 'Unable to determine confidence due to LLM error',
        inputTokens: 0,
        outputTokens: 0,
        provider,
        model
      };
    }
  }
}

// async function getGeminiEmbedding(text) {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) throw new Error('Missing Gemini API key');
//   const genAI = new GoogleGenerativeAI(apiKey);
//   // Use the embedding model (e.g., 'embedding-001')
//   const model = genAI.getGenerativeModel({ model: 'embedding-001' });
//   const result = await model.embedContent(text);
//   // result.embedding.values is the embedding array
//   return result.embedding.values;
// }

module.exports = {
  LLMService,
  // getGeminiEmbedding,
}; 