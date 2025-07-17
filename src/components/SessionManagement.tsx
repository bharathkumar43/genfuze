import React, { useState, useEffect } from 'react';
import { Database, Save, Trash2, Download, RefreshCcw, FileText, Clock, Users, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  questionCount: number;
  answerCount: number;
  status: 'active' | 'completed' | 'archived';
  description?: string;
}

const SESSION_MANAGEMENT_KEY = 'session_management_state';

function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionName, setCurrentSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data generation
  useEffect(() => {
    const generateMockSessions = () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          name: 'Blog Analysis - Tech Trends 2024',
          createdAt: '2024-01-15T10:30:00Z',
          lastModified: '2024-01-15T14:45:00Z',
          questionCount: 25,
          answerCount: 23,
          status: 'completed',
          description: 'Comprehensive analysis of technology trends for Q1 2024'
        },
        {
          id: 'session-2',
          name: 'Content Review - Marketing Strategy',
          createdAt: '2024-01-14T09:15:00Z',
          lastModified: '2024-01-14T16:20:00Z',
          questionCount: 18,
          answerCount: 18,
          status: 'completed',
          description: 'Marketing content review and optimization strategy'
        },
        {
          id: 'session-3',
          name: 'Product Research - AI Tools',
          createdAt: '2024-01-13T11:00:00Z',
          lastModified: '2024-01-13T11:00:00Z',
          questionCount: 12,
          answerCount: 8,
          status: 'active',
          description: 'Research on AI tools and their applications'
        },
        {
          id: 'session-4',
          name: 'Content Analysis - SaaS',
          createdAt: '2024-01-12T08:30:00Z',
          lastModified: '2024-01-12T08:30:00Z',
          questionCount: 30,
          answerCount: 30,
          status: 'archived',
          description: 'Competitive analysis of SaaS companies'
        }
      ];
      setSessions(mockSessions);
    };

    generateMockSessions();
  }, []);

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_MANAGEMENT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessions) setSessions(parsed.sessions);
        if (parsed.currentSessionName) setCurrentSessionName(parsed.currentSessionName);
        if (parsed.selectedSession) setSelectedSession(parsed.selectedSession);
        // Add other relevant state restores here
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(SESSION_MANAGEMENT_KEY, JSON.stringify({
      sessions,
      currentSessionName,
      selectedSession,
      // Add other relevant state here
    }));
  }, [sessions, currentSessionName, selectedSession]);

  const saveCurrentSession = async () => {
    if (!currentSessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSession: Session = {
        id: `session-${Date.now()}`,
        name: currentSessionName,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        questionCount: 0,
        answerCount: 0,
        status: 'active',
        description: 'New session created'
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionName('');
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionName(session.name);
    }
  };

  const deleteSession = async (session: Session) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSessions(prev => prev.filter(s => s.id !== session.id));
      if (selectedSession === session.id) {
        setSelectedSession('');
        setCurrentSessionName('');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllSessions = async () => {
    if (!confirm('Are you sure you want to clear all sessions? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSessions([]);
      setSelectedSession('');
      setCurrentSessionName('');
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAllSessions = () => {
    const csvContent = [
      ['Session Name', 'Created', 'Last Modified', 'Questions', 'Answers', 'Status'],
      ...sessions.map(session => [
        session.name,
        new Date(session.createdAt).toLocaleDateString(),
        new Date(session.lastModified).toLocaleDateString(),
        session.questionCount.toString(),
        session.answerCount.toString(),
        session.status
      ])
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'archived':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: Session['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const mockSessions = [
    {
      id: '1',
      name: 'Demo Session 1',
      type: 'question',
      timestamp: '2025-07-10T10:00:00Z',
      model: 'gemini-pro',
      blogContent: 'Sample blog content',
      qaData: [
        { question: 'What is Genfuze?', answer: 'Genfuze is an AI platform.', accuracy: '95', sentiment: 'positive', inputTokens: 50, outputTokens: 20, totalTokens: 70, cost: 0.002, geoScore: 0, citationLikelihood: 0 },
        { question: 'How does it work?', answer: 'It uses LLMs to generate answers.', accuracy: '90', sentiment: 'neutral', inputTokens: 40, outputTokens: 30, totalTokens: 70, cost: 0.003, geoScore: 0, citationLikelihood: 0 }
      ],
      totalInputTokens: 90,
      totalOutputTokens: 50,
      statistics: { totalQuestions: 2, avgAccuracy: '92.5', avgCitationLikelihood: '0', totalCost: '0.005' },
      userId: 'admin',
      status: 'active',
      createdAt: '2025-07-10T09:00:00Z',
      lastModified: '2025-07-10T10:00:00Z',
      questionCount: 2,
      answerCount: 2,
      description: 'Demo session for Genfuze',
    },
    {
      id: '2',
      name: 'Demo Session 2',
      type: 'question',
      timestamp: '2025-07-11T12:00:00Z',
      model: 'gemini-pro',
      blogContent: 'Another blog',
      qaData: [
        { question: 'What is AI?', answer: 'Artificial Intelligence.', accuracy: '98', sentiment: 'positive', inputTokens: 30, outputTokens: 15, totalTokens: 45, cost: 0.001, geoScore: 0, citationLikelihood: 0 }
      ],
      totalInputTokens: 30,
      totalOutputTokens: 15,
      statistics: { totalQuestions: 1, avgAccuracy: '98', avgCitationLikelihood: '0', totalCost: '0.001' },
      userId: 'admin',
      status: 'completed',
      createdAt: '2025-07-11T11:00:00Z',
      lastModified: '2025-07-11T12:00:00Z',
      questionCount: 1,
      answerCount: 1,
      description: 'Demo session for AI',
    }
  ];

  const displaySessions = sessions.length === 0 ? mockSessions : sessions;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Save, load, and manage your Q&A generation sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
            {sessions.length} Sessions
          </span>
        </div>
      </div>

      {/* Session Creation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Session
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Session Name
              </label>
              <input
                type="text"
                placeholder="Enter session name (e.g., 'Blog Analysis - Q1 2024')"
                value={currentSessionName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentSessionName(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && saveCurrentSession()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={saveCurrentSession} 
                disabled={isLoading || !currentSessionName.trim()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Session Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={exportAllSessions} 
              disabled={sessions.length === 0}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export All Sessions
            </button>
            
            <button 
              onClick={clearAllSessions}
              disabled={sessions.length === 0 || isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Clear All Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Saved Sessions
          </h2>
        </div>
        <div className="p-6">
          {displaySessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions found</p>
              <p className="text-sm">Create your first session to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displaySessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                    selectedSession === session.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(session.status)}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {session.name}
                          </h3>
                          {session.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {session.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          {new Date(session.lastModified).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {session.questionCount} questions • {session.answerCount} answers
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${session.name}"?`)) {
                              deleteSession(session);
                            }
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session Statistics */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Statistics
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {sessions.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {sessions.filter(s => s.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {sessions.reduce((sum, s) => sum + s.questionCount, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {sessions.reduce((sum, s) => sum + s.answerCount, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Answers</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SessionManagement;