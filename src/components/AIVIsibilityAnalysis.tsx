import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { historyService } from '../services/historyService';
import AIVisibilityTable from './AIVisibilityTable';
import { AIVisibilityHistoryItem } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AI_VISIBILITY_ANALYSIS_KEY = 'ai_visibility_analysis_state';
const HISTORY_KEY = 'comprehensive_history';

const AIVIsibilityAnalysis: React.FC = () => {
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [historyItems, setHistoryItems] = useLocalStorage<AIVisibilityHistoryItem[]>(HISTORY_KEY, []);

  // Function to save analysis to history
  const saveToHistory = (analysisResult: any, companyName: string, industryName?: string) => {
    historyService.addAIVisibilityHistory({
      id: `ai-visibility-${Date.now()}`,
      name: `AI Visibility Analysis - ${companyName}`,
      company: companyName,
      industry: industryName,
      analysis: {
        competitors: analysisResult.competitors || [],
        serviceStatus: analysisResult.serviceStatus || {
          gemini: true,
          perplexity: true,
          claude: true,
          chatgpt: true
        },
        summary: analysisResult.summary || {
          totalCompetitors: 0,
          averageVisibilityScore: 0,
          topCompetitor: ''
        }
      }
    });

    // Show success message
    alert(`✅ AI Visibility analysis for ${companyName} saved to history! You can view and download it from the History page.`);
  };

  // Restore state on mount and check for pending analysis
  useEffect(() => {
    // Check for pending analysis from Overview page
    const pendingAnalysis = localStorage.getItem('pending_ai_analysis');
    if (pendingAnalysis) {
      try {
        const parsed = JSON.parse(pendingAnalysis);
        if (parsed.status === 'completed' && parsed.company) {
          console.log('📋 Found pending analysis for:', parsed.company);
          
          // If we have the results stored, use them directly
          if (parsed.results) {
            console.log('✅ Using stored results for:', parsed.company);
            setCompany(parsed.company);
            setResult(parsed.results);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 5000);
            
            // Save to history
            saveToHistory(parsed.results, parsed.company, parsed.industry);
          } else {
            // Fallback: call API if results not stored
            console.log('🔄 No stored results, calling API for:', parsed.company);
            setCompany(parsed.company);
            handleAnalyzeWithCompany(parsed.company);
          }
          
          // Clear the pending analysis
          localStorage.removeItem('pending_ai_analysis');
        }
      } catch (error) {
        console.error('Error parsing pending analysis:', error);
        localStorage.removeItem('pending_ai_analysis');
      }
    } else {
      // Restore saved state only if no pending analysis
      const saved = localStorage.getItem(AI_VISIBILITY_ANALYSIS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.company) setCompany(parsed.company);
          if (parsed.industry) setIndustry(parsed.industry);
          if (parsed.result) setResult(parsed.result);
          if (parsed.error) setError(parsed.error);
        } catch {}
      }
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(AI_VISIBILITY_ANALYSIS_KEY, JSON.stringify({
      company,
      industry,
      result,
      error,
    }));
  }, [company, industry, result, error]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiService.getAIVisibilityAnalysis(company, industry);
      setResult(data);
      
      // Save to history
      saveToHistory(data, company, industry);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithCompany = async (companyName: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCompany(companyName);

    try {
      const data = await apiService.getAIVisibilityAnalysis(companyName, industry);
      setResult(data);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Save to history
      saveToHistory(data, companyName, industry);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Market Analysis</h2>
      
      {/* Input Form - Only show when no results or when user wants to analyze new company */}
      {!result && !loading && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            className="flex-1 border border-blue-400 rounded px-3 py-2 text-blue-900 font-semibold focus:ring-blue-600 focus:border-transparent"
            placeholder="Enter company or product name"
            value={company}
            onChange={e => setCompany(e.target.value)}
          />
          <input
            type="text"
            className="flex-1 border border-blue-400 rounded px-3 py-2 text-blue-900 font-semibold focus:ring-blue-600 focus:border-transparent"
            placeholder="Industry (optional)"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleAnalyze}
            disabled={loading || !company.trim()}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      )}

      {/* Show "Analyze New Company" button when results are displayed */}
      {result && !loading && (
        <div className="mb-6">
          <button
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            onClick={() => {
              setResult(null);
              setError(null);
              setCompany('');
              setIndustry('');
            }}
          >
            Analyze New Company
          </button>
        </div>
      )}

      {error && (
        <div className="text-red-600 mb-4 p-4 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      {showSuccessMessage && (
        <div className="text-green-600 mb-4 p-4 bg-green-50 rounded border border-green-200">
          ✅ Analysis completed successfully! Results are ready below.
        </div>
      )}

      {result && result.serviceStatus && (
        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">AI Service Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${result.serviceStatus.gemini ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Gemini: {result.serviceStatus.gemini ? 'Available' : 'Overloaded'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${result.serviceStatus.perplexity ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Perplexity: {result.serviceStatus.perplexity ? 'Available' : 'Overloaded'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${result.serviceStatus.claude ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Claude: {result.serviceStatus.claude ? 'Available' : 'Overloaded'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${result.serviceStatus.chatgpt ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>ChatGPT: {result.serviceStatus.chatgpt ? 'Available' : 'Overloaded'}</span>
            </div>
          </div>
          {Object.values(result.serviceStatus).filter(Boolean).length < 2 && (
            <p className="text-orange-600 text-sm mt-2">
              ⚠️ Some AI services are currently overloaded. Results may be less accurate.
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing competitors and calculating AI visibility scores...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments as we analyze multiple AI engines</p>
        </div>
      )}

      {/* Show when results are being loaded from storage */}
      {!loading && !result && company && (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              Analysis Results for <span className="text-blue-700">{result.company}</span>
            </h3>
            {result.industry && (
              <p className="text-gray-600">Industry: {result.industry}</p>
            )}
          </div>

          {/* Enhanced AI Visibility Table */}
          <AIVisibilityTable data={result} />
        </div>
      )}
    </div>
  );
};

export default AIVIsibilityAnalysis; 