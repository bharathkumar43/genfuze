import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const AI_VISIBILITY_ANALYSIS_KEY = 'ai_visibility_analysis_state';

const AIVIsibilityAnalysis: React.FC = () => {
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(AI_VISIBILITY_ANALYSIS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.result) setResult(parsed.result);
        if (parsed.error) setError(parsed.error);
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(AI_VISIBILITY_ANALYSIS_KEY, JSON.stringify({
      company,
      result,
      error,
    }));
  }, [company, result, error]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiService.getAIVisibilityAnalysis(company);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (val: any) => {
    if (val === null || val === undefined) return 'N/A';
    return val;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">AI Visibility Analysis</h2>
      <div className="flex mb-4">
        <input
          type="text"
          className="flex-1 border border-blue-400 rounded px-3 py-2 mr-2 text-blue-900 font-semibold focus:ring-blue-600 focus:border-transparent"
          placeholder="Enter company or product name"
          value={company}
          onChange={e => setCompany(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleAnalyze}
          disabled={loading || !company.trim()}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {result && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Competitors for <span className="text-blue-700">{result.company}</span></h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Competitor Name</th>
                  <th className="px-4 py-2 border">Citation Count</th>
                  <th className="px-4 py-2 border">Share of Voice (%)</th>
                  <th className="px-4 py-2 border">Customer Rating</th>
                </tr>
              </thead>
              <tbody>
                {result.competitors.map((comp: any) => (
                  <tr key={comp.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border font-bold">{displayValue(comp.name)}</td>
                    <td className="px-4 py-2 border text-center">{displayValue(comp.citationCount)}</td>
                    <td className="px-4 py-2 border text-center">{comp.shareOfVoice === null || comp.shareOfVoice === undefined ? 'N/A' : comp.shareOfVoice}</td>
                    <td className="px-4 py-2 border text-center">{displayValue(comp.customerRating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVIsibilityAnalysis; 