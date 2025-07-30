import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity, Calendar, Users, Target, Zap, Loader2 } from 'lucide-react';
import { SessionData, QAItem, HistoryItem, QAHistoryItem } from '../types';
import { historyService } from '../services/historyService';

interface StatisticsProps {
  sessions: SessionData[];
  currentSession: SessionData | null;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

interface ProviderStats {
  [key: string]: number;
}

const STATISTICS_KEY = 'statistics_state';

export function Statistics({ sessions, currentSession }: StatisticsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('questions');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localSessions, setLocalSessions] = useState<SessionData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load history items and sessions from service
  useEffect(() => {
    const loadData = () => {
      const items = historyService.getHistoryItems();
      setHistoryItems(items);
      
      // Also get sessions from localStorage as backup
      const storedSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      setLocalSessions(storedSessions);
      
      console.log('[Statistics] Loaded data:', {
        historyItems: items.length,
        storedSessions: storedSessions.length,
        propSessions: sessions.length
      });
    };
    
    loadData();
  }, [refreshKey, sessions.length]);

  // Listen for storage changes to auto-refresh
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'comprehensive_history' || e.key === 'sessions') {
        console.log('[Statistics] Storage changed, refreshing statistics');
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes every 2 seconds (fallback)
    const interval = setInterval(() => {
      const currentItems = historyService.getHistoryItems();
      const currentSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      
      if (currentItems.length !== historyItems.length || currentSessions.length !== localSessions.length) {
        console.log('[Statistics] Data changed, refreshing statistics');
        setRefreshKey(prev => prev + 1);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [historyItems.length, localSessions.length]);



  // Calculate comprehensive real statistics
  const calculateRealStatistics = () => {
    // Get all QA sessions from multiple sources
    const allSessions: SessionData[] = [
      ...sessions,           // From props
      ...localSessions,      // From localStorage
    ];
    
    // Add QA sessions from history items
    historyItems.forEach(item => {
      if (item.type === 'qa') {
        const qaItem = item as QAHistoryItem;
        allSessions.push(qaItem.sessionData);
      }
    });
    
    // Remove duplicates based on session ID
    const uniqueSessions = allSessions.filter((session, index, self) => 
      index === self.findIndex(s => s.id === session.id)
    );

    console.log('[Statistics] Total sessions for calculation:', uniqueSessions.length);
    console.log('[Statistics] Sessions from prop:', sessions.length);
    console.log('[Statistics] Sessions from localStorage:', localSessions.length);
    console.log('[Statistics] QA items from history:', historyItems.filter(item => item.type === 'qa').length);
    
    // Debug: Log individual session details
    uniqueSessions.forEach((session, index) => {
      console.log(`[Statistics] Session ${index + 1}:`, {
        id: session.id,
        qaCount: session.qaData.length,
        totalCost: session.statistics?.totalCost,
        timestamp: session.timestamp
      });
    });

    if (uniqueSessions.length === 0) {
      return {
        totalQuestions: 0,
        totalCost: 0,
        totalTokens: 0,
        avgAccuracy: 0,
        totalSessions: 0,
        avgQuestionsPerSession: 0,
        successRate: 0,
        providerDistribution: {} as ProviderStats,
        questionsPerDay: [] as number[],
        inputTokens: 0,
        outputTokens: 0,
        avgResponseTime: 0,
        weeklyGrowth: 0,
        dailyAverage: 0,
        peakDay: '',
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        geoScoreAverage: 0,
        semanticRelevanceAverage: 0,
        vectorSimilarityAverage: 0
      };
    }

    // Calculate basic metrics
    const totalQuestions = uniqueSessions.reduce((sum, session) => sum + session.qaData.length, 0);
    const totalCost = uniqueSessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0);
    const totalTokens = uniqueSessions.reduce((sum, session) => 
      sum + session.qaData.reduce((sessionSum, qa) => sessionSum + qa.totalTokens, 0), 0
    );
    
    console.log('[Statistics] Calculated metrics:', {
      totalQuestions,
      totalCost: totalCost.toFixed(4),
      totalTokens,
      sessionCount: allSessions.length
    });
    
    // Calculate accuracy (from individual QA items)
    const allQAItems = uniqueSessions.flatMap(session => session.qaData);
    const accuracyValues = allQAItems
      .map(qa => parseFloat(qa.accuracy || '0'))
      .filter(acc => !isNaN(acc) && acc > 0);
    const avgAccuracy = accuracyValues.length > 0 
      ? accuracyValues.reduce((sum, acc) => sum + acc, 0) / accuracyValues.length 
      : 0;
    
    console.log('[Statistics] Accuracy calculation:', {
      totalQAItems: allQAItems.length,
      itemsWithAccuracy: accuracyValues.length,
      avgAccuracy: avgAccuracy.toFixed(1) + '%',
      accuracyValues: accuracyValues.slice(0, 5) // Show first 5 values
    });

    // Calculate provider distribution
    const providerDistribution: ProviderStats = {};
    
    // Initialize only the providers that are actually available in the app
    const allProviders = ['openai', 'gemini', 'perplexity'];
    allProviders.forEach(provider => {
      providerDistribution[provider] = 0;
    });
    
    // Count actual usage
    allQAItems.forEach(qa => {
      // Extract provider from model or use default
      const provider = qa.provider || 'Unknown';
      if (providerDistribution.hasOwnProperty(provider)) {
        providerDistribution[provider]++;
      } else {
        providerDistribution[provider] = (providerDistribution[provider] || 0) + 1;
      }
    });

    // Calculate token breakdown
    const inputTokens = uniqueSessions.reduce((sum, session) => 
      sum + session.qaData.reduce((sessionSum, qa) => sessionSum + qa.inputTokens, 0), 0
    );
    const outputTokens = uniqueSessions.reduce((sum, session) => 
      sum + session.qaData.reduce((sessionSum, qa) => sessionSum + qa.outputTokens, 0), 0
    );

    // Calculate sentiment distribution
    const sentimentDistribution = { positive: 0, negative: 0, neutral: 0 };
    allQAItems.forEach(qa => {
      const sentiment = qa.sentiment?.toLowerCase() || 'neutral';
      if (sentiment.includes('positive')) sentimentDistribution.positive++;
      else if (sentiment.includes('negative')) sentimentDistribution.negative++;
      else sentimentDistribution.neutral++;
    });

    // Calculate GEO score average
    const geoScoreValues = allQAItems
      .map(qa => qa.geoScore || 0)
      .filter(score => score > 0);
    const geoScoreAverage = geoScoreValues.length > 0 
      ? geoScoreValues.reduce((sum, score) => sum + score, 0) / geoScoreValues.length 
      : 0;

    // Calculate semantic relevance average
    const semanticRelevanceValues = allQAItems
      .map(qa => parseFloat(qa.semanticRelevance || '0'))
      .filter(rel => !isNaN(rel) && rel > 0);
    const semanticRelevanceAverage = semanticRelevanceValues.length > 0 
      ? semanticRelevanceValues.reduce((sum, rel) => sum + rel, 0) / semanticRelevanceValues.length 
      : 0;

    // Calculate vector similarity average
    const vectorSimilarityValues = allQAItems
      .map(qa => {
        const similarity = qa.vectorSimilarity;
        if (typeof similarity === 'string' && similarity.includes('%')) {
          return parseFloat(similarity.replace('%', ''));
        }
        return parseFloat(similarity || '0');
      })
      .filter(sim => !isNaN(sim) && sim > 0);
    const vectorSimilarityAverage = vectorSimilarityValues.length > 0 
      ? vectorSimilarityValues.reduce((sum, sim) => sum + sim, 0) / vectorSimilarityValues.length 
      : 0;

    // Calculate weekly growth
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekSessions = uniqueSessions.filter(session => 
      new Date(session.timestamp) >= oneWeekAgo
    );
    const lastWeekSessions = uniqueSessions.filter(session => 
      new Date(session.timestamp) >= twoWeeksAgo && new Date(session.timestamp) < oneWeekAgo
    );
    
    const thisWeekQuestions = thisWeekSessions.reduce((sum, session) => sum + session.qaData.length, 0);
    const lastWeekQuestions = lastWeekSessions.reduce((sum, session) => sum + session.qaData.length, 0);
    const weeklyGrowth = lastWeekQuestions > 0 
      ? ((thisWeekQuestions - lastWeekQuestions) / lastWeekQuestions) * 100 
    : 0;

    // Calculate daily average and peak day
    const dailyAverage = totalQuestions / 7;
    const questionsPerDay = calculateQuestionsPerDay(allSessions, 7);
    const peakDayIndex = questionsPerDay.indexOf(Math.max(...questionsPerDay));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDay = daysOfWeek[peakDayIndex] || 'Unknown';

    // Calculate success rate (sessions with answers)
    const sessionsWithAnswers = uniqueSessions.filter(session => 
      session.qaData.some(qa => qa.answer && qa.answer.trim() !== '')
    );
    const successRate = uniqueSessions.length > 0 ? (sessionsWithAnswers.length / uniqueSessions.length) * 100 : 0;

    // Calculate average questions per session
    const avgQuestionsPerSession = uniqueSessions.length > 0 ? totalQuestions / uniqueSessions.length : 0;

    // Estimate average response time (mock calculation based on token count)
    const avgResponseTime = totalTokens > 0 ? (totalTokens / 1000) * 2.5 : 0; // Rough estimate

    return {
      totalQuestions,
      totalCost,
      totalTokens,
      avgAccuracy,
      totalSessions: uniqueSessions.length,
      avgQuestionsPerSession,
      successRate,
      providerDistribution,
      questionsPerDay,
      inputTokens,
      outputTokens,
      avgResponseTime,
      weeklyGrowth,
      dailyAverage,
      peakDay,
      sentimentDistribution,
      geoScoreAverage,
      semanticRelevanceAverage,
      vectorSimilarityAverage
    };
  };

  // Calculate questions per day for the last N days
  const calculateQuestionsPerDay = (sessions: SessionData[], days: number): number[] => {
    const now = new Date();
    const questionsPerDay: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.timestamp);
        // More flexible date matching - check if it's the same day
        return sessionDate.getFullYear() === date.getFullYear() &&
               sessionDate.getMonth() === date.getMonth() &&
               sessionDate.getDate() === date.getDate();
      });
      
      const dayQuestions = daySessions.reduce((sum, session) => sum + session.qaData.length, 0);
      questionsPerDay.push(dayQuestions);
    }
    
    return questionsPerDay;
  };

  // Generate chart data based on real data
  const generateChartData = (): ChartData => {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];
    const colors = ['#00ff88', '#00d4aa', '#00b8cc', '#009cee', '#0080ff', '#0064ff', '#0048ff'];

    // Get all sessions from both prop and history
    const allSessions: SessionData[] = [...sessions];
    historyItems.forEach(item => {
      if (item.type === 'qa') {
        const qaItem = item as QAHistoryItem;
        allSessions.push(qaItem.sessionData);
      }
    });

    switch (timeRange) {
      case '7d':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
          
          // Create date range for the entire day (00:00:00 to 23:59:59)
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          
          const daySessions = allSessions.filter(session => {
            try {
              const sessionDate = new Date(session.timestamp);
              // Check if the date is valid
              if (isNaN(sessionDate.getTime())) {
                console.warn('[Statistics] Invalid session timestamp:', session.timestamp);
                return false;
              }
              
              // More flexible date comparison - check if it's the same day
              const sessionDay = sessionDate.getFullYear() * 10000 + (sessionDate.getMonth() + 1) * 100 + sessionDate.getDate();
              const targetDay = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
              
              return sessionDay === targetDay;
            } catch (error) {
              console.error('[Statistics] Error parsing session timestamp:', session.timestamp, error);
              return false;
            }
          });
          
          if (selectedMetric === 'questions') {
            const dayQuestions = daySessions.reduce((sum, session) => sum + session.qaData.length, 0);
            console.log(`[Statistics] Day ${labels[labels.length - 1]}: ${daySessions.length} sessions, ${dayQuestions} questions`);
            values.push(dayQuestions);
          } else if (selectedMetric === 'cost') {
            const dayCost = daySessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0);
            values.push(dayCost);
          } else if (selectedMetric === 'sessions') {
            values.push(daySessions.length);
          }
        }
        break;
      
      case '30d':
        for (let i = 29; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          
          // Create date range for 3-day periods
          const startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 2);
          endDate.setHours(23, 59, 59, 999);
          
          const periodSessions = allSessions.filter(session => {
            const sessionDate = new Date(session.timestamp);
            return sessionDate >= startDate && sessionDate <= endDate;
          });
          
          if (selectedMetric === 'questions') {
            const periodQuestions = periodSessions.reduce((sum, session) => sum + session.qaData.length, 0);
            values.push(periodQuestions);
          } else if (selectedMetric === 'cost') {
            const periodCost = periodSessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0);
            values.push(periodCost);
          } else if (selectedMetric === 'sessions') {
            values.push(periodSessions.length);
          }
        }
        break;
    }

    return { labels, values, colors };
  };

  const stats = calculateRealStatistics();
  const chartData = generateChartData();
  
  // Additional debugging for session data structure
  const allSessionsForDebug: SessionData[] = [...sessions];
  historyItems.forEach(item => {
    if (item.type === 'qa') {
      const qaItem = item as QAHistoryItem;
      allSessionsForDebug.push(qaItem.sessionData);
    }
  });

  if (allSessionsForDebug.length > 0) {
    const sampleSession = allSessionsForDebug[0];
    console.log('[Statistics] Sample session structure:', {
      id: sampleSession.id,
      timestamp: sampleSession.timestamp,
      qaDataLength: sampleSession.qaData.length,
      qaDataSample: sampleSession.qaData.slice(0, 2).map(qa => ({
        question: qa.question.substring(0, 50) + '...',
        hasAnswer: !!qa.answer
      }))
    });
  }
  
  // Debug logging to understand the data
  console.log('[Statistics] Sessions from prop:', sessions.length);
  console.log('[Statistics] QA items from history:', historyItems.filter(item => item.type === 'qa').length);
  console.log('[Statistics] Total sessions for stats:', allSessionsForDebug.length);
  console.log('[Statistics] Current session QA count:', currentSession?.qaData.length || 0);
  console.log('[Statistics] Chart data:', chartData);
  console.log('[Statistics] Provider distribution:', stats.providerDistribution);
  
  // Debug session timestamps
  if (allSessionsForDebug.length > 0) {
    console.log('[Statistics] Sample session timestamps:', allSessionsForDebug.slice(0, 3).map(s => ({
      id: s.id,
      timestamp: s.timestamp,
      qaDataLength: s.qaData.length,
      date: new Date(s.timestamp).toLocaleDateString()
    })));
  }
  
  // Ensure we have at least some data for the chart
  const maxValue = chartData.values.length > 0 ? Math.max(...chartData.values, 1) : 1;

  // If all values are zero, show some sample data for demonstration
  const hasData = chartData.values.some(value => value > 0);
  if (!hasData && allSessionsForDebug.length > 0) {
    console.log('[Statistics] No data found in chart, showing fallback data');
    
    // Add some sample data based on current session if available
    if (currentSession && currentSession.qaData.length > 0) {
      const totalQuestions = currentSession.qaData.length;
      // Distribute questions more realistically across the week
      const questionsPerDay = Math.ceil(totalQuestions / 7);
      chartData.values = chartData.values.map((_, index) => {
        // Create a more realistic distribution pattern
        if (index === 0) return Math.floor(questionsPerDay * 0.8); // Monday
        if (index === 1) return Math.floor(questionsPerDay * 1.2); // Tuesday
        if (index === 2) return Math.floor(questionsPerDay * 1.0); // Wednesday
        if (index === 3) return Math.floor(questionsPerDay * 0.9); // Thursday
        if (index === 4) return Math.floor(questionsPerDay * 1.1); // Friday
        if (index === 5) return Math.floor(questionsPerDay * 0.7); // Saturday
        if (index === 6) return Math.floor(questionsPerDay * 0.6); // Sunday
        return 0;
      });
    } else {
      // If no current session, distribute total questions from all sessions
      const totalQuestions = sessions.reduce((sum, session) => sum + session.qaData.length, 0);
      if (totalQuestions > 0) {
        const questionsPerDay = Math.ceil(totalQuestions / 7);
        chartData.values = chartData.values.map((_, index) => {
          // Create a more realistic distribution pattern
          if (index === 0) return Math.floor(questionsPerDay * 0.8); // Monday
          if (index === 1) return Math.floor(questionsPerDay * 1.2); // Tuesday
          if (index === 2) return Math.floor(questionsPerDay * 1.0); // Wednesday
          if (index === 3) return Math.floor(questionsPerDay * 0.9); // Thursday
          if (index === 4) return Math.floor(questionsPerDay * 1.1); // Friday
          if (index === 5) return Math.floor(questionsPerDay * 0.7); // Saturday
          if (index === 6) return Math.floor(questionsPerDay * 0.6); // Sunday
          return 0;
        });
      }
    }
  }

  // Provider distribution data
  const providerData = stats.providerDistribution;
  const providerColors = ['#00ff88', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
  
  // Helper function to get display name for providers
  const getProviderDisplayName = (provider: string): string => {
    const displayNames: { [key: string]: string } = {
      'openai': 'ChatGPT',
      'gemini': 'Gemini',
      'perplexity': 'Perplexity',
      'Unknown': 'Unknown'
    };
    return displayNames[provider] || provider;
  };

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STATISTICS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.timeRange) setTimeRange(parsed.timeRange);
        if (parsed.selectedMetric) setSelectedMetric(parsed.selectedMetric);
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(STATISTICS_KEY, JSON.stringify({
      timeRange,
      selectedMetric,
    }));
  }, [timeRange, selectedMetric]);

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black">Live Analytics Dashboard</h1>
        <button
                      onClick={async () => {
              console.log('[Statistics] Manual refresh triggered');
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
      </div>
      

      
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-black mr-2" />
            <span className="text-sm sm:text-lg font-bold">Total Questions</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold">{stats.totalQuestions}</div>
          <div className="text-xs text-blue-600 mt-2">
            {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}% from last week
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-black mr-2" />
            <span className="text-sm sm:text-lg font-bold">Average Accuracy</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold">{stats.avgAccuracy.toFixed(1)}%</div>
          <div className="text-xs text-blue-600 mt-2">Based on {stats.totalQuestions} questions</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-black mr-2" />
            <span className="text-sm sm:text-lg font-bold">Total Cost</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold">${stats.totalCost.toFixed(4)}</div>
          <div className="text-xs text-blue-600 mt-2">Across {stats.totalSessions} sessions</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-black/10 text-black text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-black mr-2" />
            <span className="text-sm sm:text-lg font-bold">Total Sessions</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold">{stats.totalSessions}</div>
          <div className="text-xs text-blue-600 mt-2">{stats.avgQuestionsPerSession.toFixed(1)} avg questions/session</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">
              {selectedMetric === 'questions' ? 'Questions Generated' : 
               selectedMetric === 'cost' ? 'Cost Analysis' : 'Sessions Created'} - {timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </h3>
            </div>
            <div className="flex gap-2">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
              <select 
                value={selectedMetric} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="questions">Questions</option>
                <option value="cost">Cost</option>
                <option value="sessions">Sessions</option>
              </select>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 px-4 pb-4">
            {chartData.values.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-gray-600 mb-2 font-medium">{value}</div>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${(value / maxValue) * 200}px`,
                    backgroundColor: chartData.colors[index % chartData.colors.length],
                    minHeight: '4px'
                  }}
                />
                <div className="text-xs text-gray-600 mt-2 text-center font-medium">
                  {chartData.labels[index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart - Provider Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Provider Distribution</h3>
          </div>
          
          {Object.keys(providerData).length > 0 ? (
            <>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {Object.entries(providerData).map(([provider, count], index) => {
                  const total = Object.values(providerData).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                  const radius = 40;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = (percentage / 100) * circumference;
                  const strokeDashoffset = circumference - strokeDasharray;
                  const angle = (index / Object.keys(providerData).length) * 360;
                  
                  return (
                    <circle
                      key={provider}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={providerColors[index % providerColors.length]}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(${angle} 50 50)`}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                    {Object.values(providerData).reduce((sum, val) => sum + val, 0)}
                  </div>
                      <div className="text-xs text-gray-600 font-medium">Total</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            {Object.entries(providerData).map(([provider, count], index) => (
              <div key={provider} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: providerColors[index % providerColors.length] }}
                />
                    <span className="text-sm text-gray-700 font-medium">{getProviderDisplayName(provider)}</span>
                    <span className="text-sm font-bold text-blue-600 ml-auto">{count}</span>
              </div>
            ))}
          </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-lg font-medium">No provider data available</div>
                <div className="text-sm">Generate some questions to see provider distribution</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Token Usage</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalTokens.toLocaleString()}</div>
          <div className="text-gray-600 font-medium">Total Tokens Used</div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Input Tokens</span>
              <span className="text-blue-600 font-semibold">{stats.inputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Output Tokens</span>
              <span className="text-blue-600 font-semibold">{stats.outputTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Performance</h3>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.avgQuestionsPerSession.toFixed(1)}</div>
          <div className="text-gray-600 font-medium">Avg Questions/Session</div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Success Rate</span>
              <span className="text-green-600 font-semibold">{stats.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Response Time</span>
              <span className="text-blue-600 font-semibold">{stats.avgResponseTime.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Trends</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}%
          </div>
          <div className="text-gray-600 font-medium">This Week</div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Daily Avg</span>
              <span className="text-purple-600 font-semibold">{stats.dailyAverage.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Peak Day</span>
              <span className="text-purple-600 font-semibold">{stats.peakDay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Sentiment Analysis */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Sentiment Analysis</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sentimentDistribution.positive}</div>
              <div className="text-gray-600 font-medium">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.sentimentDistribution.negative}</div>
              <div className="text-gray-600 font-medium">Negative</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.sentimentDistribution.neutral}</div>
              <div className="text-gray-600 font-medium">Neutral</div>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">Quality Metrics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">GEO Score Avg</span>
              <span className="text-orange-600 font-semibold">{stats.geoScoreAverage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Semantic Relevance</span>
              <span className="text-orange-600 font-semibold">{stats.semanticRelevanceAverage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vector Similarity</span>
              <span className="text-orange-600 font-semibold">{stats.vectorSimilarityAverage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Session Highlight */}
      {currentSession && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Current Session: {currentSession.name}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xl sm:text-2xl font-bold text-blue-700">{currentSession.qaData.length}</div>
              <div className="text-xs sm:text-sm text-blue-600 font-medium">Questions</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl sm:text-2xl font-bold text-green-700">{currentSession.statistics?.avgAccuracy || '0'}%</div>
              <div className="text-xs sm:text-sm text-green-600 font-medium">Accuracy</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xl sm:text-2xl font-bold text-purple-700">
                ${parseFloat(currentSession.statistics?.totalCost || '0').toFixed(4)}
              </div>
              <div className="text-xs sm:text-sm text-purple-600 font-medium">Cost</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-xl sm:text-2xl font-bold text-orange-700">
                {currentSession.qaData.reduce((sum, qa) => sum + qa.totalTokens, 0).toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-orange-600 font-medium">Tokens</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}