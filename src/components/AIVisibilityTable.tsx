import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface VisibilityBreakdown {
  mentionsScore: number;
  positionScore: number;
  sentimentScore: number;
  brandMentionsScore: number;
}

interface KeyMetrics {
  mentionsCount: number;
  position: number;
  sentiment: number;
  brandMentions: number;
  positiveWords: number;
  negativeWords: number;
}

interface CompetitorAnalysis {
  name: string;
  citationCount: number;
  aiScores: {
    gemini: number;
    perplexity: number;
    claude: number;
    chatgpt: number;
  };
  totalScore: number;
  breakdowns: {
    gemini: VisibilityBreakdown;
    perplexity: VisibilityBreakdown;
    claude: VisibilityBreakdown;
    chatgpt: VisibilityBreakdown;
  };
  keyMetrics: {
    gemini: KeyMetrics;
    perplexity: KeyMetrics;
    claude: KeyMetrics;
    chatgpt: KeyMetrics;
  };
  scrapedData?: any;
  analysis: {
    gemini: string;
    perplexity: string;
    claude: string;
    chatgpt: string;
  };
}

interface AIVisibilityTableProps {
  data: {
    company: string;
    industry: string;
    competitors: CompetitorAnalysis[];
  };
}

const AIVisibilityTable: React.FC<AIVisibilityTableProps> = ({ data }) => {
  const [competitors, setCompetitors] = useState(data.competitors);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleDeleteCompetitor = (index: number) => {
    const competitorName = competitors[index].name;
    if (window.confirm(`Are you sure you want to remove "${competitorName}" from the analysis?`)) {
      const updatedCompetitors = competitors.filter((_, i) => i !== index);
      setCompetitors(updatedCompetitors);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitorName.trim()) {
      alert('Please enter a competitor name');
      return;
    }

    // Check if competitor already exists
    if (competitors.some(c => c.name.toLowerCase() === newCompetitorName.toLowerCase())) {
      alert('This competitor is already in the analysis');
      return;
    }

    setIsAddingCompetitor(true);
    try {
      const newCompetitor = await apiService.analyzeSingleCompetitor(newCompetitorName, data.industry);
      setCompetitors([...competitors, newCompetitor]);
      setNewCompetitorName('');
      setShowAddForm(false);
      setSuccessMessage(`${newCompetitorName} has been added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding competitor:', error);
      alert('Failed to add competitor. Please try again.');
    } finally {
      setIsAddingCompetitor(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 2.5) return 'text-green-600 bg-green-100';
    if (score >= 1.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreClass = (score: number) => {
    if (score >= 2.5) return 'text-green-600 font-semibold';
    if (score >= 1.5) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatScore = (score: number) => {
    return score.toFixed(4);
  };



  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Target Company</h3>
          <p className="text-lg font-semibold text-gray-900">{data.company}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Industry</h3>
          <p className="text-lg font-semibold text-gray-900">{data.industry || 'Not specified'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Competitors Analyzed</h3>
          <p className="text-lg font-semibold text-gray-900">{competitors.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">AI Models Used</h3>
          <p className="text-lg font-semibold text-gray-900">4 (Gemini, Perplexity, Claude, ChatGPT)</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Competitor Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Competitor</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showAddForm ? 'Cancel' : 'Add Competitor'}
          </button>
        </div>
        
        {showAddForm && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label htmlFor="competitor-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Competitor Company Name
                </label>
                <input
                  type="text"
                  id="competitor-name"
                  value={newCompetitorName}
                  onChange={(e) => setNewCompetitorName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isAddingCompetitor && newCompetitorName.trim()) {
                      handleAddCompetitor();
                    }
                  }}
                  placeholder="Enter competitor company name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isAddingCompetitor}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddCompetitor}
                  disabled={isAddingCompetitor || !newCompetitorName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingCompetitor ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    'Add & Analyze'
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              The system will automatically analyze AI visibility scores for the new competitor.
              {isAddingCompetitor && (
                <span className="text-blue-600 font-medium">
                  {' '}This may take 30-60 seconds as we analyze across 4 AI engines.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Market Analysis Results</h2>
          <p className="text-sm text-gray-600">Detailed scoring breakdown for each company across multiple models</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gemini
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Perplexity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claude
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ChatGPT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>


              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitors.map((competitor, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {competitor.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{competitor.name}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Gemini Score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(competitor.aiScores.gemini)}`}>
                      {formatScore(competitor.aiScores.gemini)}
                    </span>
                  </td>
                  
                  {/* Perplexity Score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(competitor.aiScores.perplexity)}`}>
                      {formatScore(competitor.aiScores.perplexity)}
                    </span>
                  </td>
                  
                  {/* Claude Score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(competitor.aiScores.claude)}`}>
                      {formatScore(competitor.aiScores.claude)}
                    </span>
                  </td>
                  
                  {/* ChatGPT Score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(competitor.aiScores.chatgpt)}`}>
                      {formatScore(competitor.aiScores.chatgpt)}
                    </span>
                  </td>
                  
                  {/* Average Score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${getScoreClass(competitor.totalScore)}`}>
                      {formatScore(competitor.totalScore)}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteCompetitor(index)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors"
                      title="Delete competitor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};



export default AIVisibilityTable; 