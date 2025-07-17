import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Download, Filter, Search, Calendar, User, BarChart3, Clock, FileText, DollarSign } from 'lucide-react';
import { QAItem, SessionData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface HistoryProps {
  qaItems: QAItem[];
  onExport: (content: string, filename: string, mimeType: string) => void;
}

export function History({ qaItems, onExport }: HistoryProps) {
  const [sessions] = useLocalStorage<SessionData[]>('llm_qa_sessions', []);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.qaData.some(qa => 
          qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          qa.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(session => 
        new Date(session.timestamp) >= filterDate
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, dateFilter]);

  const handleExport = () => {
    const selectedSessions = selectedSession 
      ? filteredSessions.filter(s => s.id === selectedSession)
      : filteredSessions;

    const csvContent = selectedSessions.flatMap((session, sessionIndex) =>
      session.qaData.map((item, itemIndex) => 
        `${sessionIndex + 1}-${itemIndex + 1},"${session.name}","${session.timestamp}","${item.question}","${item.answer}","${item.accuracy}","${item.sentiment}",${item.inputTokens},${item.outputTokens},${item.totalTokens},${item.cost || 0}`
      )
    ).join('\n');
    
    const header = 'ID,Session,Timestamp,Question,Answer,Accuracy,Sentiment,Input Tokens,Output Tokens,Total Tokens,Cost\n';
    onExport(header + csvContent, 'qa-history.csv', 'text/csv');
  };

  const getSessionStats = (session: SessionData) => {
    const totalQuestions = session.qaData.length;
    const totalTokens = session.qaData.reduce((sum, qa) => sum + qa.totalTokens, 0);
    const totalCost = session.qaData.reduce((sum, qa) => sum + (qa.cost || 0), 0);
    const avgAccuracy = session.qaData.length > 0 
      ? session.qaData.reduce((sum, qa) => sum + (parseFloat(qa.accuracy) || 0), 0) / session.qaData.length
      : 0;

    return { totalQuestions, totalTokens, totalCost, avgAccuracy };
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold text-primary mb-8">Session History</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">Total Sessions</div>
          <div className="text-3xl font-extrabold">{sessions.length}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">Total Questions</div>
          <div className="text-3xl font-extrabold">
              {filteredSessions.reduce((sum, session) => sum + session.qaData.length, 0)}
            </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">Total Cost</div>
          <div className="text-3xl font-extrabold">
              ${filteredSessions.reduce((sum, session) => sum + parseFloat(session.statistics?.totalCost || '0'), 0).toFixed(2)}
            </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <button onClick={handleExport} className="bg-black text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-800 transition">Export CSV</button>
        </div>
      </div>
      <div className="space-y-8">
        {filteredSessions.map((session, index) => (
          <div key={`${session.id ?? ''}${index}`} className="bg-white rounded-lg border border-black/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{session.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div className="font-bold text-black text-lg">{session.name}</div>
                <div className="text-xs text-black/60">{formatDate(session.timestamp)}</div>
              </div>
            </div>
            <div className="space-y-3">
              {session.qaData.map((item, index) => (
                <div key={index} className="rounded-lg p-4 border border-black/10 bg-white mb-2">
                  <div className="font-bold text-black mb-2">Q{index + 1}: {item.question}</div>
                  {item.answer && (
                    <div className="bg-primary/90 rounded-lg p-3 mb-2">
                      <p className="text-white leading-relaxed text-base">{item.answer}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-black/80 mt-2">
                    <div><span className="font-semibold">Accuracy:</span> {item.accuracy ?? 'N/A'}</div>
                    <div><span className="font-semibold">Sentiment:</span> {item.sentiment ?? 'N/A'}</div>
                    <div><span className="font-semibold">Input Tokens:</span> {item.inputTokens ?? 'N/A'}</div>
                    <div><span className="font-semibold">Output Tokens:</span> {item.outputTokens ?? 'N/A'}</div>
                    <div><span className="font-semibold">Total Tokens:</span> {item.totalTokens ?? 'N/A'}</div>
                    <div><span className="font-semibold">Cost:</span> ${item.cost?.toFixed(4) ?? 'N/A'}</div>
                    <div><span className="font-semibold">Geo Score:</span> {item.geoScore ?? 'N/A'}</div>
                    <div><span className="font-semibold">Citation Likelihood:</span> {item.citationLikelihood ?? 'N/A'}</div>
                    {item.semanticRelevance !== undefined && <div><span className="font-semibold">Semantic Relevance:</span> {item.semanticRelevance}</div>}
                    {item.vectorSimilarity !== undefined && <div><span className="font-semibold">Vector Similarity:</span> {item.vectorSimilarity}</div>}
                    {item.fanoutAnalysis && <div className="col-span-2 md:col-span-3"><span className="font-semibold">Fanout Analysis:</span> <pre className="whitespace-pre-wrap break-all">{JSON.stringify(item.fanoutAnalysis, null, 2)}</pre></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 