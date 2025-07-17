import { useState, useEffect } from 'react';
import { User, BarChart3, FileText, History as HistoryIcon, DollarSign, Zap, Menu, X, Target } from 'lucide-react';
import { ContentInput } from './components/ContentInput';
import SessionManagement from './components/SessionManagement';
import { Statistics } from './components/Statistics';
import { Login } from './components/Login';
import { useLocalStorage } from './hooks/useLocalStorage';
import { downloadFile } from './utils/fileUtils';
import type { QAItem, SessionData, User as UserType } from './types';
import type { UrlData } from './components/ContentInput';
import { useAuth } from './contexts/AuthContext';
import { calculateCost } from './utils/pricing';
import { History } from './components/History';
import { Configuration } from './components/Configuration';
import { apiService } from './services/apiService';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Overview } from './components/Overview.tsx';
import { CompetitorBenchmarking } from './components/CompetitorBenchmarking';

// import SmartCompetitorAnalysis from './components/SmartCompetitorAnalysis';
import { ContentStructureAnalysisRoute } from './components/ContentStructureAnalysisRoute';
import { ContentStructureLanding } from './components/ContentStructureLanding';
import AIVIsibilityAnalysis from './components/AIVIsibilityAnalysis';

const SESSIONS_KEY = 'llm_qa_sessions';
const CURRENT_SESSION_KEY = 'llm_qa_current_session';
const COMPETITOR_URLS_KEY = 'llm_competitor_urls';
const QA_WORK_KEY = 'llm_qa_current_work';
const ENHANCE_CONTENT_KEY = 'enhance_content_state';

