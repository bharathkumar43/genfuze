import React, { useState, useEffect } from 'react';
import { Zap, FileText, BarChart3, History, DollarSign, Target, Search, Loader2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SessionData } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { historyService } from '../services/historyService';
import type { HistoryItem, QAHistoryItem } from '../types';

const SESSIONS_KEY = 'llm_qa_sessions';
const CURRENT_SESSION_KEY = 'llm_qa_current_session';

// SVG/mini-visuals for each feature
const BarChartSVG = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><rect x="2" y="12" width="5" height="10" fill="#3b82f6"/><rect x="10" y="6" width="5" height="16" fill="#60a5fa"/><rect x="18" y="2" width="5" height="20" fill="#2563eb"/><rect x="26" y="8" width="5" height="14" fill="#93c5fd"/><rect x="34" y="16" width="5" height="6" fill="#1e40af"/></svg>
);
const PieChartSVG = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><circle cx="12" cy="12" r="10" fill="#fbbf24"/><path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="#f59e42"/></svg>
);
const MagicWandSVG = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><rect x="18" y="4" width="4" height="16" rx="2" fill="#a21caf"/><circle cx="20" cy="4" r="3" fill="#f472b6"/><circle cx="20" cy="20" r="2" fill="#f472b6"/></svg>
);
const StructureSVG = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><rect x="6" y="10" width="8" height="8" fill="#10b981"/><rect x="26" y="6" width="8" height="8" fill="#34d399"/><rect x="16" y="2" width="8" height="8" fill="#6ee7b7"/><path d="M14 14 L20 10 L26 14" stroke="#10b981" strokeWidth="2" fill="none"/></svg>
);
const CalendarSVG = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><rect x="6" y="6" width="28" height="14" rx="3" fill="#f87171"/><rect x="10" y="10" width="6" height="6" fill="#fff"/><rect x="24" y="10" width="6" height="6" fill="#fff"/></svg>
);
const LineChartSVG = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none"><polyline points="2,22 10,10 18,14 26,6 34,18 38,10" fill="none" stroke="#6366f1" strokeWidth="2"/><circle cx="10" cy="10" r="2" fill="#6366f1"/><circle cx="26" cy="6" r="2" fill="#6366f1"/><circle cx="34" cy="18" r="2" fill="#6366f1"/></svg>
);

function FeatureCard({ title, description, button, onClick, icon, visual }) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow hover:shadow-lg transition flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-center justify-between">
          {icon}
          {visual && <div className="ml-auto">{visual}</div>}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="mb-4 text-gray-600">{description}</p>
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-auto"
        onClick={onClick}
      >
        {button}
      </button>
    </div>
  );
}

