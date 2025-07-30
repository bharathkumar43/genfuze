// Comprehensive pricing for all LLM providers (per 1K tokens)
export const PRICING = {
  // Gemini models
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
  },
  
  // OpenAI models
  'gpt-3.5-turbo': {
    input: 0.0005,
    output: 0.0015
  },
  'gpt-4': {
    input: 0.03,
    output: 0.06
  },
  'gpt-4-turbo': {
    input: 0.01,
    output: 0.03
  },
  
  // Perplexity models
  'r1-1776': {
    input: 0.0002,
    output: 0.0002
  },
  'llama-3.1-sonar-small-128k-online': {
    input: 0.0002,
    output: 0.0002
  },
  'llama-3.1-sonar-medium-128k-online': {
    input: 0.0006,
    output: 0.0006
  },
  'llama-3.1-sonar-large-128k-online': {
    input: 0.001,
    output: 0.001
  },
  
  // Serper models
  'serper-search': {
    input: 0.001,
    output: 0.001
  }
};

export interface PricingInfo {
  input: number;
  output: number;
}

// Get pricing for a specific model
export function getPricing(model: string): PricingInfo {
  return PRICING[model as keyof typeof PRICING] || { input: 0, output: 0 };
}

// Calculate cost for input and output tokens
export function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = getPricing(model);
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return inputCost + outputCost;
}

// Calculate cost breakdown
export function calculateCostBreakdown(inputTokens: number, outputTokens: number, model: string): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
} {
  const pricing = getPricing(model);
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost,
    outputCost,
    totalCost
  };
}

// Format cost for display
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(3)}m`; // Show in millicents
  } else if (cost < 1) {
    return `$${(cost * 100).toFixed(2)}c`; // Show in cents
  } else {
    return `$${cost.toFixed(4)}`; // Show in dollars
  }
}

// Get provider from model name
export function getProviderFromModel(model: string): string {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('gpt')) return 'openai';
  if (model.startsWith('llama') || model.startsWith('r1')) return 'perplexity';
  if (model.startsWith('serper')) return 'serper';
  return 'unknown';
} 