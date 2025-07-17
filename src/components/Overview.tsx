import React from 'react';
import { Zap, FileText, BarChart3, History, DollarSign, Target } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { SessionData } from '../types';
import { useNavigate } from 'react-router-dom';

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
  const [sessions] = useLocalStorage<SessionData[]>(SESSIONS_KEY, []);
  const [currentSession] = useLocalStorage<SessionData | null>(CURRENT_SESSION_KEY, null);
  const navigate = useNavigate();

  const getTotalCost = () => {
    return sessions.reduce((sum, session) => {
      return sum + parseFloat(session.statistics?.totalCost || '0');
    }, 0);
  };

  const getTotalQuestions = () => {
    return sessions.reduce((sum, session) => {
      return sum + (session.qaData?.length || 0);
    }, 0);
  };

  const getAverageAccuracy = () => {
    if (sessions.length === 0) return 0;
    const totalAccuracy = sessions.reduce((sum, session) => {
      return sum + parseFloat(session.statistics?.avgAccuracy || '0');
    }, 0);
    return totalAccuracy / sessions.length;
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
      value: sessions.length,
      icon: <History className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const recentSessions = sessions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome to Genfuze.ai - Your AI-Powered Content Enhancement Platform</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2 rounded-lg">
          <Zap className="w-5 h-5" />
          <span className="font-semibold">AI Powered</span>
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
          title="AI Visibility Analysis"
          description="Compare your company's visibility, citation count, share of voice, and customer ratings with top competitors."
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