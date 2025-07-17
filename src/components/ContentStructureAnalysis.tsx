import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Copy, 
  Download,
  Eye,
  Code,
  TrendingUp,
  Target,
  BookOpen,
  Search,
  Brain
} from 'lucide-react';
import { contentStructureService } from '../services/contentStructureService';
import { apiService } from '../services/apiService';
import type { ContentStructureAnalysis, StructureSuggestion } from '../services/contentStructureService';
import { applySuggestionsWithDOM } from '../utils/analysis';

interface ContentStructureAnalysisProps {
  content: string;
  url?: string;
  onBack: () => void;
}

const STRUCTURE_ANALYSIS_KEY = 'structure_analysis_state';

export function ContentStructureAnalysis({ content, url, onBack }: ContentStructureAnalysisProps) {
  const [analysis, setAnalysis] = useState<ContentStructureAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [improvedContent, setImprovedContent] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'structured' | 'metadata' | 'schema'>('overview');
  const [structuredView, setStructuredView] = useState<'plain' | 'landing'>('plain');
  const [schemaView, setSchemaView] = useState<'schema' | 'faqs'>('schema');
  const [urlInput, setUrlInput] = useState(url || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [pastedContent, setPastedContent] = useState(content || '');
  const [fullPageHtml, setFullPageHtml] = useState<string>('');
  const [codeViewType, setCodeViewType] = useState<'plain' | 'landing' | 'code' | 'improved'>('plain');
  const [improvedFullPageHtml, setImprovedFullPageHtml] = useState<string>('');
  const [isImprovingCode, setIsImprovingCode] = useState(false);

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STRUCTURE_ANALYSIS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.urlInput) setUrlInput(parsed.urlInput);
        if (parsed.analysis) setAnalysis(parsed.analysis);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.structuredView) setStructuredView(parsed.structuredView);
        if (parsed.schemaView) setSchemaView(parsed.schemaView);
        if (parsed.pastedContent) setPastedContent(parsed.pastedContent);
        if (parsed.fullPageHtml) setFullPageHtml(parsed.fullPageHtml);
        if (parsed.codeViewType) setCodeViewType(parsed.codeViewType);
        if (parsed.improvedFullPageHtml) setImprovedFullPageHtml(parsed.improvedFullPageHtml);
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(STRUCTURE_ANALYSIS_KEY, JSON.stringify({
      urlInput,
      analysis,
      activeTab,
      structuredView,
      schemaView,
      pastedContent,
      fullPageHtml,
      codeViewType,
      improvedFullPageHtml,
    }));
  }, [urlInput, analysis, activeTab, structuredView, schemaView, pastedContent, fullPageHtml, codeViewType, improvedFullPageHtml]);

  useEffect(() => {
    if (pastedContent) {
      analyzeContent(pastedContent, urlInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastedContent]);

  const analyzeContent = async (contentToAnalyze: string, urlToAnalyze?: string) => {
    setIsAnalyzing(true);
    try {
      const result = await contentStructureService.analyzeContentStructure(contentToAnalyze, urlToAnalyze);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing content:', error);
      alert('Failed to analyze content structure');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    setUrlError(null);
    setIsUrlLoading(true);
    try {
      if (!urlInput.trim()) {
        setUrlError('Please enter a URL.');
        setIsUrlLoading(false);
        return;
      }
      // Extract content for analysis as before
      const result = await apiService.extractContentFromUrl(urlInput.trim());
      if (result && result.content) {
        setPastedContent(result.content);
      } else {
        setUrlError('Failed to extract content from the URL.');
      }
      // Extract full HTML+CSS for code view
      const fullPage = await apiService.extractFullPageHtml(urlInput.trim());
      if (fullPage && fullPage.success && fullPage.html) {
        setFullPageHtml(fullPage.html);
      } else {
        setFullPageHtml('');
      }
    } catch (error: any) {
      setUrlError(error.message || 'Failed to extract content from the URL.');
      setFullPageHtml('');
    } finally {
      setIsUrlLoading(false);
    }
  };

  // In applySuggestions and improved code generation, use the DOM-based function
  const applySuggestions = async () => {
    if (!analysis) return;
    setIsApplying(true);
    try {
      let improved;
      if (codeViewType === 'code' && fullPageHtml) {
        // Use DOM-based improvement
        improved = applySuggestionsWithDOM(fullPageHtml, analysis.suggestions);
        setFullPageHtml(improved);
      } else {
        // Use DOM-based improvement for plain content if possible
        improved = applySuggestionsWithDOM(content, analysis.suggestions);
        setImprovedContent(improved);
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
      alert('Failed to apply structure suggestions');
    } finally {
      setIsApplying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  // Generate improved code when needed
  useEffect(() => {
    if (codeViewType === 'improved' && fullPageHtml && analysis && analysis.suggestions.length > 0) {
      setIsImprovingCode(true);
      try {
        const improved = applySuggestionsWithDOM(fullPageHtml, analysis.suggestions);
        setImprovedFullPageHtml(improved);
      } catch {
        setImprovedFullPageHtml('Failed to generate improved code.');
      } finally {
        setIsImprovingCode(false);
      }
    }
  }, [codeViewType, fullPageHtml, analysis]);

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-black mb-2">Analyzing Content Structure</h2>
            <p className="text-gray-600">Analyzing your content for SEO and LLM optimization...</p>
          </div>
        </div>
      </div>
    );
  }

  // Add handler for new analysis
  const handleNewAnalysis = () => {
    setAnalysis(null);
    setUrlInput('');
    setUrlError(null);
    setPastedContent('');
    setImprovedContent('');
    setFullPageHtml('');
    setCodeViewType('plain');
    setImprovedFullPageHtml('');
    localStorage.removeItem(STRUCTURE_ANALYSIS_KEY);
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* URL Input for Structure Analysis */}
          <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Paste a URL to analyze its structure..."
              className="flex-1 px-4 py-3 border border-blue-400 rounded-lg text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
              disabled={isUrlLoading}
            />
            <button
              onClick={handleAnalyzeUrl}
              disabled={isUrlLoading || !urlInput.trim()}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50"
            >
              {isUrlLoading ? 'Analyzing...' : 'Analyze URL'}
            </button>
          </div>
          {urlError && <div className="text-red-600 mb-4">{urlError}</div>}
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-black mb-2">No Analysis Available</h2>
            <p className="text-gray-600 mb-4">Please provide content to analyze.</p>
            <button
              onClick={onBack}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-black hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <BarChart3 className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-bold text-black">Content Structure Analysis</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleNewAnalysis}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              New Analysis
            </button>
            <button
              onClick={() => downloadContent(analysis.structuredContent, 'improved-content.txt')}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${getScoreBgColor(analysis.seoScore)}`}>
                <Search className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black">SEO Score</h3>
                <p className="text-sm text-gray-600">Search Engine Optimization</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.seoScore)}`}>
              {analysis.seoScore}/100
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${getScoreBgColor(analysis.llmOptimizationScore)}`}>
                <Brain className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black">LLM Score</h3>
                <p className="text-sm text-gray-600">AI Model Optimization</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.llmOptimizationScore)}`}>
              {analysis.llmOptimizationScore}/100
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${getScoreBgColor(analysis.readabilityScore)}`}>
                <BookOpen className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black">Readability</h3>
                <p className="text-sm text-gray-600">Content Clarity</p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>
              {analysis.readabilityScore}/100
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'suggestions', label: 'Suggestions', icon: Target },
                { id: 'structured', label: 'Structured Content', icon: FileText },
                { id: 'metadata', label: 'Metadata', icon: Info },
                { id: 'schema', label: 'Schema Markup', icon: Code }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-4 rounded-lg font-bold text-sm transition-colors \
                    ${activeTab === tab.id
                      ? 'bg-white text-black'
                      : 'bg-blue-600 text-black opacity-80 hover:opacity-100'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Content Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-black">{analysis.metadata.wordCount}</div>
                      <div className="text-sm text-gray-600">Words</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-black">{analysis.metadata.readingTime}</div>
                      <div className="text-sm text-gray-600">Min Read</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-black">{analysis.suggestions.length}</div>
                      <div className="text-sm text-gray-600">Suggestions</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-black">{analysis.metadata.language.toUpperCase()}</div>
                      <div className="text-sm text-gray-600">Language</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={applySuggestions}
                      disabled={isApplying}
                      className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isApplying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Applying...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Apply Suggestions
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(analysis.structuredContent)}
                      className="bg-gray-100 text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Improved
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Structure Improvement Suggestions</h3>
                <div className="space-y-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                          {getPriorityIcon(suggestion.priority)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-black">{suggestion.description}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{suggestion.implementation}</p>
                          <p className="text-sm text-gray-500">
                            <strong>Impact:</strong> {suggestion.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Content Tab */}
            {activeTab === 'structured' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">Improved Content Structure</h3>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-150 ${codeViewType === 'plain' ? 'bg-black text-white border-black' : 'bg-gray-200 text-black border-gray-300 hover:bg-gray-300'}`}
                      onClick={() => setCodeViewType('plain')}
                    >Plain</button>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-150 ${codeViewType === 'landing' ? 'bg-black text-white border-black' : 'bg-gray-200 text-black border-gray-300 hover:bg-gray-300'}`}
                      onClick={() => setCodeViewType('landing')}
                    >Landing Page</button>
                    <button
                      className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-150 ${codeViewType === 'code' ? 'bg-black text-white border-black' : 'bg-gray-200 text-black border-gray-300 hover:bg-gray-300'}`}
                      onClick={() => setCodeViewType('code')}
                    >Code</button>
                  </div>
                  {codeViewType === 'code' && (
                    <button
                      onClick={() => copyToClipboard(fullPageHtml)}
                      className="bg-gray-100 text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </button>
                  )}
                </div>
                {codeViewType === 'plain' ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-black font-mono">
                      {analysis.structuredContent}
                    </pre>
                  </div>
                ) : codeViewType === 'landing' ? (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="prose prose-lg max-w-none text-black" dangerouslySetInnerHTML={{ __html: analysis.structuredContent }} />
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre text-xs text-black font-mono">
                      {fullPageHtml || 'No code extracted yet.'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === 'metadata' && (
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Content Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={analysis.metadata.title}
                        readOnly
                        className="w-full px-3 py-2 border border-blue-400 rounded-lg bg-gray-50 text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={analysis.metadata.description}
                        readOnly
                        rows={3}
                        className="w-full px-3 py-2 border border-blue-400 rounded-lg bg-gray-50 text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                      <div className="flex flex-wrap gap-2">
                        {analysis.metadata.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                      <input
                        type="text"
                        value={analysis.metadata.author}
                        readOnly
                        className="w-full px-3 py-2 border border-blue-400 rounded-lg bg-gray-50 text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                      <input
                        type="text"
                        value={analysis.metadata.publishDate}
                        readOnly
                        className="w-full px-3 py-2 border border-blue-400 rounded-lg bg-gray-50 text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reading Time</label>
                      <input
                        type="text"
                        value={`${analysis.metadata.readingTime} minutes`}
                        readOnly
                        className="w-full px-3 py-2 border border-blue-400 rounded-lg bg-gray-50 text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Schema Tab */}
            {activeTab === 'schema' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black mb-0">Structured Data Markup</h3>
                  {analysis.structuredData.faqSchema && analysis.structuredData.faqSchema.mainEntity && analysis.structuredData.faqSchema.mainEntity.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-150 ${schemaView === 'schema' ? 'bg-black text-white border-black' : 'bg-gray-200 text-black border-gray-300 hover:bg-gray-300'}`}
                        onClick={() => setSchemaView('schema')}
                      >Schema</button>
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors duration-150 ${schemaView === 'faqs' ? 'bg-black text-white border-black' : 'bg-gray-200 text-black border-gray-300 hover:bg-gray-300'}`}
                        onClick={() => setSchemaView('faqs')}
                      >FAQs</button>
                    </div>
                  )}
                </div>
                {schemaView === 'schema' ? (
                  <div className="space-y-6">
                    {analysis.structuredData.articleSchema && (
                      <div>
                        <h4 className="font-semibold text-black mb-2">Article Schema</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="text-sm text-black font-mono overflow-x-auto">
                            {JSON.stringify(analysis.structuredData.articleSchema, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {analysis.structuredData.faqSchema && (
                      <div>
                        <h4 className="font-semibold text-black mb-2">FAQ Schema</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="text-sm text-black font-mono overflow-x-auto">
                            {JSON.stringify(analysis.structuredData.faqSchema, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4">
                    <h4 className="font-semibold text-black mb-4">FAQs</h4>
                    <div className="space-y-6">
                      {analysis.structuredData.faqSchema?.mainEntity?.map((faq, idx) => (
                        <div key={idx} className="border-b border-gray-200 pb-4 mb-4">
                          <h3 className="text-lg font-semibold text-black mb-2">Q: {faq.name}</h3>
                          <p className="text-black text-base">A: {faq.acceptedAnswer?.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 