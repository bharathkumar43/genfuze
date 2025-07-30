// Entire SmartCompetitorAnalysis component is commented out to disable the feature.
/*
// Added: Frontend validation for domain field and user-friendly error messages for 400/403 errors from backend.
// See handleAnalyze for details.
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Target } from 'lucide-react';

interface Competitor {
  name: string;
  domain?: string;
  contentStructure?: number;
  schemaUsage?: number;
  readability?: number;
  llmReadyFormatting?: number;
  contentFreshness?: number;
  topicalAuthority?: number;
  semanticRichness?: number;
  contentUniqueness?: number;
  lastUpdated: string;
  explanations?: Record<string, string>;
  isUserWebsite?: boolean;
  error?: string;
  seoScore?: number;
  aiVisibility?: number;
  organicTraffic?: number;
  backlinks?: number;

  mentionRate?: number;
  avgRanking?: number;
}

const SMART_COMPETITOR_ANALYSIS_KEY = 'smart_competitor_analysis_state';

const SmartCompetitorAnalysis: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch competitors when domain changes
  const fetchCompetitors = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.createSmartAnalysis({
        domain: domain.trim(),
        companyName: companyName.trim(),
      });
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch competitors');
      }
      setCompetitors(data.competitors || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch competitors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!domain.trim()) {
      setError('Please enter a domain.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiService.createSmartAnalysis({ domain, userWebsite: domain, companyName });
      if (response && response.competitors) {
        setCompetitors(response.competitors);
        setError('');
      } else if (response && response.error) {
        setError(response.error);
      } else {
        setError('Unexpected error from server.');
      }
    } catch (err: any) {
      if (err.message.includes('403')) {
        setError('You are not authorized. Please log in again.');
      } else if (err.message.includes('400')) {
        setError('Invalid request. Please check your input and try again.');
      } else {
        setError('An error occurred: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure user's company is included and labeled
  let displayCompetitors = [...competitors];
  if (companyName && !displayCompetitors.some(c => c.name && c.name.toLowerCase() === companyName.trim().toLowerCase())) {
    displayCompetitors.unshift({
      name: companyName.trim() + ' (You)',
      domain: domain.trim(),
      contentStructure: 0,
      schemaUsage: 0,
      readability: 0,
      llmReadyFormatting: 0,
      contentFreshness: 0,
      topicalAuthority: 0,
      semanticRichness: 0,
      contentUniqueness: 0,
      lastUpdated: new Date().toISOString(),
      explanations: {},
      isUserWebsite: true
    });
  } else {
    displayCompetitors = displayCompetitors.map(c =>
      c.name && c.name.toLowerCase() === companyName.trim().toLowerCase()
        ? { ...c, name: c.name + ' (You)' }
        : c
    );
  }
  // No sorting by overall score, just keep order

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(SMART_COMPETITOR_ANALYSIS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.domain) setDomain(parsed.domain);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.competitors) setCompetitors(parsed.competitors);
        if (parsed.isLoading) setIsLoading(parsed.isLoading);
        if (parsed.error) setError(parsed.error);
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(SMART_COMPETITOR_ANALYSIS_KEY, JSON.stringify({
      domain,
      companyName,
      competitors,
      isLoading,
      error,
    }));
  }, [domain, companyName, competitors, isLoading, error]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Smart Competitor Analysis
          </h2>
        </div>
        <form onSubmit={handleAnalyze} className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name (e.g., Your Company)"
            className="px-4 py-2 border border-gray-300 rounded-lg text-black"
          />
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domain (e.g., yourcompany.com)"
            className="px-4 py-2 border border-gray-300 rounded-lg text-black"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Company Name</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Domain</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">SEO Score</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">AI Visibility</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Organic Traffic</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Backlinks</th>

                <th className="px-4 py-2 text-left font-semibold text-gray-700">Mention Rate</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Avg Ranking</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {displayCompetitors.map((c, idx) => (
                <tr key={idx} className={c.isUserWebsite ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-2 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-4 py-2 text-gray-700">{c.domain}</td>
                  <td className="px-4 py-2 text-blue-700 font-bold">{c.seoScore ?? '-'}</td>
                  <td className="px-4 py-2 text-blue-700 font-bold">{c.aiVisibility ?? '-'}</td>
                  <td className="px-4 py-2 text-blue-700 font-bold">{c.organicTraffic ?? '-'}</td>
                  <td className="px-4 py-2 text-blue-700 font-bold">{c.backlinks ?? '-'}</td>

                  <td className="px-4 py-2 text-blue-700 font-bold">{c.mentionRate ?? '-'}</td>
                  <td className="px-4 py-2 text-blue-700 font-bold">{c.avgRanking ?? '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{c.lastUpdated ? new Date(c.lastUpdated).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {competitors.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">No competitors found. Enter a field/domain and analyze.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SmartCompetitorAnalysis;
*/ 