export function Overview() {
  const { user } = useAuth();
  const [sessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);
  const navigate = useNavigate();
  
  // Company analysis state
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // History data state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load history items from service
  useEffect(() => {
    const items = historyService.getHistoryItems();
    setHistoryItems(items);
    console.log('[Overview] Loaded history items:', items.length);
  }, [refreshKey]);

  // Listen for storage changes to auto-refresh
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'comprehensive_history' || e.key === 'sessions') {
        console.log('[Overview] Storage changed, refreshing data');
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes every 3 seconds (fallback)
    const interval = setInterval(() => {
      const currentItems = historyService.getHistoryItems();
      if (currentItems.length !== historyItems.length) {
        console.log('[Overview] Item count changed, refreshing data');
        setRefreshKey(prev => prev + 1);
      }
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [historyItems.length]);

  // Only include sessions for the logged-in user
  const userSessions = user ? sessions.filter(s => s.userId === user.id) : [];

  const getTotalCost = () => {
    // Calculate from sessions
    const sessionsCost = userSessions.reduce((sum, session) => {
      return sum + parseFloat(session.statistics?.totalCost || '0');
    }, 0);
    
    // Calculate from history items
    const historyCost = historyItems.reduce((sum, item) => {
      if (item.type === 'qa') {
        const qaItem = item as QAHistoryItem;
        return sum + parseFloat(qaItem.sessionData.statistics?.totalCost || '0');
      }
      return sum;
    }, 0);
    
    const totalCost = sessionsCost + historyCost;
    console.log('[Overview] Total cost calculation:', { sessionsCost, historyCost, totalCost });
    return totalCost;
  };

  const getTotalQuestions = () => {
    // Calculate from sessions
    const sessionsQuestions = userSessions.reduce((sum, session) => {
      return sum + (session.qaData?.length || 0);
    }, 0);
    
    // Calculate from history items
    const historyQuestions = historyItems.reduce((sum, item) => {
      if (item.type === 'qa') {
        const qaItem = item as QAHistoryItem;
        return sum + (qaItem.sessionData.qaData?.length || 0);
      }
      return sum;
    }, 0);
    
    const totalQuestions = sessionsQuestions + historyQuestions;
    console.log('[Overview] Total questions calculation:', { sessionsQuestions, historyQuestions, totalQuestions });
    return totalQuestions;
  };

  const getAverageAccuracy = () => {
    // Get all QA items from sessions
    const sessionQAItems = userSessions.flatMap(session => session.qaData);
    
    // Get all QA items from history
    const historyQAItems = historyItems
      .filter(item => item.type === 'qa')
      .flatMap(item => (item as QAHistoryItem).sessionData.qaData);
    
    // Combine all QA items
    const allQAItems = [...sessionQAItems, ...historyQAItems];
    
    if (allQAItems.length === 0) return 0;
    
    // Calculate average accuracy from individual QA items
    const accuracyValues = allQAItems
      .map(qa => parseFloat(qa.accuracy || '0'))
      .filter(accuracy => accuracy > 0);
    
    if (accuracyValues.length === 0) return 0;
    
    const avgAccuracy = accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length;
    console.log('[Overview] Average accuracy calculation:', { 
      sessionQAItems: sessionQAItems.length, 
      historyQAItems: historyQAItems.length, 
      totalQAItems: allQAItems.length,
      accuracyValues: accuracyValues.length,
      avgAccuracy 
    });
    return avgAccuracy;
  };

  // Start background AI visibility analysis
  const startCompanyAnalysis = async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Start the analysis in background and get the results
      const analysisResults = await apiService.getAIVisibilityAnalysis(companyName);
      
      // Store the complete analysis results for the AI Visibility page
      localStorage.setItem('pending_ai_analysis', JSON.stringify({
        company: companyName,
        timestamp: new Date().toISOString(),
        status: 'completed',
        results: analysisResults // Store the actual results
      }));

      // Show success message
      alert(`Analysis completed for ${companyName}! You can view the results in the Analysis page.`);
      setCompanyName('');

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stats = [
    {
      title: 'Total Questions',
      value: getTotalQuestions(),
      icon: <FileText className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Cost',
      value: `$${getTotalCost().toFixed(2)}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg Accuracy',
      value: `${getAverageAccuracy().toFixed(1)}%`,
      icon: <Target className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Sessions',
      value: userSessions.length + historyItems.filter(item => item.type === 'qa').length,
      icon: <History className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const recentSessions = userSessions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome to Genfuze.ai - Your AI-Powered Content Enhancement Platform</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={async () => {
              console.log('[Overview] Manual refresh triggered');
              setIsRefreshing(true);
              setRefreshKey(prev => prev + 1);
              // Simulate a brief loading state for better UX
              setTimeout(() => {
                setIsRefreshing(false);
                // Add a subtle success feedback
                const button = document.activeElement as HTMLElement;
                if (button) {
                  button.style.transform = 'scale(1.05)';
                  setTimeout(() => {
                    button.style.transform = 'scale(1)';
                  }, 200);
                }
              }, 1000);
            }}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 border border-blue-500/20 disabled:transform-none disabled:cursor-not-allowed"
          >
            <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg border border-indigo-500/20">
            <Zap className="w-4 h-4" />
            <span className="font-semibold text-sm">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Quick Company Analysis Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Company Analysis</h2>
            <p className="text-gray-600">Enter a company name to analyze market position and competitors</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            <Search className="w-4 h-4" />
            <span>Analysis</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isAnalyzing && companyName.trim()) {
                  startCompanyAnalysis();
                }
              }}
              placeholder="Enter company name (e.g., Microsoft, Apple, Tesla)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900 placeholder-gray-500"
              disabled={isAnalyzing}
            />
          </div>
          <button
            onClick={startCompanyAnalysis}
            disabled={isAnalyzing || !companyName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Features */}
      <h2 className="text-2xl font-semibold mb-4 mt-8">Platform Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <FeatureCard
          title="Market Analysis"
          description="Compare your company's market position, visibility, and competitive landscape with industry leaders."
          button="Analyze Now"
          icon={<BarChart3 className="w-8 h-8 text-blue-600" />}
          visual={<PieChartSVG />}
          onClick={() => navigate('/ai-visibility-analysis')}
        />
        <FeatureCard
          title="Content Analysis"
          description="Benchmark your content against competitors and gain actionable insights."
          button="Analyze Content"
          icon={<BarChart3 className="w-8 h-8 text-green-600" />}
          visual={<BarChartSVG />}
          onClick={() => navigate('/content-analysis')}
        />
        <FeatureCard
          title="Content Enhancement"
          description="Generate questions and answers from your content using AI."
          button="Enhance Content"
          icon={<FileText className="w-8 h-8 text-blue-500" />}
          visual={<MagicWandSVG />}
          onClick={() => navigate('/enhance-content')}
        />
        <FeatureCard
          title="Content Structure Analysis"
          description="Analyze and improve the structure of your content for better engagement."
          button="Analyze Structure"
          icon={<Target className="w-8 h-8 text-purple-600" />}
          visual={<StructureSVG />}
          onClick={() => navigate('/content-structure-analysis')}
        />
        <FeatureCard
          title="Session Management"
          description="Track, save, and revisit your Q&A sessions."
          button="Manage Sessions"
          icon={<History className="w-8 h-8 text-orange-600" />}
          visual={<CalendarSVG />}
          onClick={() => navigate('/sessions')}
        />
        <FeatureCard
          title="Statistics & Cost Breakdown"
          description="Monitor your usage, costs, and performance over time."
          button="View Stats"
          icon={<DollarSign className="w-8 h-8 text-green-700" />}
          visual={<LineChartSVG />}
          onClick={() => navigate('/statistics')}
        />
      </div>
    </div>
  );
} 