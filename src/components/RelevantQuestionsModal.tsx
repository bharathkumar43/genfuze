import { useState, useMemo } from 'react';
import { Search, Brain, Calendar, Link, X, CheckCircle, AlertCircle, Users, Zap } from 'lucide-react';

interface RelevantQuestion {
  question: string;
  originalProvider: string;
  originalModel: string;
  sessionName: string;
  sessionTimestamp: string;
  relevanceScore: number;
  relevanceReasoning: string;
  sourceUrls?: string[];
  blogUrl?: string;
  similarityGroup?: string;
}

interface RelevantQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  relevantQuestions: RelevantQuestion[];
  totalChecked: number;
  message: string;
  isLoading: boolean;
  onAddQuestion: (question: string) => void;
}

export function RelevantQuestionsModal({
  isOpen,
  onClose,
  relevantQuestions,
  totalChecked,
  message,
  isLoading,
  onAddQuestion
}: RelevantQuestionsModalProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Group questions by similarity - MUST be before any early returns
  const groupedQuestions = useMemo(() => {
    if (!relevantQuestions.length) return [];

    // Group questions by similarity (using relevanceScore ranges and reasoning keywords)
    const groups: Record<string, RelevantQuestion[]> = {};
    
    relevantQuestions.forEach(question => {
      // Create a group key based on relevance score range and reasoning keywords
      let groupKey = 'other';
      
      if (question.relevanceScore >= 0.9) {
        groupKey = 'highly-similar';
      } else if (question.relevanceScore >= 0.8) {
        groupKey = 'very-similar';
      } else if (question.relevanceScore >= 0.7) {
        groupKey = 'similar';
      } else if (question.relevanceScore >= 0.6) {
        groupKey = 'related';
      } else {
        groupKey = 'other';
      }

      // If the question has a similarityGroup from the API, use that
      if (question.similarityGroup) {
        groupKey = question.similarityGroup;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(question);
    });

    // Convert to array and add metadata
    const groupColors = {
      'highly-similar': 'border-4 border-green-400 bg-green-50',
      'very-similar': 'border-4 border-blue-400 bg-blue-50',
      'similar': 'border-4 border-yellow-400 bg-yellow-50',
      'related': 'border-4 border-orange-400 bg-orange-50',
      'other': 'border-2 border-gray-300 bg-gray-50'
    };

    const groupNames = {
      'highly-similar': 'Highly Similar Questions',
      'very-similar': 'Very Similar Questions',
      'similar': 'Similar Questions',
      'related': 'Related Questions',
      'other': 'Other Questions'
    };

    return Object.entries(groups).map(([groupId, questions]) => {
      const averageScore = questions.reduce((sum, q) => sum + q.relevanceScore, 0) / questions.length;
      return {
        groupId,
        groupName: groupNames[groupId as keyof typeof groupNames] || 'Other Questions',
        questions,
        averageScore,
        groupColor: groupColors[groupId as keyof typeof groupColors] || groupColors.other
      };
    }).sort((a, b) => b.averageScore - a.averageScore); // Sort by average score
  }, [relevantQuestions]);

  if (!isOpen) return null;

  const toggleQuestionSelection = (question: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(question)) {
      newSelected.delete(question);
    } else {
      newSelected.add(question);
    }
    setSelectedQuestions(newSelected);
  };

  const addSelectedQuestions = () => {
    selectedQuestions.forEach(question => {
      onAddQuestion(question);
    });
    setSelectedQuestions(new Set());
    onClose();
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50';
    if (score >= 0.8) return 'text-blue-600 bg-blue-50';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getRelevanceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="card max-w-lg w-full mx-auto bg-black/95 border border-genfuze-green/60 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-genfuze-green" />
          <h2 className="text-xl font-bold text-genfuze-green">Relevant Questions</h2>
        </div>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Relevant Questions Found</h2>
          </div>
          <p className="text-gray-600">{message}</p>
          <div className="mt-2 text-sm text-gray-500">
            Checked {totalChecked} questions from other LLM providers
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Analyzing questions for relevance...</span>
          </div>
        ) : relevantQuestions.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Relevant Questions Found</h3>
            <p className="text-gray-500">
              No questions from other LLM providers were found to be relevant to your current content.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with Add Selected button */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Found {relevantQuestions.length} relevant questions in {groupedQuestions.length} groups
              </h3>
              {selectedQuestions.size > 0 && (
                <button
                  onClick={addSelectedQuestions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add {selectedQuestions.size} Selected Question{selectedQuestions.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Grouped Questions */}
            <div className="space-y-6">
              {groupedQuestions.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      {group.groupName} ({group.questions.length})
                    </h4>
                    <div className="text-sm text-gray-500">
                      Avg Score: {Math.round(group.averageScore * 100)}%
                    </div>
                  </div>
                  
                  {/* Questions in this group */}
                  <div className="space-y-3">
                    {group.questions.map((item, itemIndex) => (
                      <div
                        key={`${groupIndex}-${itemIndex}`}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedQuestions.has(item.question)
                            ? 'border-2 border-blue-500 bg-blue-50 shadow-md'
                            : `${group.groupColor} hover:shadow-md`
                        }`}
                        onClick={() => toggleQuestionSelection(item.question)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.has(item.question)}
                                onChange={() => toggleQuestionSelection(item.question)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <h5 className="font-medium text-gray-900">{item.question}</h5>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Brain className="w-4 h-4" />
                                <span>{item.originalProvider} ({item.originalModel})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(item.sessionTimestamp).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Session:</span>
                                <span>{item.sessionName}</span>
                              </div>
                            </div>

                            {/* Source Information */}
                            {(item.sourceUrls || item.blogUrl) && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <Link className="w-4 h-4" />
                                <span>
                                  {item.sourceUrls && item.sourceUrls.length > 0
                                    ? `${item.sourceUrls.length} source URL${item.sourceUrls.length !== 1 ? 's' : ''}`
                                    : item.blogUrl}
                                </span>
                              </div>
                            )}

                            {/* Relevance Score */}
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRelevanceColor(item.relevanceScore)}`}>
                                {getRelevanceIcon(item.relevanceScore)}
                                <span>{Math.round(item.relevanceScore * 100)}% Relevant</span>
                              </div>
                            </div>

                            {/* Reasoning */}
                            <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border">
                              <span className="font-medium">Reasoning:</span> {item.relevanceReasoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Select questions you'd like to add to your current session
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedQuestions(new Set())}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                Clear Selection
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 