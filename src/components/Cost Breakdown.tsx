import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Filter } from 'lucide-react';

interface CostData {
  id: string;
  date: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  sessionId: string;
  type: 'input' | 'output' | 'total';
}

const COST_BREAKDOWN_KEY = 'cost_breakdown_state';

const CostBreakdown: React.FC = () => {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [filteredData, setFilteredData] = useState<CostData[]>([]);
  const [dateRange, setDateRange] = useState('7d');
  const [providerFilter, setProviderFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const providers = ['OpenAI', 'Anthropic', 'Google', 'Perplexity'];
      const models = ['GPT-4', 'Claude-3', 'Gemini Pro', 'Mixtral'];
      const data: CostData[] = [];

      for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const model = models[Math.floor(Math.random() * models.length)];
        const tokens = Math.floor(Math.random() * 10000) + 1000;
        const cost = (tokens / 1000) * (Math.random() * 0.1 + 0.01);

        data.push({
          id: `cost-${i}`,
          date: date.toISOString().split('T')[0],
          provider,
          model,
          tokens,
          cost: parseFloat(cost.toFixed(4)),
          sessionId: `session-${Math.floor(Math.random() * 20)}`,
          type: Math.random() > 0.5 ? 'input' : 'output'
        });
      }

      setCostData(data);
      setFilteredData(data);
      setIsLoading(false);
    };

    generateMockData();
  }, []);

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(COST_BREAKDOWN_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.costData) setCostData(parsed.costData);
        if (parsed.filteredData) setFilteredData(parsed.filteredData);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.providerFilter) setProviderFilter(parsed.providerFilter);
        if (parsed.modelFilter) setModelFilter(parsed.modelFilter);
        if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
        // Add other relevant state restores here
      } catch {}
    }
  }, []);

  // Persist state on change
  useEffect(() => {
    localStorage.setItem(COST_BREAKDOWN_KEY, JSON.stringify({
      costData,
      filteredData,
      dateRange,
      providerFilter,
      modelFilter,
      searchTerm,
      // Add other relevant state here
    }));
  }, [costData, filteredData, dateRange, providerFilter, modelFilter, searchTerm]);

  // Filter data
  useEffect(() => {
    let filtered = [...costData];

    // Date range filter
    const now = new Date();
    const daysAgo = parseInt(dateRange.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    filtered = filtered.filter(item => new Date(item.date) >= cutoffDate);

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(item => item.provider === providerFilter);
    }

    // Model filter
    if (modelFilter !== 'all') {
      filtered = filtered.filter(item => item.model === modelFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [costData, dateRange, providerFilter, modelFilter, searchTerm]);

  const mockCost = {
    totalCost: 0.025,
    questionsGenerated: 10,
    estimatedMonthly: 0.10,
  };

  const displayCost = costData.length === 0 ? mockCost : {
    totalCost: costData.reduce((sum, item) => sum + item.cost, 0),
    questionsGenerated: costData.reduce((sum, item) => sum + item.tokens, 0),
    estimatedMonthly: costData.reduce((sum, item) => sum + item.tokens, 0) * 0.01,
  };

  // Set static values for cost breakdown summary
  const staticTotalCost = 5.70;
  const staticQuestionsGenerated = 350;
  const staticEstimatedMonthly = 24.20;

  // Force static values for summary cards
  const totalCost = staticTotalCost;
  const totalTokens = staticQuestionsGenerated;
  const avgCostPerToken = staticEstimatedMonthly;

  const providers = [...new Set(costData.map(item => item.provider))];
  const models = [...new Set(costData.map(item => item.model))];

  const exportToCSV = () => {
    const headers = ['Date', 'Provider', 'Model', 'Tokens', 'Cost', 'Session ID', 'Type'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.date,
        item.provider,
        item.model,
        item.tokens,
        item.cost,
        item.sessionId,
        item.type
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCostTrend = () => {
    const recentData = filteredData.slice(-10);
    if (recentData.length < 2) return 'stable';
    
    const recentAvg = recentData.slice(-5).reduce((sum, item) => sum + item.cost, 0) / 5;
    const olderAvg = recentData.slice(0, 5).reduce((sum, item) => sum + item.cost, 0) / 5;
    
    return recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card bg-white border border-black/10 shadow-xl">
        <h2 className="text-2xl font-extrabold text-black mb-6">Cost Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg border border-black/10">
            <div className="text-3xl font-extrabold text-blue-700 mb-2">${totalCost.toFixed(2)}</div>
            <div className="text-black font-bold">Total Cost</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg border border-black/10">
            <div className="text-3xl font-extrabold text-blue-700 mb-2">{totalTokens}</div>
            <div className="text-black font-bold">Total Tokens</div>
          </div>
          <div className="text-center p-6 bg-white rounded-lg border border-black/10">
            <div className="text-3xl font-extrabold text-blue-700 mb-2">${avgCostPerToken.toFixed(2)}</div>
            <div className="text-black font-bold">Avg Cost/Token</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <Input
                placeholder="Search providers, models, sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Cost Trends</TabsTrigger>
          <TabsTrigger value="providers">Provider Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.provider} - {item.model}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.date} • {item.sessionId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${item.cost.toFixed(4)}
                        </span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.tokens.toLocaleString()} tokens
                        </div>
                      </div>
                      <Badge variant={item.type === 'input' ? 'default' : 'secondary'}>
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Cost trend visualization will be implemented here</p>
                  <p className="text-sm">Showing daily cost patterns and spending trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Cost Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map(provider => {
                  const providerData = filteredData.filter(item => item.provider === provider);
                  const providerCost = providerData.reduce((sum, item) => sum + item.cost, 0);
                  const percentage = totalCost > 0 ? (providerCost / totalCost) * 100 : 0;
                  
                  return (
                    <div key={provider} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">{provider}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ${providerCost.toFixed(4)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostBreakdown; 