const NAV_ITEMS = [
  { label: 'Overview', icon: <Zap />, path: '/overview' },
  { label: 'Enhance Content', icon: <FileText />, path: '/enhance-content' },
  { label: 'Content Analysis', icon: <BarChart3 />, path: '/content-analysis' },
  { label: 'Structure Analysis', icon: <Target />, path: '/content-structure-analysis' },
  // { label: 'Smart Competitor Analysis', icon: <BarChart3 />, path: '/smart-competitor-analysis' },
  { label: 'AI Visibility Analysis', icon: <BarChart3 />, path: '/ai-visibility-analysis' },
  { label: 'Sessions', icon: <FileText />, path: '/sessions' },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-white w-60 min-h-screen flex flex-col border-r border-primary/20 transform transition-transform duration-300 lg:transform-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-primary tracking-wide">Genfuze.ai</span>
          <button className="lg:hidden text-primary hover:text-accent transition-colors" onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
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
        
        <div className="mt-auto px-6 py-6 border-t border-primary/10 flex flex-col items-start gap-1">
          <User className="w-6 h-6 text-primary" />
          <div className="font-bold text-slate-900">Administrator</div>
          <div className="text-xs text-primary">admin@example.com</div>
          <button className="bg-white border border-primary text-primary px-3 py-2 rounded hover:bg-primary hover:text-white transition-all mt-1" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  return (
    <header className="w-full bg-white border-b border-primary/10 flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-extrabold text-primary tracking-wide">Genfuze.ai</span>
      </div>
      <button className="lg:hidden text-primary hover:text-accent transition-colors" onClick={() => setIsOpen(true)}>
        <Menu className="w-6 h-6" />
      </button>
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
  const [sessions, setSessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession, setCurrentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [qaContent, setQaContent] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [answerLoading, setAnswerLoading] = useState<{ [idx: number]: boolean }>({});
  const [urls, setUrls] = useState<UrlData[]>([]);

  // Restore Q&A work state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(QA_WORK_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.qaItems) setQaItems(parsed.qaItems);
        if (parsed.qaContent) setQaContent(parsed.qaContent);
        if (parsed.selectedQuestions) setSelectedQuestions(parsed.selectedQuestions);
        if (parsed.questionCount) setQuestionCount(parsed.questionCount);
        if (typeof parsed.isProcessing === 'boolean') setIsProcessing(parsed.isProcessing);
        if (parsed.selectedProvider) setSelectedProvider(parsed.selectedProvider);
        if (parsed.selectedModel) setSelectedModel(parsed.selectedModel);
        if (parsed.answerLoading) setAnswerLoading(parsed.answerLoading);
        if (parsed.urls) setUrls(parsed.urls);
      } catch {}
    }
  }, []);

  // Persist Q&A work state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      qaItems,
      qaContent,
      selectedQuestions,
      questionCount,
      isProcessing,
      selectedProvider,
      selectedModel,
      answerLoading,
      urls
    };
    localStorage.setItem(QA_WORK_KEY, JSON.stringify(state));
  }, [qaItems, qaContent, selectedQuestions, questionCount, isProcessing, selectedProvider, selectedModel, answerLoading, urls]);

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(ENHANCE_CONTENT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.qaItems) setQaItems(parsed.qaItems);
        if (parsed.qaContent) setQaContent(parsed.qaContent);
        if (parsed.selectedQuestions) setSelectedQuestions(parsed.selectedQuestions);
        if (parsed.questionCount) setQuestionCount(parsed.questionCount);
        if (typeof parsed.isProcessing === 'boolean') setIsProcessing(parsed.isProcessing);
        if (parsed.selectedProvider) setSelectedProvider(parsed.selectedProvider);
        if (parsed.selectedModel) setSelectedModel(parsed.selectedModel);
        if (parsed.answerLoading) setAnswerLoading(parsed.answerLoading);
        if (parsed.urls) setUrls(parsed.urls);
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    const state = {
      qaItems,
      qaContent,
      selectedQuestions,
      questionCount,
      isProcessing,
      selectedProvider,
      selectedModel,
      answerLoading,
      urls
    };
    localStorage.setItem(ENHANCE_CONTENT_KEY, JSON.stringify(state));
  }, [qaItems, qaContent, selectedQuestions, questionCount, isProcessing, selectedProvider, selectedModel, answerLoading, urls]);

  // Defensive: Ensure sessions is always an array
  useEffect(() => {
    if (!Array.isArray(sessions)) {
      setSessions([]);
    }
  }, [sessions, setSessions]);

  // Initialize default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
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
        }
      };
      setSessions([defaultSession]);
      setCurrentSession(defaultSession);
    }
  }, [sessions, setSessions, setCurrentSession]);

  // Store competitor URLs in localStorage whenever they change
  useEffect(() => {
    const urlList = urls.map(u => u.url);
    localStorage.setItem(COMPETITOR_URLS_KEY, JSON.stringify(urlList));
  }, [urls]);

  const handleGenerateQA = (items: QAItem[], content: string) => {
    setQaItems(prev => [...prev, ...items]);
    setQaContent(content);
    if (currentSession) {
      const totalInputTokens = items.reduce((sum, item) => sum + item.inputTokens, 0);
      const totalOutputTokens = items.reduce((sum, item) => sum + item.outputTokens, 0);
      const totalCost = calculateCost(totalInputTokens, totalOutputTokens, currentSession.model);
      
      const updatedSession = {
        ...currentSession,
        qaData: [...currentSession.qaData, ...items],
        statistics: {
          totalQuestions: currentSession.qaData.length + items.length,
          avgAccuracy: '85',
          avgCitationLikelihood: '75',
          totalCost: totalCost.toString()
        }
      };
      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    }
  };

  const handleGenerateAnswer = async (idx: number) => {
    setAnswerLoading((prev) => ({ ...prev, [idx]: true }));
    try {
      const item = qaItems[idx];
      const provider = selectedProvider;
      const model = selectedModel === 'gemini-pro' ? 'gemini-1.5-flash' : selectedModel;
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
        // apiService.calculateVectorSimilarities([{ question: item.question, answer: answerObj.answer }], qaContent)
      ]);
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
          vectorSimilarity: null,
          semanticRelevance: null
        };
        // Persist to session and sessions
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            qaData: updated,
            statistics: {
              ...currentSession.statistics,
              totalQuestions: updated.length,
              totalCost: updated.reduce((sum, item) => sum + (item.cost || 0), 0).toString()
            }
          };
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

  return (
    <div className="space-y-8">
      <Configuration 
        provider={selectedProvider}
        model={selectedModel}
        onProviderChange={setSelectedProvider}
        onModelChange={setSelectedModel}
        questionCount={questionCount}
        onQuestionCountChange={setQuestionCount}
      />
      <ContentInput 
        onGenerateQA={handleGenerateQA}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        provider={selectedProvider}
        model={selectedModel === 'gemini-pro' ? 'gemini-1.5-flash' : selectedModel}
        questionCount={questionCount}
        urls={urls}
        setUrls={setUrls}
      />
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
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [sessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);

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

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onLogout={handleLogout} 
        user={null} // Removed user prop as it's not directly available here
        currentPath={location.pathname}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar setIsOpen={setSidebarOpen} />
        <main className="flex-1 p-8 overflow-y-auto text-black bg-white">
          <Routes>
            <Route path="/overview" element={<Overview />} />
            <Route path="/qa-generation" element={<QAGenerationPage />} />
            <Route path="/enhance-content" element={<QAGenerationPage />} />
            <Route path="/content-analysis" element={<CompetitorBenchmarking competitorDomains={competitorDomains} />} />
    
            {/* <Route path="/smart-competitor-analysis" element={<SmartCompetitorAnalysis />} /> */}
            <Route path="/ai-visibility-analysis" element={<AIVIsibilityAnalysis />} />
            <Route path="/content-structure-analysis" element={<ContentStructureAnalysisRoute />} />
            <Route path="/content-structure-landing" element={<ContentStructureLanding />} />
            <Route path="/sessions" element={<SessionManagement />} />
            <Route path="/history" element={<History qaItems={sessions.flatMap(s => s.qaData)} onExport={downloadFile} />} />
            <Route path="/statistics" element={<Statistics sessions={[]} currentSession={null} />} />
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