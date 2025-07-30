import React, { useState, useEffect } from 'react';
import { BarChart3, Globe, TrendingUp, Target, AlertCircle, CheckCircle, Clock, Trash2, History } from 'lucide-react';
import { apiService } from '../services/apiService';
import { historyService } from '../services/historyService';
import { useLocation } from 'react-router-dom';

interface CompetitorBenchmarkingProps {
  competitorDomains: string[];
}

interface CompetitorData {
  domain: string;
  contentQuality: number;
  seoScore: number;
  readabilityScore: number;
  keywordDensity: number;
  lastUpdated: string;
  status: 'analyzing' | 'completed' | 'error';
}

const COMPETITOR_BENCHMARKING_KEY = 'competitor_benchmarking_state';

export function CompetitorBenchmarking({ competitorDomains: initialCompetitorDomains }: CompetitorBenchmarkingProps) {
  const location = useLocation();
  const stateUrls = location.state && Array.isArray(location.state.urls) ? location.state.urls : null;
  const [competitorDomains, setCompetitorDomains] = useState<string[]>(stateUrls || initialCompetitorDomains);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(COMPETITOR_BENCHMARKING_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.competitorDomains) setCompetitorDomains(parsed.competitorDomains);
        if (parsed.competitors) setCompetitors(parsed.competitors);
        if (parsed.newDomain) setNewDomain(parsed.newDomain);
        // Add other relevant state restores here
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(COMPETITOR_BENCHMARKING_KEY, JSON.stringify({
      competitorDomains,
      competitors,
      newDomain,
      // Add other relevant state here
    }));
  }, [competitorDomains, competitors, newDomain]);

  useEffect(() => {
    // Load existing competitor analyses from backend
    const loadExistingAnalyses = async () => {
      try {
        const response = await apiService.getCompetitorAnalyses();
        if (response.success && response.analyses) {
          const existingCompetitors = response.analyses.map((analysis: any) => ({
            domain: analysis.domain,
            contentQuality: analysis.analysis.contentQuality || 0,
            seoScore: analysis.analysis.seoScore || 0,
            readabilityScore: analysis.analysis.readabilityScore || 0,
            keywordDensity: analysis.analysis.keywordDensity || 0,
            lastUpdated: analysis.last_updated,
            status: 'completed' as const
          }));
          setCompetitors(existingCompetitors);
        }
      } catch (error) {
        console.error('Failed to load existing analyses:', error);
        // Fallback to competitor domains if loading fails
        const initialCompetitors = competitorDomains.map(domain => ({
          domain,
          contentQuality: 0,
          seoScore: 0,
          readabilityScore: 0,
          keywordDensity: 0,
          lastUpdated: new Date().toISOString(),
          status: 'completed' as const
        }));
        setCompetitors(initialCompetitors);
      }
    };

    loadExistingAnalyses();
  }, [competitorDomains]);

  const addCompetitor = () => {
    if (!newDomain.trim()) return;
    
    const newCompetitor: CompetitorData = {
      domain: newDomain.trim(),
      contentQuality: 0,
      seoScore: 0,
      readabilityScore: 0,
      keywordDensity: 0,
      lastUpdated: new Date().toISOString(),
      status: 'analyzing'
    };
    
    setCompetitors(prev => [...prev, newCompetitor]);
    setNewDomain('');
    analyzeCompetitor(newCompetitor.domain);
  };

  const analyzeCompetitor = async (domain: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      // Update status to analyzing
      setCompetitors(prev => prev.map(comp => 
        comp.domain === domain 
          ? { ...comp, status: 'analyzing' as const }
          : comp
      ));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call real API
      const response = await apiService.analyzeCompetitor(domain);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (response.success) {
        const analysis = response.result.analysis;
        const updatedCompetitor = {
          domain: response.result.domain,
          contentQuality: analysis.contentQuality,
          seoScore: analysis.seoScore,
          readabilityScore: analysis.readabilityScore,
          keywordDensity: analysis.keywordDensity,
          lastUpdated: response.result.lastUpdated,
          status: 'completed' as const
        };

        setCompetitors(prev => prev.map(comp => 
          comp.domain === domain 
            ? updatedCompetitor
            : comp
        ));

        // Save to history
        historyService.addContentAnalysisHistory({
          id: `content-analysis-${Date.now()}`,
          name: `Content Analysis - ${domain}`,
          url: `https://${domain}`,
          content: response.result.content || '',
          analysis: {
            seoScore: analysis.seoScore,
            readabilityScore: analysis.readabilityScore,
            keywordDensity: analysis.keywordDensity,
            suggestions: response.result.analysis.suggestions || []
          }
        });
        
        // Show success message
        alert(`✅ Content analysis for ${domain} saved to history! You can view and download it from the History page.`);
      } else {
        throw new Error(response.error || 'Analysis failed');
      }

      setTimeout(() => setAnalysisProgress(0), 1000);
    } catch (error) {
      console.error('Analysis failed:', error);
      setCompetitors(prev => prev.map(comp => 
        comp.domain === domain 
          ? { ...comp, status: 'error' as const }
          : comp
      ));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAverageScore = (competitors: CompetitorData[]) => {
    if (competitors.length === 0) return 0;
    const total = competitors.reduce((sum, comp) => sum + comp.contentQuality, 0);
    return Math.round(total / competitors.length);
  };

  const getStatusIcon = (status: CompetitorData['status']) => {
    switch (status) {
      case 'analyzing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: CompetitorData['status']) => {
    switch (status) {
      case 'analyzing':
        return 'Analyzing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  const deleteCompetitor = async (domain: string) => {
    try {
      // Find the analysis ID for this domain
      const response = await apiService.getCompetitorAnalyses();
      if (response.success && response.analyses) {
        const analysis = response.analyses.find((a: any) => a.domain === domain);
        if (analysis) {
          await apiService.deleteCompetitorAnalysis(analysis.id);
        }
      }
      
      // Remove from local state
      setCompetitors(prev => prev.filter(comp => comp.domain !== domain));
    } catch (error) {
      console.error('Failed to delete competitor:', error);
      alert('Failed to delete content analysis');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Analysis</h1>
          <p className="text-gray-600 mt-2">Analyze and compare your content against competitors</p>
        </div>
      </div>

      {/* Add Competitor */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Content URL</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Enter content URL (e.g., https://example.com/page)"
            className="flex-1 px-4 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-blue-900 font-semibold"
            onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
          />
          <button
            onClick={addCompetitor}
            disabled={!newDomain.trim() || isAnalyzing}
            className="bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing...' : 'Add Content URL'}
          </button>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && analysisProgress > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="font-semibold text-gray-900">Analyzing content...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{analysisProgress}% complete</p>
        </div>
      )}

      {/* Overview Stats */}
      {competitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Avg Content Quality</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{getAverageScore(competitors)}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Content Analyzed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{competitors.filter(c => c.status === 'completed').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Total Domains</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{competitors.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Analysis Status</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {competitors.filter(c => c.status === 'completed').length}/{competitors.length}
            </p>
          </div>
        </div>
      )}

      {/* Competitors List */}
      {competitors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Content Analysis</h3>
            <button
              onClick={() => window.location.href = '/history'}
              className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              View in History
            </button>
          </div>
          <div className="space-y-4">
            {competitors
              .slice() // copy to avoid mutating state
              .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
              .map((competitor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-semibold text-blue-700 underline break-all">{competitor.domain}</h4>
                        <p className="text-sm text-gray-600">
                          Last updated: {new Date(competitor.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(competitor.status)}
                      <span className="text-sm font-medium text-gray-600">
                        {getStatusText(competitor.status)}
                      </span>
                      {competitor.status === 'completed' && (
                        <button
                          onClick={() => deleteCompetitor(competitor.domain)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete analysis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {competitor.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Content Quality</p>
                        <p className="text-xl font-bold text-blue-600">{competitor.contentQuality}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">SEO Score</p>
                        <p className="text-xl font-bold text-green-600">{competitor.seoScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Readability</p>
                        <p className="text-xl font-bold text-purple-600">{competitor.readabilityScore}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Keyword Density</p>
                        <p className="text-xl font-bold text-orange-600">{competitor.keywordDensity}%</p>
                      </div>
                    </div>
                  )}
                  
                  {competitor.status === 'error' && (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 font-medium">Analysis failed</p>
                      <button 
                        onClick={() => analyzeCompetitor(competitor.domain)}
                        className="mt-2 text-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


    </div>
  );
} 