import { FileText, Download, BarChart, Save, Link, Cpu, BarChart3, Loader2 } from 'lucide-react';
import { QAItem } from '../types';
import { VectorSimilarity } from './VectorSimilarity';
import { GEOFanoutDensity } from './GEOFanoutDensity';

interface ResultsProps {
  qaData: QAItem[];
  onExportCSV: () => void;
  onExportJSON: () => void;
  onGenerateReport: () => void;
  onSaveSession: () => void;
  isVisible: boolean;
  blogUrl?: string;
  sourceUrls?: string[];
  crawlMode?: 'single' | 'website';
  crawledPages?: string[];
  answerProvider?: string;
  answerModel?: string;
  isLoading?: boolean;
}

export function Results({
  qaData,
  onExportCSV,
  onExportJSON,
  onGenerateReport,
  onSaveSession,
  isVisible,
  blogUrl,
  sourceUrls,
  crawlMode,
  crawledPages,
  answerProvider,
  answerModel,
  isLoading
}: ResultsProps) {
  if (!isVisible || qaData.length === 0) return null;

  return (
    <div className="card mb-8 backdrop-blur-md bg-black/80 border border-primary/60 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-lg font-bold text-primary">Results</h3>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Questions & Answers</h2>
      </div>
      
      {/* Source and LLM Information */}
      {(blogUrl || sourceUrls || answerProvider) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            {/* Source URLs */}
            {sourceUrls && sourceUrls.length > 0 && (
              <div className="flex items-start gap-2">
                <Link className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-700">Sources ({sourceUrls.length}):</span>
                  <div className="mt-1 space-y-1">
                    {sourceUrls.map((url, index) => (
                      <div key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 underline hover:text-blue-800 break-all text-xs"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                  {crawlMode && (
                    <div className="text-xs text-gray-600 mt-1">
                      Mode: {crawlMode === 'website' ? '🌐 Website Crawl' : '📄 Single Page'}
                      {crawledPages && crawledPages.length > 0 && (
                        <span className="ml-1">({crawledPages.length} pages crawled)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Legacy single URL support */}
            {blogUrl && !sourceUrls && (
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Source:</span>
                <a 
                  href={blogUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 underline hover:text-blue-800 break-all"
                >
                  {blogUrl}
                </a>
              </div>
            )}
            
            {/* LLM Information */}
            {answerProvider && (
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-700">LLM:</span>
                <span className="text-purple-600">
                  {answerProvider}
                  {answerModel && ` (${answerModel})`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        
        <button
          onClick={onExportJSON}
          className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
        
        <button
          onClick={onGenerateReport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
        >
          <BarChart className="w-4 h-4" />
          Generate Report
        </button>
        
        <button
          onClick={onSaveSession}
          className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Session
        </button>
      </div>
      
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : (
          qaData.map((item, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:bg-blue-50 transition-colors">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Question {index + 1}</h4>
              
              <div className="space-y-4">
                <div>
                  <span className="font-semibold text-gray-700">Q:</span>
                  <p className="text-gray-800 mt-1 leading-relaxed">{item.question}</p>
                </div>
                
                <div>
                  <span className="font-semibold text-gray-700">A:</span>
                  <p className="text-gray-800 mt-1 leading-relaxed">{item.answer}</p>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Accuracy: {item.accuracy}%
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Sentiment: {item.sentiment}
                  </div>
                  <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Output Tokens: {item.outputTokens}
                  </div>
                  {typeof item.cost === 'number' && (
                    <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      API Cost: ${item.cost.toFixed(8)}
                    </div>
                  )}
                  {typeof item.geoScore === 'number' && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      GEO Score: {item.geoScore}
                    </div>
                  )}
                  {typeof item.citationLikelihood === 'number' && (
                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Citation Likelihood: {item.citationLikelihood}%
                    </div>
                  )}
                  {/* GEO Score Breakdown */}
                  {item.geoBreakdown && (
                    <div className="mt-2 text-xs text-gray-600 bg-yellow-50 border border-yellow-100 rounded p-2">
                      <div><strong>GEO Breakdown:</strong></div>
                      <div>Accuracy: {item.geoBreakdown.accuracy}</div>
                      <div>Coverage: {item.geoBreakdown.coverage}</div>
                      <div>Structure: {item.geoBreakdown.structure}</div>
                      <div>Schema: {item.geoBreakdown.schema ? 'Yes' : 'No'}</div>
                      <div>Accessibility: {item.geoBreakdown.access ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
                
                {/* Vector Similarity Analysis */}
                <VectorSimilarity
                  questionSimilarity={item.questionSimilarity}
                  answerSimilarity={item.answerSimilarity}
                  contentSimilarity={item.contentSimilarity}
                  questionConfidence={item.questionConfidence}
                  answerConfidence={item.answerConfidence}
                  contentConfidence={item.contentConfidence}
                  showDetails={false}
                />
                
                {/* GEO Fanout Density Analysis */}
                <GEOFanoutDensity
                  analysis={item.fanoutAnalysis}
                  showDetails={false}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}