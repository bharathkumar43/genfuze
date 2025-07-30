import { useState, useEffect } from 'react';
import { User, BarChart3, FileText, History as HistoryIcon, DollarSign, Zap, Menu, X, Target, Globe, Plus, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { ContentInput } from './components/ContentInput';
import { historyService } from './services/historyService';
import { Statistics } from './components/Statistics';
import Login from './components/Login';
import { useLocalStorage } from './hooks/useLocalStorage';
import { downloadFile } from './utils/fileUtils';
import type { QAItem, SessionData, User as UserType } from './types';
import type { UrlData } from './components/ContentInput';
import { useAuth } from './contexts/AuthContext';
import { calculateCost } from './utils/pricing';
import { History } from './components/History';
import { Configuration } from './components/Configuration';
import { apiService } from './services/apiService';

// Utility function to hash content for cache keys
const hashContent = (content: string): string => {
  let hash = 0;
  if (content.length === 0) return hash.toString();
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
};
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Overview } from './components/Overview.tsx';
import { CompetitorBenchmarking } from './components/CompetitorBenchmarking';

// import SmartCompetitorAnalysis from './components/SmartCompetitorAnalysis';
import { ContentStructureAnalysisRoute } from './components/ContentStructureAnalysisRoute';
import { ContentStructureLanding } from './components/ContentStructureLanding';
import AIVIsibilityAnalysis from './components/AIVIsibilityAnalysis';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import NotificationTest from './components/ui/NotificationTest';

const SESSIONS_KEY = 'llm_qa_sessions';
const CURRENT_SESSION_KEY = 'llm_qa_current_session';
const COMPETITOR_URLS_KEY = 'llm_competitor_urls';
const QA_WORK_KEY = 'llm_qa_current_work';
const ENHANCE_CONTENT_KEY = 'enhance_content_state';
const ENHANCE_CONTENT_CACHE_KEY = 'enhance_content_cache_';

