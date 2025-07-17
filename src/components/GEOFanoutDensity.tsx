import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Target, FileText, CheckCircle, XCircle, AlertCircle, Info, BarChart3, PieChart, TrendingUp, Globe, Database, Zap, ChevronUp } from 'lucide-react';
import { GEOFanoutAnalysis, FanoutQuery, AttributionAnalysis } from '../types';

interface GEOFanoutDensityProps {
  analysis?: GEOFanoutAnalysis;
  showDetails?: boolean;
}

export function GEOFanoutDensity({ analysis, showDetails = false }: GEOFanoutDensityProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null);
  const [animatedDensity, setAnimatedDensity] = useState(0);

  useEffect(() => {
    if (analysis?.success) {
      const timer = setTimeout(() => {
        setAnimatedDensity(analysis.summary.fanoutDensity);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [analysis]);

  if (!analysis || !analysis.success) {
    return null;
  }

  const { summary, densityMetrics, fanoutQueries, attributionAnalysis } = analysis;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very_high': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'high': return 'bg-accent/20 dark:bg-accent/10 text-accent dark:text-accent border-accent/30 dark:border-accent/20';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const getAttributionIcon = (isFromContent: boolean) => {
    return isFromContent ? (
      <CheckCircle className="w-4 h-4 text-primary" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getAttributionStatus = (isFromContent: boolean) => {
    return isFromContent ? 'FROM CONTENT' : 'EXTERNAL';
  };

  const getAttributionColor = (isFromContent: boolean) => {
    return isFromContent ? 'text-primary dark:text-accent' : 'text-red-700 dark:text-red-400';
  };

  const getDensityGradient = (density: number) => {
    if (density >= 0.8) return 'from-primary to-accent';
    if (density >= 0.6) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const getDensityStatus = (density: number) => {
    if (density >= 0.8) return { text: 'Excellent', color: 'text-primary dark:text-accent' };
    if (density >= 0.6) return { text: 'Good', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Needs Improvement', color: 'text-red-600 dark:text-red-400' };
  };

  const densityStatus = getDensityStatus(summary.fanoutDensity);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">GEO Fanout Density Analysis</h2>
              <p className="text-indigo-100 text-sm">Content coverage and attribution analysis</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Density Overview */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fanout Density</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.totalFanoutQueries} sub-queries • {summary.contentAttributedAnswers} from content • {summary.externalAnswers} external
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {(animatedDensity * 100).toFixed(1)}%
            </div>
            <div className={`text-sm font-medium ${densityStatus.color}`}>
              {densityStatus.text}
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getDensityGradient(summary.fanoutDensity)} transition-all duration-1000 ease-out`}
            style={{ width: `${animatedDensity * 100}%` }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalFanoutQueries}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Sub-Queries</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-2">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.contentAttributedAnswers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">From Content</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-center mb-2">
                <Globe className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.externalAnswers}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">External</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{(summary.averageAttributionScore * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Attribution</div>
            </div>
          </div>

          {/* Quality Distribution */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h5 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Quality Distribution
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(densityMetrics.qualityDistribution).map(([quality, count]) => (
                <div key={quality} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{quality.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fanout Queries and Attribution */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fanout Queries & Attribution Analysis
            </h5>
            
            <div className="space-y-3">
              {fanoutQueries.map((query, index) => {
                const attribution = attributionAnalysis[index];
                return (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setExpandedQuery(expandedQuery === index ? null : index)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getAttributionIcon(attribution?.isFromContent || false)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-800 dark:text-white">{query.query}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(query.priority)}`}>
                              {query.priority}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({query.aspect})</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`font-medium ${getAttributionColor(attribution?.isFromContent || false)}`}>
                              {getAttributionStatus(attribution?.isFromContent || false)}
                            </span>
                            {attribution && (
                              <>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {(attribution.attributionScore * 100).toFixed(1)}% similarity
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs border ${getConfidenceColor(attribution.confidence)}`}>
                                  {attribution.confidence.replace('_', ' ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {expandedQuery === index ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    </div>
                    
                    {expandedQuery === index && attribution && (
                      <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="space-y-3">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Reasoning:</span>
                            <span className="text-gray-600 dark:text-gray-400 ml-2">{attribution.reasoning}</span>
                          </div>
                          
                          {attribution.contentSnippets.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supporting Content Snippets:</div>
                              <div className="space-y-2">
                                {attribution.contentSnippets.map((snippet, snippetIndex) => (
                                  <div key={snippetIndex} className="text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Snippet {snippetIndex + 1}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {(snippet.similarity * 100).toFixed(1)}% match
                                      </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                                      "{snippet.text.substring(0, 200)}..."
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aspect Coverage Analysis */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <h5 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Aspect Coverage Analysis
            </h5>
            <div className="space-y-3">
              {Object.entries(densityMetrics.aspectCoverage).map(([aspect, coverage]) => {
                const coverageRatio = coverage.total > 0 ? coverage.fromContent / coverage.total : 0;
                return (
                  <div key={aspect} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{aspect.replace('_', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {coverage.fromContent}/{coverage.total}
                      </span>
                      <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${
                            coverageRatio > 0.8 ? 'from-primary to-accent' :
                            coverageRatio > 0.5 ? 'from-yellow-500 to-orange-600' :
                            'from-red-500 to-red-600'
                          } transition-all duration-500`}
                          style={{ width: `${coverageRatio * 100}%` }}
                        />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        coverageRatio > 0.8 ? 'bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent' :
                        coverageRatio > 0.5 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                      }`}>
                        {(coverageRatio * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights */}
          {summary.fanoutDensity < 0.5 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h6 className="font-semibold text-yellow-800 dark:text-yellow-400">Low Fanout Density Detected</h6>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Many answers are coming from external knowledge rather than your content. 
                    Consider expanding your content to cover more aspects of this topic.
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary.fanoutDensity > 0.9 && (
            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h6 className="font-semibold text-primary">Excellent Fanout Density</h6>
                  <p className="text-sm text-primary/80 mt-1">
                    Most answers are derived from your content. Your content provides comprehensive coverage for this topic.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 