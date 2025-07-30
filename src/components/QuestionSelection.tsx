import React, { useState } from 'react';
import { CheckSquare, Square, Play, RotateCcw, Target, Filter, RefreshCw, TrendingUp, Search } from 'lucide-react';
import { GeneratedQuestion } from '../types';

interface QuestionSelectionProps {
  questions: GeneratedQuestion[];
  onToggleQuestion: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onGenerateAnswers: () => void;
  isGeneratingAnswers: boolean;
  onOptimizeConfidence?: () => void;
  isOptimizingConfidence?: boolean;
  onCheckRelevantQuestions?: () => void;
  isCheckingRelevance?: boolean;
  hasRelevantQuestions?: boolean;
}

export function QuestionSelection({
  questions,
  onToggleQuestion,
  onSelectAll,
  onDeselectAll,
  onGenerateAnswers,
  isGeneratingAnswers,
  onOptimizeConfidence,
  isOptimizingConfidence = false,
  onCheckRelevantQuestions,
  isCheckingRelevance,
  hasRelevantQuestions
}: QuestionSelectionProps) {
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0);
  const [maxConfidence, setMaxConfidence] = useState(100);
  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState(false);
  const selectedCount = questions.filter(q => q.selected).length;

  if (questions.length === 0) return null;

  // Calculate confidence statistics
  const confidences = questions.map(q => q.confidence || 0);
  const avgConfidence = confidences.length > 0 ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 0;
  const highConfidenceCount = confidences.filter(conf => conf >= 95).length;
  const mediumConfidenceCount = confidences.filter(conf => conf >= 80 && conf < 95).length;
  const lowConfidenceCount = confidences.filter(conf => conf < 80).length;

  // Filter questions by confidence range
  const filteredQuestions = questions.filter(q => {
    const confidence = q.confidence ?? 0;
    return confidence >= minConfidence && confidence <= maxConfidence;
  });

  // Auto-select questions within confidence range
  const autoSelectInRange = () => {
    filteredQuestions.forEach(question => {
      if (!question.selected) {
        onToggleQuestion(question.id);
      }
    });
  };

  // Get questions within confidence range
  const questionsInRange = questions.filter(q => {
    const confidence = q.confidence ?? 0;
    return confidence >= minConfidence && confidence <= maxConfidence;
  });

  const selectedInRange = questionsInRange.filter(q => q.selected).length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Select Questions</h2>
          <span className="text-sm text-gray-500">
            ({selectedCount} of {questions.length} selected)
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Confidence Overview */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-green-800">Relevance Overview</h3>
          </div>
          <button
            onClick={() => setShowConfidenceBreakdown(!showConfidenceBreakdown)}
            className="text-xs text-green-600 hover:text-green-700"
          >
            {showConfidenceBreakdown ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{avgConfidence.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Average Relevance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{highConfidenceCount}</div>
            <div className="text-xs text-gray-600">≥95% Relevant</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{mediumConfidenceCount}</div>
            <div className="text-xs text-gray-600">80-94% Relevant</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{lowConfidenceCount}</div>
            <div className="text-xs text-gray-600">&lt;80% Relevant</div>
          </div>
        </div>

        {showConfidenceBreakdown && (
          <div className="mt-3 p-3 bg-white rounded border border-green-200">
            <div className="text-xs text-gray-600 mb-2">Relevance Distribution:</div>
            <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${(highConfidenceCount / questions.length) * 100}%` }}
              ></div>
              <div 
                className="bg-yellow-500 h-full" 
                style={{ width: `${(mediumConfidenceCount / questions.length) * 100}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${(lowConfidenceCount / questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>High (≥95%)</span>
              <span>Medium (80-94%)</span>
              <span>Low (&lt;80%)</span>
            </div>
          </div>
        )}

        {onOptimizeConfidence && lowConfidenceCount > 0 && (
          <div className="mt-3">
            <button
              onClick={onOptimizeConfidence}
              disabled={isOptimizingConfidence}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isOptimizingConfidence ? (
                <>
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  Optimize Low-Relevance Questions ({lowConfidenceCount})
                </>
              )}
            </button>
          </div>
        )}

        {/* Check for Relevant Questions from Other LLMs */}
        {onCheckRelevantQuestions && (
          <div className="mt-3">
            <button
              onClick={onCheckRelevantQuestions}
              disabled={isCheckingRelevance}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                hasRelevantQuestions 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isCheckingRelevance ? (
                <>
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  Checking for Relevant Questions...
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  {hasRelevantQuestions ? 'View Relevant Questions from Other LLMs' : 'Check for Relevant Questions from Other LLMs'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Confidence Range Filter */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800">Relevance Range Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Relevance:</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-12">{minConfidence}%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Relevance:</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={maxConfidence}
                onChange={e => setMaxConfidence(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-12">{maxConfidence}%</span>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={autoSelectInRange}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Target className="w-3 h-3" />
              Auto-Select in Range ({selectedInRange}/{questionsInRange.length})
            </button>
          </div>
        </div>
        
        <div className="text-xs text-gray-600">
          Showing {filteredQuestions.length} of {questions.length} questions (relevance {minConfidence}% - {maxConfidence}%)
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredQuestions.map((question, index) => (
          <div
            key={question.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              question.selected
                ? 'border-blue-300 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onToggleQuestion(question.id)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {question.selected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Question {index + 1}
                </div>
                <div className="text-gray-800">{question.question}</div>
                
                {/* Display confidence, tokens, and cost */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {typeof question.confidence === 'number' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      question.confidence >= 95 ? 'bg-green-100 text-green-800' :
                      question.confidence >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Relevance: {question.confidence.toFixed(1)}%
                    </span>
                  )}
                  
                  {typeof question.outputTokens === 'number' && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Output Tokens: {question.outputTokens}
                    </span>
                  )}
                  {typeof question.cost === 'number' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      Estimated Cost: ${question.cost.toFixed(8)}
                    </span>
                  )}
                </div>
                
                {question.confidenceReasoning && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Reasoning:</strong> {question.confidenceReasoning}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCount > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onGenerateAnswers}
            disabled={isGeneratingAnswers}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            {isGeneratingAnswers ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                Generating Answers...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate Answers for Selected Questions ({selectedCount})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}