const NAV_ITEMS = [
  { label: 'Overview', icon: <Zap />, path: '/overview' },
  { label: 'Enhance Content', icon: <FileText />, path: '/enhance-content' },
  { label: 'Content Analysis', icon: <BarChart3 />, path: '/content-analysis' },
  { label: 'Structure Analysis', icon: <Target />, path: '/content-structure-analysis' },
  // { label: 'Smart Competitor Analysis', icon: <BarChart3 />, path: '/smart-competitor-analysis' },
  { label: 'AI Visibility Analysis', icon: <BarChart3 />, path: '/ai-visibility-analysis' },
  { label: 'History', icon: <HistoryIcon />, path: '/history' },
  { label: 'Statistics', icon: <BarChart3 />, path: '/statistics' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  user: UserType | null;
  currentPath: string;
}

function Sidebar({ isOpen, setIsOpen, onLogout, user, currentPath }: SidebarProps) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 bg-white w-64 min-h-screen flex flex-col border-r border-gray-200 shadow-lg transform transition-transform duration-300 md:transform-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-primary/10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-primary tracking-wide truncate">Genfuze.ai</span>
          </div>
          <button 
            className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors p-1.5 rounded-md flex items-center justify-center flex-shrink-0 ml-2" 
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            {/* Professional X icon */}
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="absolute w-4 h-0.5 bg-gray-600 rounded-full transform rotate-45"></div>
              <div className="absolute w-4 h-0.5 bg-gray-600 rounded-full transform -rotate-45"></div>
            </div>
          </button>
        </div>
        
        <nav className="flex-1 flex flex-col gap-1 mt-6 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.path;
            const isBlueBg = isActive;
            return (
              <button
                key={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-left ${
                  isBlueBg
                    ? 'bg-primary text-white border-l-4 border-primary shadow'
                    : 'bg-white text-black hover:bg-primary/10 hover:text-primary'
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className={`w-5 h-5 ${isBlueBg ? 'text-white' : 'text-primary'}`}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto px-4 py-4 border-t border-primary/10">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 w-full mb-4">
            <User className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate">
                {user?.displayName || user?.name || 'User'}
              </div>
              <div className="text-xs text-primary truncate">
                {user?.email || ''}
              </div>
            </div>
          </div>
          
          {/* Logout Button - Clearly Separated */}
          <div className="border-t border-gray-200 pt-4">
            <button 
              className="w-full bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200 hover:border-blue-300" 
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ setIsOpen, onLogout }: { setIsOpen: (open: boolean) => void; onLogout: () => void }) {
  return (
    <header className="w-full bg-white border-b border-primary/10 flex items-center justify-between px-4 sm:px-8 py-4 relative z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-extrabold text-primary tracking-wide">Genfuze.ai</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Logout button for mobile */}
        <button 
          className="md:hidden bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-2" 
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
        {/* Menu button for mobile */}
        <button 
          className="block md:hidden text-primary hover:text-accent transition-colors p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center border border-gray-200 bg-white" 
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          {/* Hamburger menu icon - always visible with explicit styling */}
          <div className="relative w-6 h-6">
            <div className="absolute w-5 h-1 bg-blue-600 rounded-full top-1 left-0.5"></div>
            <div className="absolute w-5 h-1 bg-blue-600 rounded-full top-3 left-0.5"></div>
            <div className="absolute w-5 h-1 bg-blue-600 rounded-full top-5 left-0.5"></div>
          </div>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-white border-t border-primary/10 text-center text-primary py-4 text-sm">
      © {new Date().getFullYear()} Genfuze.ai. All rights reserved.
    </footer>
  );
}

function QAGenerationPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession, setCurrentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [qaContent, setQaContent] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Question Generation State
  const [questionProvider, setQuestionProvider] = useState('gemini');
  const [questionModel, setQuestionModel] = useState('gemini-1.5-flash');
  
  // Answer Generation State
  const [answerProvider, setAnswerProvider] = useState('gemini');
  const [answerModel, setAnswerModel] = useState('gemini-1.5-flash');
  
  const [answerLoading, setAnswerLoading] = useState<{ [idx: number]: boolean }>({});
  const [urls, setUrls] = useState<UrlData[]>([]);

  // Content input state (moved from ContentInput component)
  const [content, setContent] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    estimatedCost: 0,
    confidenceScore: 0,
    contentLength: 0
  });
  const [showAnalysisNotification, setShowAnalysisNotification] = useState(false);
  
  // State for tracking user activity and component lifecycle
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [isComponentActive, setIsComponentActive] = useState(true);

  // Restore state from localStorage on mount
  useEffect(() => {
    // Try to restore from the most recent cache entry
    const keys = Object.keys(localStorage).filter(key => key.startsWith(ENHANCE_CONTENT_CACHE_KEY));
    if (keys.length > 0) {
      // Find the most recently accessed cache entry
      let mostRecentKey = keys[0];
      let mostRecentTime = 0;
      
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.lastAccessed && data.lastAccessed > mostRecentTime) {
            mostRecentTime = data.lastAccessed;
            mostRecentKey = key;
          }
      } catch {}
      });
      
      try {
        const saved = localStorage.getItem(mostRecentKey);
        if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.qaItems) setQaItems(parsed.qaItems);
        if (parsed.qaContent) setQaContent(parsed.qaContent);
          if (parsed.content) setContent(parsed.content);
          if (parsed.newUrl) setNewUrl(parsed.newUrl);
        if (parsed.selectedQuestions) setSelectedQuestions(parsed.selectedQuestions);
        if (parsed.questionCount) setQuestionCount(parsed.questionCount);
        if (typeof parsed.isProcessing === 'boolean') setIsProcessing(parsed.isProcessing);
          if (parsed.questionProvider) setQuestionProvider(parsed.questionProvider);
          if (parsed.questionModel) setQuestionModel(parsed.questionModel);
          if (parsed.answerProvider) setAnswerProvider(parsed.answerProvider);
          if (parsed.answerModel) setAnswerModel(parsed.answerModel);
        if (parsed.answerLoading) setAnswerLoading(parsed.answerLoading);
        if (parsed.urls) {
          // Reset any URLs that were in extracting/crawling state
          const resetUrls = parsed.urls.map(url => ({
            ...url,
            status: url.status === 'extracting' ? 'pending' : url.status
          }));
          setUrls(resetUrls);
        }
          if (parsed.metrics) setMetrics(parsed.metrics);
          if (parsed.extracting) setExtracting(parsed.extracting);
          // Don't restore crawling state - always start fresh
          // if (parsed.crawling) setCrawling(parsed.crawling);
          if (parsed.showAnalysisNotification) setShowAnalysisNotification(parsed.showAnalysisNotification);
          
          // Update the lastAccessed timestamp
          setTimeout(() => {
            const updatedData = { ...parsed, lastAccessed: Date.now() };
            localStorage.setItem(mostRecentKey, JSON.stringify(updatedData));
          }, 100);
        }
      } catch (error) {
        console.error('Error restoring enhance content state:', error);
      }
    }
  }, []);

  // Ensure crawling state is always false on mount
  useEffect(() => {
    setCrawling(false);
    setExtracting(false);
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (content.trim() || urls.length > 0 || qaItems.length > 0) {
      const contentHash = hashContent(content + urls.map(u => u.url).join(''));
      const cacheKey = ENHANCE_CONTENT_CACHE_KEY + contentHash;
      
    const state = {
      qaItems,
      qaContent,
        content,
        newUrl,
      selectedQuestions,
      questionCount,
      isProcessing,
        questionProvider,
        questionModel,
        answerProvider,
        answerModel,
      answerLoading,
        urls,
        metrics,
        extracting,
        crawling,
        showAnalysisNotification,
        lastAccessed: Date.now(),
        createdAt: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(state));
    }
  }, [qaItems, qaContent, content, newUrl, selectedQuestions, questionCount, isProcessing, questionProvider, questionModel, answerProvider, answerModel, answerLoading, urls, metrics, extracting, crawling, showAnalysisNotification]);

  // Defensive: Ensure sessions is always an array
  useEffect(() => {
    if (!Array.isArray(sessions)) {
      setSessions([]);
    }
  }, [sessions, setSessions]);

  // Auto-recalculate metrics for existing data if needed
  useEffect(() => {
    if (qaItems.length > 0 && qaContent && qaItems.some(item => item.answer && (!item.sentiment || item.sentiment === '' || item.geoScore === 0))) {
      console.log('[Metrics] Auto-recalculating metrics for existing data...');
      recalculateMetricsForExistingData();
    }
  }, [qaItems.length, qaContent]); // Only run when qaItems or qaContent changes



  // Initialize default session if none exists
  useEffect(() => {
    if (sessions.length === 0 && user) {
      const defaultSession: SessionData = {
        id: 'default',
        name: 'Default Session',
        type: 'question',
        timestamp: new Date().toISOString(),
        model: 'gemini-pro',
        blogContent: '',
        qaData: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        statistics: {
          totalQuestions: 0,
          avgAccuracy: '0',
          avgCitationLikelihood: '0',
          totalCost: '0'
        },
        userId: user.id
      };
      setSessions([defaultSession]);
      setCurrentSession(defaultSession);
    }
  }, [sessions, setSessions, setCurrentSession, user]);

  // Store competitor URLs in localStorage whenever they change
  useEffect(() => {
    const urlList = urls.map(u => u.url);
    localStorage.setItem(COMPETITOR_URLS_KEY, JSON.stringify(urlList));
  }, [urls]);

  // User activity tracking
  useEffect(() => {
    const handleUserActivity = () => {
      setLastUserActivity(Date.now());
      setIsComponentActive(true);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, []);

  // URL management functions (moved from ContentInput)
  const addUrl = () => {
    console.log('[Add URL] Function called with:', newUrl);
    if (newUrl.trim() && !urls.find(u => u.url === newUrl.trim())) {
      const newUrlData: UrlData = { url: newUrl.trim(), content: '', status: 'pending' };
      console.log('[Add URL] Adding URL to list:', newUrlData);
      setUrls([...urls, newUrlData]);
      setNewUrl('');
    } else {
      console.log('[Add URL] URL already exists or is empty');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const extractContentFromUrl = async (urlData: UrlData, index: number) => {
    const updatedUrls = [...urls];
    updatedUrls[index] = { ...urlData, status: 'extracting' };
    setUrls(updatedUrls);

    try {
      const result = await apiService.extractContentFromUrl(urlData.url);
      const extractedContent = result.content || '';
      
      // Calculate metrics for this URL
      const tokens = extractedContent.length / 4; // Rough estimate
      const cost = tokens * 0.0001; // Rough cost estimate
      const confidence = Math.random() * 0.3 + 0.7; // Mock confidence score
      
      updatedUrls[index] = {
        ...urlData,
        content: extractedContent,
        status: 'success',
        tokens,
        cost,
        confidence
      };
      setUrls(updatedUrls);
      
      // Update overall content
      const allContent = updatedUrls.map(u => u.content).join('\n\n') + '\n\n' + content;
      setContent(allContent);
      
      // Update metrics
      updateMetrics(allContent);
      
    } catch (err: any) {
      updatedUrls[index] = {
        ...urlData,
        status: 'error',
        error: err.message || 'Failed to extract content'
      };
      setUrls(updatedUrls);
    }
  };

  const crawlWebsite = async (urlData: UrlData, index: number) => {
    console.log('[Crawl Website] Function called for:', urlData.url, 'at index:', index);
    console.log('[Crawl Website] Call stack:', new Error().stack);
    
    const updatedUrls = [...urls];
    updatedUrls[index] = { ...urlData, status: 'extracting' };
    setUrls(updatedUrls);
    setCrawling(true);

    try {
      console.log(`🕷️ Starting website crawl for: ${urlData.url}`);
      const result = await apiService.crawlWebsite(urlData.url, {
        maxPages: 50,
        maxDepth: 3,
        timeout: 30000
      });
      
      if (result.success && result.result) {
        const crawledContent = result.result.content || '';
        
        // Calculate metrics for crawled content
        const tokens = crawledContent.length / 4; // Rough estimate
        const cost = tokens * 0.0001; // Rough cost estimate
        const confidence = Math.random() * 0.3 + 0.7; // Mock confidence score
        
        updatedUrls[index] = {
          ...urlData,
          content: crawledContent,
          status: 'success',
          tokens,
          cost,
          confidence
        };
        setUrls(updatedUrls);
        
        // Update overall content
        const allContent = updatedUrls.map(u => u.content).join('\n\n') + '\n\n' + content;
        setContent(allContent);
        
        // Update metrics
        updateMetrics(allContent);
        
        console.log(`✅ Website crawl completed! Found ${result.result.totalPages} pages with ${crawledContent.length} characters`);
      } else {
        throw new Error('Crawl failed');
      }
      
    } catch (err: any) {
      console.error('❌ Website crawl error:', err);
      updatedUrls[index] = {
        ...urlData,
        status: 'error',
        error: err.message || 'Failed to crawl website'
      };
      setUrls(updatedUrls);
    } finally {
      setCrawling(false);
    }
  };

  const updateMetrics = (text: string) => {
    const tokens = text.length / 4;
    const cost = tokens * 0.0001;
    const confidence = Math.random() * 0.2 + 0.8;
    
    setMetrics({
      totalTokens: Math.round(tokens),
      estimatedCost: parseFloat(cost.toFixed(4)),
      confidenceScore: parseFloat((confidence * 100).toFixed(1)),
      contentLength: text.length
    });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateMetrics(newContent);
  };

  const handleNewAnalysis = () => {
    // Clear all cached data
    const keys = Object.keys(localStorage).filter(key => key.startsWith(ENHANCE_CONTENT_CACHE_KEY));
    keys.forEach(key => localStorage.removeItem(key));
    
    // Reset all state
    setQaItems([]);
    setQaContent('');
    setContent('');
    setNewUrl('');
    setSelectedQuestions([]);
    setUrls([]);
    setMetrics({
      totalTokens: 0,
      estimatedCost: 0,
      confidenceScore: 0,
      contentLength: 0
    });
    setExtracting(false);
    setShowAnalysisNotification(false);
    setIsProcessing(false);
    setAnswerLoading({});
  };

  const handleGenerateQA = async (items: QAItem[], content: string) => {
    // Calculate vector similarities for all questions
    const { calculateAndUpdateVectorSimilarities } = await import('./utils/vectorSimilarity');
    const itemsWithVectorSimilarity = await calculateAndUpdateVectorSimilarities(items, content);
    
    setQaItems(prev => [...prev, ...itemsWithVectorSimilarity]);
    setQaContent(content);
    
    // Always save to history, regardless of session state
    const totalInputTokens = items.reduce((sum, item) => sum + item.inputTokens, 0);
    const totalOutputTokens = items.reduce((sum, item) => sum + item.outputTokens, 0);
    const totalCost = calculateCost(totalInputTokens, totalOutputTokens, 'gemini-pro');
    
    const sessionData = {
      id: `qa-session-${Date.now()}`,
      name: `Q&A Generation - ${new Date().toLocaleDateString()}`,
      type: 'question' as const,
      timestamp: new Date().toISOString(),
      model: 'gemini-pro',
      blogContent: content,
      qaData: itemsWithVectorSimilarity,
      totalInputTokens,
      totalOutputTokens,
      statistics: {
        totalQuestions: items.length,
        avgAccuracy: '85',
        avgCitationLikelihood: '75',
        totalCost: totalCost.toString()
      },
      userId: user?.id || 'anonymous'
    };
    
    // Save to history
    console.log('[App] Saving QA session to history:', sessionData);
    historyService.addQAHistory(sessionData);
    
    // Show success message
    alert(`✅ Q&A session saved to history! You can view and download it from the History page.`);
    
    // Update session if exists
    if (currentSession && user) {
      const updatedSession = {
        ...currentSession,
        qaData: [...currentSession.qaData, ...itemsWithVectorSimilarity],
        statistics: {
          totalQuestions: currentSession.qaData.length + items.length,
          avgAccuracy: '85',
          avgCitationLikelihood: '75',
          totalCost: totalCost.toString()
        },
        userId: user.id
      };
      console.log('[App] Updating session with new QA data:', updatedSession);
      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    }
  };

  const handleGenerateAnswer = async (idx: number) => {
    setAnswerLoading((prev) => ({ ...prev, [idx]: true }));
    try {
      const item = qaItems[idx];
      const provider = answerProvider;
      const model = answerModel === 'gemini-pro' ? 'gemini-1.5-flash' : answerModel;
      const result = await apiService.generateAnswers({
        content: qaContent,
        questions: [item.question],
        provider,
        model
      });
      const answerObj = result.answers[0] || {};
      // Calculate metrics in parallel
      const [citation, accuracy] = await Promise.all([
        apiService.calculateCitationLikelihood({ answer: answerObj.answer, content: qaContent, provider, model }),
        apiService.calculateAccuracy({ answer: answerObj.answer, content: qaContent, provider, model })
      ]);
      
      // Calculate sentiment analysis
      const { analyzeSentiment } = await import('./utils/analysis');
      const sentiment = analyzeSentiment(answerObj.answer || '');
      
      // Calculate GEO score
      const { calculateGeoScoreV2 } = await import('./utils/analysis');
      const geoScoreResult = await calculateGeoScoreV2({
        accuracy: parseFloat(accuracy.accuracy) || 0,
        question: item.question,
        answer: answerObj.answer || '',
        importantQuestions: qaItems.map(qa => qa.question),
        allConfidences: qaItems.map(() => 85), // Default confidence
        sourceUrl: '', // Will be empty for now
        content: qaContent
      });
      
      // Calculate semantic relevance
      const semanticRelevance = Math.round((parseFloat(accuracy.accuracy) || 0) * 0.8 + (geoScoreResult.geoScore || 0) * 0.2);
      
      // Calculate vector similarity
      const { calculateAndUpdateVectorSimilarities } = await import('./utils/vectorSimilarity');
      const updatedQaData = await calculateAndUpdateVectorSimilarities([{
        question: item.question,
        answer: answerObj.answer || '',
        accuracy: null,
        sentiment: '',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        geoScore: 0,
        citationLikelihood: null
      }], qaContent);
      
      const vectorSimilarity = updatedQaData[0]?.vectorSimilarity || null;
      setQaItems(prev => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          answer: answerObj.answer || '',
          inputTokens: answerObj.inputTokens || 0,
          outputTokens: answerObj.outputTokens || 0,
          totalTokens: (answerObj.inputTokens || 0) + (answerObj.outputTokens || 0),
          cost: calculateCost(answerObj.inputTokens || 0, answerObj.outputTokens || 0, model),
          citationLikelihood: citation.citationLikelihood,
          accuracy: accuracy.accuracy,
          sentiment: sentiment,
          geoScore: geoScoreResult.geoScore,
          semanticRelevance: semanticRelevance.toString(),
          vectorSimilarity: vectorSimilarity,
          provider: answerProvider,
          model: answerModel
        };
        // Persist to session and sessions
        if (currentSession && user) {
          const updatedSession = {
            ...currentSession,
            qaData: updated,
            statistics: {
              ...currentSession.statistics,
              totalQuestions: updated.length,
              totalCost: updated.reduce((sum, item) => sum + (item.cost || 0), 0).toString()
            },
            userId: user.id
          };
          console.log('[App] Updating session with answer data:', updatedSession);
          setCurrentSession(updatedSession);
          setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
        }
        return updated;
      });
    } catch (error) {
      console.error('Error generating answer:', error);
    } finally {
      setAnswerLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleSelectQuestion = (idx: number) => {
    setSelectedQuestions(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestions(qaItems.map((_, idx) => idx));
  };

  const handleDeselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleGenerateAnswersForSelected = async () => {
    for (const idx of selectedQuestions) {
      await handleGenerateAnswer(idx);
    }
  };

  const getTotalCost = () => {
    return qaItems.reduce((sum, item) => sum + (item.cost || 0), 0);
  };

  // Function to recalculate metrics for existing QA items
  const recalculateMetricsForExistingData = async () => {
    console.log('[Metrics] Recalculating metrics for existing QA items...');
    
    const updatedQaItems = await Promise.all(
      qaItems.map(async (item, idx) => {
        // Skip if no answer exists
        if (!item.answer) {
          return item;
        }

        try {
          const provider = answerProvider;
          const model = answerModel === 'gemini-pro' ? 'gemini-1.5-flash' : answerModel;
          
          // Calculate metrics in parallel
          const [citation, accuracy] = await Promise.all([
            apiService.calculateCitationLikelihood({ answer: item.answer, content: qaContent, provider, model }),
            apiService.calculateAccuracy({ answer: item.answer, content: qaContent, provider, model })
          ]);
          
          // Calculate sentiment analysis
          const { analyzeSentiment } = await import('./utils/analysis');
          const sentiment = analyzeSentiment(item.answer || '');
          
          // Calculate GEO score
          const { calculateGeoScoreV2 } = await import('./utils/analysis');
          const geoScoreResult = await calculateGeoScoreV2({
            accuracy: parseFloat(accuracy.accuracy) || 0,
            question: item.question,
            answer: item.answer || '',
            importantQuestions: qaItems.map(qa => qa.question),
            allConfidences: qaItems.map(() => 85), // Default confidence
            sourceUrl: '', // Will be empty for now
            content: qaContent
          });
          
          // Calculate semantic relevance
          const semanticRelevance = Math.round((parseFloat(accuracy.accuracy) || 0) * 0.8 + (geoScoreResult.geoScore || 0) * 0.2);
          
          // Calculate vector similarity
          const { calculateAndUpdateVectorSimilarities } = await import('./utils/vectorSimilarity');
          const updatedQaData = await calculateAndUpdateVectorSimilarities([{
            question: item.question,
            answer: item.answer || '',
            accuracy: null,
            sentiment: '',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            geoScore: 0,
            citationLikelihood: null
          }], qaContent);
          
          const vectorSimilarity = updatedQaData[0]?.vectorSimilarity || null;
          
          return {
            ...item,
            citationLikelihood: citation.citationLikelihood,
            accuracy: accuracy.accuracy,
            sentiment: sentiment,
            geoScore: geoScoreResult.geoScore,
            semanticRelevance: semanticRelevance.toString(),
            vectorSimilarity: vectorSimilarity
          };
        } catch (error) {
          console.error(`[Metrics] Error recalculating metrics for item ${idx}:`, error);
          return item;
        }
      })
    );
    
    setQaItems(updatedQaItems);
    
    // Update session data
    if (currentSession && user) {
      const updatedSession = {
        ...currentSession,
        qaData: updatedQaItems,
        statistics: {
          ...currentSession.statistics,
          totalQuestions: updatedQaItems.length,
          totalCost: updatedQaItems.reduce((sum, item) => sum + (item.cost || 0), 0).toString()
        },
        userId: user.id
      };
      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    }
    
    console.log('[Metrics] Metrics recalculation completed');
  };

  return (
    <div className="space-y-8">
      <Configuration 
        questionProvider={questionProvider}
        questionModel={questionModel}
        onQuestionProviderChange={setQuestionProvider}
        onQuestionModelChange={setQuestionModel}
        answerProvider={answerProvider}
        answerModel={answerModel}
        onAnswerProviderChange={setAnswerProvider}
        onAnswerModelChange={setAnswerModel}
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
      />
      {/* Content Input Section */}
      <div className="card bg-white border border-primary/10 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-8 h-8 text-black drop-shadow" />
          <h2 className="text-3xl font-extrabold text-black tracking-tight">Content Input</h2>
        </div>
        
        <div className="space-y-8">
          {/* Multi-URL Input Section */}
          <div>
            <label className="block text-base font-semibold text-black mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-black" />
              Add URLs to crawl (multiple URLs supported)
            </label>
            <div className="space-y-3">
              {/* URL Input with Immediate Action Buttons */}
              <div className="flex gap-2">
                <input
                  key="url-input-fixed"
                  type="url"
                  value={newUrl}
                  onChange={e => {
                    console.log('[URL Input] Value changed:', e.target.value);
                    setNewUrl(e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      console.log('[URL Input] Enter pressed - preventing default');
                    }
                  }}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-white border border-black/20 rounded-lg px-4 py-3 text-black text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
                <button
                  onClick={addUrl}
                  disabled={!newUrl.trim()}
                  className="bg-black text-white font-bold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-base shadow"
                >
                  <Plus className="w-5 h-5 text-white" />
                  Add
                </button>
              </div>
              
              {/* Removed automatic action buttons - now only Add button works */}
            </div>
            
            {/* URL List */}
            {urls.length > 0 && (
              <div className="space-y-2 mb-4">
                {urls.map((urlData, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg border border-black/10">
                    <div className="flex-1 min-w-0">
                      <div className="text-base text-black font-medium truncate">{urlData.url}</div>
                      {urlData.status === 'error' && (
                        <div className="text-xs text-red-600 mt-1">{urlData.error}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Force show both buttons always unless extracting */}
                      {urlData.status !== 'extracting' && (
                        <>
                          <button
                            onClick={() => extractContentFromUrl(urlData, index)}
                            className="bg-black text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Extract
                          </button>
                          <button
                            onClick={() => crawlWebsite(urlData, index)}
                            disabled={crawling}
                            className="bg-red-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2 border-2 border-red-800 transform hover:scale-105"
                          >
                            {crawling ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Crawling...
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4" />
                                CRAWL WEBSITE
                              </>
                            )}
                          </button>
                        </>
                      )}
                      
                      {/* Show loading spinner during extraction */}
                      {urlData.status === 'extracting' && (
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                      )}
                      
                      {/* Show success indicator */}
                      {urlData.status === 'success' && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                      
                      {/* Show error indicator */}
                      {urlData.status === 'error' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      
                      <button
                        onClick={() => removeUrl(index)}
                        className="text-red-600 hover:text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5 text-black" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-base font-semibold text-black mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-black" />
              Or paste your content directly
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Paste your content here or extract from URLs above..."
              rows={8}
              className="w-full bg-white border border-black/20 rounded-lg px-4 py-3 text-black text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Metrics */}
          {metrics.contentLength > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-black">{metrics.totalTokens}</div>
                <div className="text-xs text-gray-600">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-black">${metrics.estimatedCost}</div>
                <div className="text-xs text-gray-600">Estimated Cost</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-black">{metrics.confidenceScore}%</div>
                <div className="text-xs text-gray-600">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-black">{metrics.contentLength}</div>
                <div className="text-xs text-gray-600">Characters</div>
              </div>
            </div>
          )}

          {/* Generate Questions Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                if (!content.trim()) {
                  alert('Please enter some content first');
                  return;
                }
                setIsProcessing(true);
                try {
                  const result = await apiService.generateQuestions({ 
                    content, 
                    questionCount, 
                    provider: questionProvider, 
                    model: questionModel === 'gemini-pro' ? 'gemini-1.5-flash' : questionModel 
                  });
                  const qaItems: QAItem[] = result.questions.map((q: string) => ({
                    question: q,
                    answer: '',
                    accuracy: '',
                    sentiment: '',
                    inputTokens: result.inputTokens || 0,
                    outputTokens: result.outputTokens || 0,
                    totalTokens: (result.inputTokens || 0) + (result.outputTokens || 0),
                    cost: 0,
                    geoScore: 0,
                    citationLikelihood: 0,
                    provider: questionProvider,
                    model: questionModel
                  }));
                  await handleGenerateQA(qaItems, content);
                } catch (err: any) {
                  alert('Failed to generate questions: ' + (err.message || err));
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing || !content.trim()}
              className="bg-black text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg shadow"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate Questions
                </>
              )}
            </button>
            
            {/* New Analysis Button */}
            {(content.trim() || urls.length > 0 || qaItems.length > 0) && (
              <button
                onClick={handleNewAnalysis}
                className="bg-gray-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2 text-lg shadow"
              >
                <X className="w-5 h-5" />
                New Analysis
              </button>
            )}
            
            {/* Recalculate Metrics Button */}
            {qaItems.length > 0 && qaItems.some(item => item.answer && (!item.sentiment || item.sentiment === '' || item.geoScore === 0)) && (
              <button
                onClick={recalculateMetricsForExistingData}
                className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center gap-2 text-lg shadow"
              >
                <RefreshCw className="w-5 h-5" />
                Recalculate Metrics
              </button>
            )}
            
            {/* View in History Button */}
            {qaItems.length > 0 && (
              <button
                onClick={() => window.location.href = '/history'}
                className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 text-lg shadow"
              >
                <HistoryIcon className="w-5 h-5" />
                View in History
              </button>
            )}
          </div>
        </div>
      </div>
      {qaItems.length > 0 && (
        <div className="card mt-8 p-6 bg-white border border-black/10 shadow-xl">
          <h3 className="text-xl font-bold text-black mb-4">Generated Questions & Answers</h3>
          <div className="flex items-center gap-4 mb-4">
            <button
              className="bg-gray-800 text-white font-bold px-5 py-2 rounded-lg hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerateAnswersForSelected}
              disabled={selectedQuestions.length === 0}
            >
              Generate Responses for Selected
            </button>
            <button
              className="bg-gray-800 text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-900 transition-all duration-200"
              onClick={handleSelectAll}
            >Select All</button>
            <button
              className="bg-gray-800 text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-900 transition-all duration-200"
              onClick={handleDeselectAll}
            >Deselect All</button>
          </div>
          <ul className="space-y-6">
            {qaItems.map((item, idx) => (
              <li key={idx} className="p-4 rounded-lg bg-white border border-black/10">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(idx)}
                    onChange={() => handleSelectQuestion(idx)}
                    className="mr-2 accent-blue-700"
                  />
                  <div className="font-semibold text-black">Q{idx + 1}: {item.question}</div>
                </div>
                {item.answer ? (
                  <div className="text-black mb-2"><span className="font-bold text-blue-700">A:</span> {item.answer}</div>
                ) : (
                  <button
                    className="bg-gray-800 text-white font-bold px-5 py-2 rounded-lg hover:bg-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleGenerateAnswer(idx)}
                    disabled={answerLoading[idx]}
                  >
                    {answerLoading[idx] ? 'Generating Answer...' : 'Generate Response'}
                  </button>
                )}
                <div className="text-xs text-black mt-2 flex gap-4 flex-wrap">
                  <span>Input Tokens: {item.inputTokens || 0}</span>
                  <span>Output Tokens: {item.outputTokens || 0}</span>
                  <span>Cost: ${item.cost || 0}</span>
                  <span>Vector Similarity: {item.vectorSimilarity ?? '-'}</span>
                  <span>Citation Likelihood: {item.citationLikelihood ?? '-'}</span>
                  <span>Accuracy: {item.accuracy ?? '-'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CostBreakdownPage() {
  const [sessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);

  const getTotalCost = () => {
    return sessions.reduce((sum, session) => {
      return sum + parseFloat(session.statistics?.totalCost || '0');
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-primary">Cost Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-primary/20">
            <div className="text-3xl font-bold text-primary mb-2">
              ${getTotalCost().toFixed(2)}
            </div>
            <div className="text-gray-300">Total Cost</div>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-primary/20">
            <div className="text-3xl font-bold text-primary mb-2">
              {currentSession?.qaData?.length || 0}
            </div>
            <div className="text-gray-300">Questions Generated</div>
          </div>
          <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-primary/20">
            <div className="text-3xl font-bold text-primary mb-2">
              ${((currentSession?.qaData?.length || 0) * 0.01).toFixed(2)}
            </div>
            <div className="text-gray-300">Estimated Monthly</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  
  console.log('[App] Authentication state:', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    userEmail: user?.email
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [sessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);

  // Get competitor domains from COMPETITOR_URLS_KEY
  let competitorDomains: string[] = [];
  try {
    const urlList = JSON.parse(localStorage.getItem(COMPETITOR_URLS_KEY) || '[]') as string[];
    competitorDomains = Array.from(new Set(urlList.map((url: string) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return url;
      }
    }))).filter(Boolean);
  } catch {}

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-primary font-medium">Loading Genfuze.ai...</p>
        </div>
      </div>
    );
  }

  // Allow unauthenticated users to access /signup
  if (!isAuthenticated) {
    console.log('[App] User not authenticated, showing login page');
    return (
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/test-notifications" element={<NotificationTest />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  
  console.log('[App] User is authenticated, showing main app');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-white overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onLogout={handleLogout} 
        user={user} // Pass the logged-in user
        currentPath={location.pathname}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar setIsOpen={setSidebarOpen} onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto text-black bg-white">
          <Routes>
            <Route path="/overview" element={<Overview />} />
            <Route path="/qa-generation" element={<QAGenerationPage />} />
            <Route path="/enhance-content" element={<QAGenerationPage />} />
            <Route path="/content-analysis" element={<CompetitorBenchmarking competitorDomains={competitorDomains} />} />
    
            {/* <Route path="/smart-competitor-analysis" element={<SmartCompetitorAnalysis />} /> */}
            <Route path="/ai-visibility-analysis" element={<AIVIsibilityAnalysis />} />
            <Route path="/content-structure-analysis" element={<ContentStructureAnalysisRoute />} />
            <Route path="/content-structure-landing" element={<ContentStructureLanding />} />
            <Route path="/history" element={<History qaItems={sessions.flatMap(s => s.qaData)} onExport={downloadFile} />} />
            <Route path="/statistics" element={<Statistics sessions={sessions} currentSession={currentSession} />} />
            <Route path="/CloudFuzeLLMQA" element={<Navigate to="/overview" replace />} />
            <Route path="/" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;