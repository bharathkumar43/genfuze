import React from 'react';
import { Settings, Bot, HelpCircle, Plus, Minus } from 'lucide-react';

interface ConfigurationProps {
  // Question Generation
  questionProvider: string;
  questionModel: string;
  onQuestionProviderChange: (provider: string) => void;
  onQuestionModelChange: (model: string) => void;
  
  // Answer Generation
  answerProvider: string;
  answerModel: string;
  onAnswerProviderChange: (provider: string) => void;
  onAnswerModelChange: (model: string) => void;
  
  // Question Count
  questionCount?: number;
  onQuestionCountChange?: (count: number) => void;
}

export function Configuration({ 
  questionProvider, 
  questionModel, 
  onQuestionProviderChange, 
  onQuestionModelChange,
  answerProvider,
  answerModel,
  onAnswerProviderChange,
  onAnswerModelChange,
  questionCount = 5,
  onQuestionCountChange 
}: ConfigurationProps) {
  
  const getModelsForProvider = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return [
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
          { value: 'gemini-pro', label: 'Gemini Pro' }
        ];
      case 'openai':
        return [
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Recommended)' },
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
        ];
      case 'perplexity':
        return [
          { value: 'r1-1776', label: 'R1-1776 (Recommended)' },
          { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar Small' },
          { value: 'llama-3.1-sonar-medium-128k-online', label: 'Llama 3.1 Sonar Medium' },
          { value: 'llama-3.1-sonar-large-128k-online', label: 'Llama 3.1 Sonar Large' }
        ];
      default:
        return [];
    }
  };

  // Handle question provider change
  const handleQuestionProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    onQuestionProviderChange(newProvider);
    
    // Set default model based on provider
    let defaultModel = '';
    if (newProvider === 'openai') {
      defaultModel = 'gpt-3.5-turbo'; // Default to GPT-3.5 Turbo for ChatGPT
    } else {
      const models = getModelsForProvider(newProvider);
      if (models.length > 0) {
        defaultModel = models[0].value;
      }
    }
    
    if (defaultModel) {
      onQuestionModelChange(defaultModel);
    }
  };

  // Handle answer provider change
  const handleAnswerProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    onAnswerProviderChange(newProvider);
    
    // Set default model based on provider
    let defaultModel = '';
    if (newProvider === 'openai') {
      defaultModel = 'gpt-3.5-turbo'; // Default to GPT-3.5 Turbo for ChatGPT
    } else {
      const models = getModelsForProvider(newProvider);
      if (models.length > 0) {
        defaultModel = models[0].value;
      }
    }
    
    if (defaultModel) {
      onAnswerModelChange(defaultModel);
    }
  };

  const handleQuestionCountChange = (increment: boolean) => {
    if (onQuestionCountChange) {
      const newCount = increment ? questionCount + 1 : questionCount - 1;
      if (newCount >= 1 && newCount <= 50) {
        onQuestionCountChange(newCount);
      }
    }
  };

  return (
    <div className="card mb-8 backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-6 h-6 text-black animate-pulse" />
        <h2 className="text-2xl font-bold text-black">Configuration</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Question Generation Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-200 rounded-lg">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-lg font-bold text-black">Question Generation</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-black cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                LLM provider and model for generating questions
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Provider</label>
              <select value={questionProvider} onChange={handleQuestionProviderChange} className="w-full bg-white border border-black/20 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black">
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">ChatGPT (OpenAI)</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Model</label>
              <select value={questionModel} onChange={e => onQuestionModelChange(e.target.value)} className="w-full bg-white border border-black/20 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black">
                {getModelsForProvider(questionProvider).map(modelOption => (
                  <option key={modelOption.value} value={modelOption.value}>
                    {modelOption.label}
                  </option>
                ))}
              </select>
              {questionProvider === 'openai' && questionModel === 'gpt-3.5-turbo' && (
                <div className="text-xs text-green-600 mt-1 font-medium">✓ Recommended for best performance and cost</div>
              )}
            </div>
          </div>
        </div>
        {/* Answer Generation Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-200 rounded-lg">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-lg font-bold text-black">Answer Generation</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-black cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                LLM provider and model for generating answers
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Provider</label>
              <select value={answerProvider} onChange={handleAnswerProviderChange} className="w-full bg-white border border-black/20 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black">
                <option value="gemini">Gemini (Google)</option>
                <option value="openai">ChatGPT (OpenAI)</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Model</label>
              <select value={answerModel} onChange={e => onAnswerModelChange(e.target.value)} className="w-full bg-white border border-black/20 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black">
                {getModelsForProvider(answerProvider).map(modelOption => (
                  <option key={modelOption.value} value={modelOption.value}>
                    {modelOption.label}
                  </option>
                ))}
              </select>
              {answerProvider === 'openai' && answerModel === 'gpt-3.5-turbo' && (
                <div className="text-xs text-green-600 mt-1 font-medium">✓ Recommended for best performance and cost</div>
              )}
            </div>
          </div>
        </div>
        {/* Question Count Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gray-200 rounded-lg">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-lg font-bold text-black">Question Count</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-black cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Number of questions to generate
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Count</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuestionCountChange(false)}
                  disabled={questionCount <= 1}
                  className="p-2 bg-black border border-black rounded-lg text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-black">{questionCount}</span>
                </div>
                <button
                  onClick={() => handleQuestionCountChange(true)}
                  disabled={questionCount >= 50}
                  className="p-2 bg-black border border-black rounded-lg text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="text-xs text-black mt-2 text-center">
                Range: 1-50 questions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}