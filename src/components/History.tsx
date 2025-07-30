import React, { useState, useEffect, useMemo } from 'react';
import { 
  History as HistoryIcon, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  BarChart3, 
  Clock, 
  FileText, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  Globe,
  Tag,
  CalendarDays,
  X,
  RefreshCw,
  Eye,
  Target,
  Layers,
  Brain,
  TrendingUp,
  Users,
  Activity,
  Trash2
} from 'lucide-react';
import { QAItem, SessionData, HistoryItem, QAHistoryItem, AIVisibilityHistoryItem, ContentAnalysisHistoryItem, StructureAnalysisHistoryItem } from '../types';
import { historyService } from '../services/historyService';

interface HistoryProps {
  qaItems: QAItem[];
  onExport: (content: string, filename: string, mimeType: string) => void;
}

interface GroupedHistoryItem {
  groupKey: string;
  groupTitle: string;
  groupType: 'date' | 'type' | 'status';
  items: HistoryItem[];
  totalItems: number;
  dateRange?: string;
}

interface FilterState {
  searchTerm: string;
  dateFilter: string;
  typeFilter: string;
  statusFilter: string;
  showFilters: boolean;
  groupBy: 'date' | 'type' | 'status';
  sortBy: 'date' | 'name' | 'type' | 'status';
  sortOrder: 'asc' | 'desc';
}

export function History({ qaItems, onExport }: HistoryProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedHistoryItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    dateFilter: 'all',
    typeFilter: 'all',
    statusFilter: 'all',
    showFilters: false,
    groupBy: 'date',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Load history items from service
  useEffect(() => {
    try {
      const items = historyService.getHistoryItems();
      console.log('[History] Loaded items:', items.length, items);
      
      // Filter out any corrupted items
      const validItems = items.filter(item => 
        item && 
        typeof item === 'object' && 
        item.id && 
        item.type && 
        item.name && 
        item.timestamp
      );
      
      console.log('[History] Valid items:', validItems.length, validItems);
      setHistoryItems(validItems);
    } catch (error) {
      console.error('[History] Error loading history items:', error);
      setHistoryItems([]);
    }
  }, [refreshKey]);

  // Listen for storage changes to auto-refresh
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'comprehensive_history') {
        console.log('[History] Storage changed, refreshing history');
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes every 2 seconds (fallback)
    const interval = setInterval(() => {
      const currentItems = historyService.getHistoryItems();
      if (currentItems.length !== historyItems.length) {
        console.log('[History] Item count changed, refreshing history');
        setHistoryItems(currentItems);
      }
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [historyItems.length]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const statuses = new Set<string>();

    historyItems.forEach(item => {
      types.add(item.type);
      statuses.add(item.status);
    });

    return {
      types: Array.from(types).sort(),
      statuses: Array.from(statuses).sort()
    };
  }, [historyItems, refreshKey]);

  // Apply filters
  useEffect(() => {
    console.log('[History] History items updated:', historyItems.length, 'items');
    console.log('[History] History data:', historyItems);
    
    let filtered = [...historyItems];

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (item.type === 'qa' && (item as QAHistoryItem).sessionData.qaData.some(qa => 
          qa.question.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          qa.answer.toLowerCase().includes(filters.searchTerm.toLowerCase())
        )) ||
        (item.type === 'ai-visibility' && (item as AIVisibilityHistoryItem).company.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }

    // Date filter
    if (filters.dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateFilter) {
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
      
      filtered = filtered.filter(item => 
        new Date(item.timestamp) >= filterDate
      );
    }

    // Type filter
    if (filters.typeFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.type === filters.typeFilter
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.status === filters.statusFilter
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log('[History] Filtered items:', filtered.length, 'items');
    setFilteredItems(filtered);
  }, [historyItems, filters, refreshKey]);

  // Group items
  useEffect(() => {
    const grouped: GroupedHistoryItem[] = [];
    const groupMap = new Map<string, HistoryItem[]>();

    filteredItems.forEach(item => {
      let groupKey = '';
      let groupTitle = '';
      let groupType: 'date' | 'type' | 'status' = 'date';

      switch (filters.groupBy) {
        case 'date':
          const date = new Date(item.timestamp);
          groupKey = date.toDateString();
          groupTitle = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          groupType = 'date';
          break;
        case 'type':
          groupKey = item.type;
          groupTitle = getTypeDisplayName(item.type);
          groupType = 'type';
          break;
        case 'status':
          groupKey = item.status;
          groupTitle = item.status.charAt(0).toUpperCase() + item.status.slice(1);
          groupType = 'status';
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(item);
    });

    // Convert to array and calculate group stats
    groupMap.forEach((items, key) => {
      let groupTitle = key;
      if (filters.groupBy === 'date') {
        const date = new Date(key);
        groupTitle = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (filters.groupBy === 'type') {
        groupTitle = getTypeDisplayName(key as any);
      } else if (filters.groupBy === 'status') {
        groupTitle = key.charAt(0).toUpperCase() + key.slice(1);
      }

      grouped.push({
        groupKey: key,
        groupTitle,
        groupType: filters.groupBy,
        items,
        totalItems: items.length,
        dateRange: filters.groupBy === 'date' ? key : undefined
      });
    });

    // Sort groups
    grouped.sort((a, b) => {
      if (filters.groupBy === 'date') {
        return new Date(b.groupKey).getTime() - new Date(a.groupKey).getTime();
      }
      return a.groupTitle.localeCompare(b.groupTitle);
    });

    setGroupedItems(grouped);
  }, [filteredItems, filters.groupBy, refreshKey]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateFilter: 'all',
      typeFilter: 'all',
      statusFilter: 'all',
      showFilters: false,
      groupBy: 'date',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'qa':
        return 'Q&A Sessions';
      case 'ai-visibility':
        return 'AI Visibility Analysis';
      case 'content-analysis':
        return 'Content Analysis';
      case 'structure-analysis':
        return 'Structure Analysis';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qa':
        return <FileText className="h-4 w-4" />;
      case 'ai-visibility':
        return <Eye className="h-4 w-4" />;
      case 'content-analysis':
        return <Target className="h-4 w-4" />;
      case 'structure-analysis':
        return <Layers className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderHistoryItem = (item: HistoryItem) => {
    try {
      if (!item || !item.type) {
        console.error('[History] Invalid item:', item);
        return <div className="text-red-500">Invalid item data</div>;
      }
      
      switch (item.type) {
        case 'qa':
          return renderQAItem(item as QAHistoryItem);
        case 'ai-visibility':
          return renderAIVisibilityItem(item as AIVisibilityHistoryItem);
        case 'content-analysis':
          return renderContentAnalysisItem(item as ContentAnalysisHistoryItem);
        case 'structure-analysis':
          return renderStructureAnalysisItem(item as StructureAnalysisHistoryItem);
        default:
          return <div className="text-orange-500">Unknown item type: {item.type}</div>;
      }
    } catch (error) {
      console.error('[History] Error rendering item:', error, item);
      return <div className="text-red-500">Error rendering item: {error.message}</div>;
    }
  };

  const renderQAItem = (item: QAHistoryItem) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-black">{item.name}</div>
            <div className="text-xs text-gray-600">{formatDate(item.timestamp)}</div>
            <div className="text-xs text-blue-600">
              {item.sessionData.qaData.length} Q&A pairs
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => toggleItemSelection(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {item.sessionData.qaData.slice(0, 3).map((qa, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="font-semibold text-gray-900 mb-2">Q{index + 1}: {qa.question}</div>
            {qa.answer && (
              <div className="text-sm text-gray-700 mb-2">{qa.answer.substring(0, 100)}...</div>
            )}
            <div className="flex gap-2 text-xs text-gray-500">
              <span>Accuracy: {qa.accuracy || 'N/A'}</span>
              <span>Sentiment: {qa.sentiment || 'N/A'}</span>
              <span>Cost: ${(qa.cost || 0).toFixed(4)}</span>
            </div>
          </div>
        ))}
        {item.sessionData.qaData.length > 3 && (
          <div className="text-center text-sm text-gray-500">
            +{item.sessionData.qaData.length - 3} more Q&A pairs
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleDownloadItem(item.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </button>
        <button
          onClick={() => handleDownloadItemAsCSV(item.id)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );

  const renderAIVisibilityItem = (item: AIVisibilityHistoryItem) => {
    // Safety checks for required properties
    if (!item.analysis || !item.analysis.competitors) {
      return (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="text-red-600">Invalid AI Visibility data structure</div>
          <div className="text-xs text-red-500 mt-2">Missing analysis or competitors data</div>
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Eye className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-black">{item.name}</div>
              <div className="text-xs text-gray-600">{formatDate(item.timestamp)}</div>
              <div className="text-xs text-purple-600">
                {item.analysis.competitors?.length || 0} competitors analyzed
              </div>
            </div>
          </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => toggleItemSelection(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="font-semibold text-gray-900 mb-2">Company: {item.company}</div>
          {item.industry && <div className="text-sm text-gray-600 mb-2">Industry: {item.industry}</div>}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Top Competitor: {item.analysis.summary?.topCompetitor || 'N/A'}</div>
            <div>Avg Score: {item.analysis.summary?.averageVisibilityScore?.toFixed(1) || 'N/A'}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          {item.analysis.competitors.slice(0, 3).map((competitor, index) => (
            <div key={index} className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="font-medium text-sm">{competitor.name}</div>
              <div className="text-xs text-gray-600">
                Avg Score: {competitor.visibilityScores?.average?.toFixed(1) || 'N/A'}
              </div>
            </div>
          ))}
          {item.analysis.competitors.length > 3 && (
            <div className="text-center text-sm text-gray-500">
              +{item.analysis.competitors.length - 3} more competitors
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleDownloadItem(item.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </button>
        <button
          onClick={() => handleDownloadItemAsCSV(item.id)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
  };

  const renderContentAnalysisItem = (item: ContentAnalysisHistoryItem) => {
    // Safety checks for required properties
    if (!item.analysis) {
      return (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="text-red-600">Invalid Content Analysis data structure</div>
          <div className="text-xs text-red-500 mt-2">Missing analysis data</div>
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-black">{item.name}</div>
              <div className="text-xs text-gray-600">{formatDate(item.timestamp)}</div>
              <div className="text-xs text-green-600">
                SEO Score: {item.analysis?.seoScore || 'N/A'}/100
              </div>
            </div>
          </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => toggleItemSelection(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-900">SEO Score</div>
            <div className="text-2xl font-bold text-green-600">{item.analysis?.seoScore || 'N/A'}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Readability</div>
            <div className="text-2xl font-bold text-blue-600">{item.analysis?.readabilityScore || 'N/A'}</div>
          </div>
        </div>
        
        {item.analysis?.suggestions?.length > 0 && (
          <div className="mt-3">
            <div className="font-semibold text-gray-900 mb-2">Suggestions</div>
            <div className="space-y-1">
              {item.analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="text-xs text-gray-600">
                  • {suggestion.description}
                </div>
              ))}
              {item.analysis.suggestions.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{item.analysis.suggestions.length - 3} more suggestions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleDownloadItem(item.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </button>
        <button
          onClick={() => handleDownloadItemAsCSV(item.id)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
  };

  const renderStructureAnalysisItem = (item: StructureAnalysisHistoryItem) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-black">{item.name}</div>
            <div className="text-xs text-gray-600">{formatDate(item.timestamp)}</div>
            <div className="text-xs text-orange-600">
              {item.analysis.suggestions.length} suggestions
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          <input
            type="checkbox"
            checked={selectedItems.has(item.id)}
            onChange={() => toggleItemSelection(item.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-900">SEO Score</div>
            <div className="text-xl font-bold text-green-600">{item.analysis.seoScore}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">LLM Optimization</div>
            <div className="text-xl font-bold text-blue-600">{item.analysis.llmOptimizationScore}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Readability</div>
            <div className="text-xl font-bold text-purple-600">{item.analysis.readabilityScore}</div>
          </div>
        </div>
        
        {item.analysis.suggestions.length > 0 && (
          <div className="mt-3">
            <div className="font-semibold text-gray-900 mb-2">Top Suggestions</div>
            <div className="space-y-1">
              {item.analysis.suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="text-xs text-gray-600">
                  • {suggestion.description}
                </div>
              ))}
              {item.analysis.suggestions.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{item.analysis.suggestions.length - 3} more suggestions
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => handleDownloadItem(item.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          JSON
        </button>
        <button
          onClick={() => handleDownloadItemAsCSV(item.id)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition flex items-center gap-1"
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
        <button
          onClick={() => handleDeleteItem(item.id)}
          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );

  const handleExport = () => {
    const selectedItemsToExport = selectedItems.size > 0 
      ? filteredItems.filter(item => selectedItems.has(item.id))
      : filteredItems;

    let csvContent = '';
    let rowIndex = 1;

    selectedItemsToExport.forEach((item) => {
      switch (item.type) {
        case 'qa':
          const qaItem = item as QAHistoryItem;
          // Add session header
          csvContent += `\n=== Q&A SESSION: ${qaItem.name} ===\n`;
          csvContent += `Session ID,${qaItem.id}\n`;
          csvContent += `Timestamp,${new Date(qaItem.timestamp).toISOString()}\n`;
          csvContent += `Model,${qaItem.sessionData.model}\n`;
          csvContent += `Total Questions,${qaItem.sessionData.qaData.length}\n`;
          csvContent += `Total Cost,${qaItem.sessionData.statistics.totalCost}\n`;
          csvContent += `Average Accuracy,${qaItem.sessionData.statistics.avgAccuracy}%\n`;
          csvContent += `Blog Content,"${qaItem.sessionData.blogContent.replace(/"/g, '""')}"\n`;
          
          // Add questions and answers
          csvContent += `\nQuestion,Answer,Accuracy,Sentiment,Geo Score,Citation Likelihood,Input Tokens,Output Tokens,Total Tokens,Cost\n`;
          qaItem.sessionData.qaData.forEach((qa, qaIndex) => {
            csvContent += `"${qa.question.replace(/"/g, '""')}","${qa.answer.replace(/"/g, '""')}",${qa.accuracy}%,${qa.sentiment},${qa.geoScore},${qa.citationLikelihood},${qa.inputTokens},${qa.outputTokens},${qa.totalTokens},$${qa.cost}\n`;
          });
          break;

        case 'ai-visibility':
          const aiItem = item as AIVisibilityHistoryItem;
          csvContent += `\n=== AI VISIBILITY ANALYSIS: ${aiItem.name} ===\n`;
          csvContent += `Company,${aiItem.company}\n`;
          csvContent += `Industry,${aiItem.industry || 'N/A'}\n`;
          csvContent += `Timestamp,${new Date(aiItem.timestamp).toISOString()}\n`;
          csvContent += `Overall Score,${aiItem.analysis.overallScore}\n`;
          csvContent += `Content Quality,${aiItem.analysis.contentQuality}\n`;
          csvContent += `Technical SEO,${aiItem.analysis.technicalSEO}\n`;
          csvContent += `User Experience,${aiItem.analysis.userExperience}\n`;
          csvContent += `Competitive Position,${aiItem.analysis.competitivePosition}\n`;
          
          // Add competitors
          csvContent += `\nCompetitors Found:\n`;
          csvContent += `Competitor Name,Website,Relevance Score,Strengths,Weaknesses\n`;
          aiItem.analysis.competitors.forEach(competitor => {
            csvContent += `"${competitor.name}","${competitor.website}",${competitor.relevanceScore},"${competitor.strengths.join('; ').replace(/"/g, '""')}","${competitor.weaknesses.join('; ').replace(/"/g, '""')}"\n`;
          });
          
          // Add recommendations
          csvContent += `\nRecommendations:\n`;
          csvContent += `Priority,Recommendation,Impact,Effort\n`;
          aiItem.analysis.recommendations.forEach(rec => {
            csvContent += `${rec.priority},"${rec.recommendation.replace(/"/g, '""')}",${rec.impact},${rec.effort}\n`;
          });
          break;

        case 'content-analysis':
          const contentItem = item as ContentAnalysisHistoryItem;
          csvContent += `\n=== CONTENT ANALYSIS: ${contentItem.name} ===\n`;
          csvContent += `URL,${contentItem.url || 'N/A'}\n`;
          csvContent += `Timestamp,${new Date(contentItem.timestamp).toISOString()}\n`;
          csvContent += `SEO Score,${contentItem.analysis.seoScore}\n`;
          csvContent += `Readability Score,${contentItem.analysis.readabilityScore}\n`;
          csvContent += `Content Length,${contentItem.analysis.contentLength} words\n`;
          csvContent += `Keyword Density,${contentItem.analysis.keywordDensity}%\n`;
          
          // Add content
          csvContent += `\nAnalyzed Content:\n`;
          csvContent += `"${contentItem.content.replace(/"/g, '""')}"\n`;
          
          // Add suggestions
          csvContent += `\nSuggestions:\n`;
          csvContent += `Category,Suggestion,Priority\n`;
          contentItem.analysis.suggestions.forEach(suggestion => {
            csvContent += `${suggestion.category},"${suggestion.suggestion.replace(/"/g, '""')}",${suggestion.priority}\n`;
          });
          break;

        case 'structure-analysis':
          const structureItem = item as StructureAnalysisHistoryItem;
          csvContent += `\n=== STRUCTURE ANALYSIS: ${structureItem.name} ===\n`;
          csvContent += `Timestamp,${new Date(structureItem.timestamp).toISOString()}\n`;
          csvContent += `Original Content Length,${structureItem.originalContent.length} characters\n`;
          csvContent += `Structured Content Length,${structureItem.structuredContent.length} characters\n`;
          
          // Add scores
          csvContent += `\nAnalysis Scores:\n`;
          csvContent += `SEO Score,${structureItem.analysis.seoScore}\n`;
          csvContent += `LLM Optimization Score,${structureItem.analysis.llmOptimizationScore}\n`;
          csvContent += `Readability Score,${structureItem.analysis.readabilityScore}\n`;
          
          // Add metadata
          csvContent += `\nContent Metadata:\n`;
          csvContent += `Title,${structureItem.analysis.metadata.title}\n`;
          csvContent += `Description,${structureItem.analysis.metadata.description}\n`;
          csvContent += `Keywords,"${structureItem.analysis.metadata.keywords.join(', ')}"\n`;
          csvContent += `Author,${structureItem.analysis.metadata.author}\n`;
          csvContent += `Publish Date,${structureItem.analysis.metadata.publishDate}\n`;
          csvContent += `Last Modified,${structureItem.analysis.metadata.lastModified}\n`;
          csvContent += `Reading Time,${structureItem.analysis.metadata.readingTime} minutes\n`;
          csvContent += `Word Count,${structureItem.analysis.metadata.wordCount}\n`;
          csvContent += `Language,${structureItem.analysis.metadata.language}\n`;
          
          // Add original content
          csvContent += `\nOriginal Content:\n`;
          csvContent += `"${structureItem.originalContent.replace(/"/g, '""')}"\n`;
          
          // Add structured content
          csvContent += `\nStructured Content:\n`;
          csvContent += `"${structureItem.structuredContent.replace(/"/g, '""')}"\n`;
          
          // Add detailed suggestions
          csvContent += `\nStructure Suggestions:\n`;
          csvContent += `Type,Priority,Description,Implementation,Impact\n`;
          structureItem.analysis.suggestions.forEach(suggestion => {
            csvContent += `${suggestion.type},${suggestion.priority},"${suggestion.description.replace(/"/g, '""')}","${suggestion.implementation.replace(/"/g, '""')}","${suggestion.impact.replace(/"/g, '""')}"\n`;
          });
          break;

        default:
          csvContent += `\n=== UNKNOWN TYPE: ${item.name} ===\n`;
          csvContent += `ID,${item.id}\n`;
          csvContent += `Type,${item.type}\n`;
          csvContent += `Status,${item.status}\n`;
          csvContent += `Timestamp,${new Date(item.timestamp).toISOString()}\n`;
          csvContent += `Description,${item.description || 'N/A'}\n`;
      }
      
      csvContent += '\n' + '='.repeat(80) + '\n';
    });
    
    const header = 'COMPREHENSIVE HISTORY EXPORT\n';
    const exportTime = `Export Date: ${new Date().toISOString()}\n`;
    const totalItems = `Total Items: ${selectedItemsToExport.length}\n`;
    
    onExport(header + exportTime + totalItems + csvContent, 'comprehensive-history-detailed.csv', 'text/csv');
  };

  const handleDownloadItem = (itemId: string) => {
    console.log('[History] Downloading item:', itemId);
    try {
      const exportData = historyService.exportHistoryItem(itemId);
      if (exportData && exportData.content) {
        console.log('[History] Export data:', exportData);
        onExport(exportData.content, exportData.filename, exportData.mimeType);
      } else {
        console.error('[History] No export data found for item:', itemId);
        alert('No data found for this item. It might be sample data or corrupted.');
      }
    } catch (error) {
      console.error('[History] Error downloading item:', error);
      alert('Error downloading item. Please try again.');
    }
  };

  const handleDownloadItemAsCSV = (itemId: string) => {
    console.log('[History] Downloading item as CSV:', itemId);
    const items = historyService.getHistoryItems();
    const item = items.find(item => item.id === itemId);
    
    if (!item) {
      alert('Item not found!');
      return;
    }

    let csvContent = '';
    
    switch (item.type) {
      case 'qa':
        const qaItem = item as QAHistoryItem;
        csvContent += `Q&A Session Export\n`;
        csvContent += `Session Name,${qaItem.name}\n`;
        csvContent += `Session ID,${qaItem.id}\n`;
        csvContent += `Timestamp,${new Date(qaItem.timestamp).toISOString()}\n`;
        csvContent += `Model,${qaItem.sessionData.model}\n`;
        csvContent += `Total Questions,${qaItem.sessionData.qaData.length}\n`;
        csvContent += `Total Cost,${qaItem.sessionData.statistics.totalCost}\n`;
        csvContent += `Average Accuracy,${qaItem.sessionData.statistics.avgAccuracy}%\n`;
        csvContent += `Blog Content,"${qaItem.sessionData.blogContent.replace(/"/g, '""')}"\n\n`;
        
        csvContent += `Question,Answer,Accuracy,Sentiment,Geo Score,Citation Likelihood,Input Tokens,Output Tokens,Total Tokens,Cost\n`;
        qaItem.sessionData.qaData.forEach((qa, index) => {
          csvContent += `"${qa.question.replace(/"/g, '""')}","${qa.answer.replace(/"/g, '""')}",${qa.accuracy}%,${qa.sentiment},${qa.geoScore},${qa.citationLikelihood},${qa.inputTokens},${qa.outputTokens},${qa.totalTokens},$${qa.cost}\n`;
        });
        break;

      case 'ai-visibility':
        const aiItem = item as AIVisibilityHistoryItem;
        csvContent += `AI Visibility Analysis Export\n`;
        csvContent += `Analysis Name,${aiItem.name}\n`;
        csvContent += `Company,${aiItem.company}\n`;
        csvContent += `Industry,${aiItem.industry || 'N/A'}\n`;
        csvContent += `Timestamp,${new Date(aiItem.timestamp).toISOString()}\n`;
        csvContent += `Overall Score,${aiItem.analysis.overallScore}\n`;
        csvContent += `Content Quality,${aiItem.analysis.contentQuality}\n`;
        csvContent += `Technical SEO,${aiItem.analysis.technicalSEO}\n`;
        csvContent += `User Experience,${aiItem.analysis.userExperience}\n`;
        csvContent += `Competitive Position,${aiItem.analysis.competitivePosition}\n\n`;
        
        csvContent += `Competitors:\n`;
        csvContent += `Name,Website,Relevance Score,Strengths,Weaknesses\n`;
        aiItem.analysis.competitors.forEach(comp => {
          csvContent += `"${comp.name}","${comp.website}",${comp.relevanceScore},"${comp.strengths.join('; ').replace(/"/g, '""')}","${comp.weaknesses.join('; ').replace(/"/g, '""')}"\n`;
        });
        
        csvContent += `\nRecommendations:\n`;
        csvContent += `Priority,Recommendation,Impact,Effort\n`;
        aiItem.analysis.recommendations.forEach(rec => {
          csvContent += `${rec.priority},"${rec.recommendation.replace(/"/g, '""')}",${rec.impact},${rec.effort}\n`;
        });
        break;

      case 'content-analysis':
        const contentItem = item as ContentAnalysisHistoryItem;
        csvContent += `Content Analysis Export\n`;
        csvContent += `Analysis Name,${contentItem.name}\n`;
        csvContent += `URL,${contentItem.url || 'N/A'}\n`;
        csvContent += `Timestamp,${new Date(contentItem.timestamp).toISOString()}\n`;
        csvContent += `SEO Score,${contentItem.analysis.seoScore}\n`;
        csvContent += `Readability Score,${contentItem.analysis.readabilityScore}\n`;
        csvContent += `Content Length,${contentItem.analysis.contentLength} words\n`;
        csvContent += `Keyword Density,${contentItem.analysis.keywordDensity}%\n\n`;
        
        csvContent += `Analyzed Content:\n`;
        csvContent += `"${contentItem.content.replace(/"/g, '""')}"\n\n`;
        
        csvContent += `Suggestions:\n`;
        csvContent += `Category,Suggestion,Priority\n`;
        contentItem.analysis.suggestions.forEach(sug => {
          csvContent += `${sug.category},"${sug.suggestion.replace(/"/g, '""')}",${sug.priority}\n`;
        });
        break;

      case 'structure-analysis':
        const structureItem = item as StructureAnalysisHistoryItem;
        csvContent += `Structure Analysis Export\n`;
        csvContent += `Analysis Name,${structureItem.name}\n`;
        csvContent += `Timestamp,${new Date(structureItem.timestamp).toISOString()}\n`;
        csvContent += `Original Content Length,${structureItem.originalContent.length} characters\n`;
        csvContent += `Structured Content Length,${structureItem.structuredContent.length} characters\n\n`;
        
        // Add scores
        csvContent += `Analysis Scores:\n`;
        csvContent += `SEO Score,${structureItem.analysis.seoScore}\n`;
        csvContent += `LLM Optimization Score,${structureItem.analysis.llmOptimizationScore}\n`;
        csvContent += `Readability Score,${structureItem.analysis.readabilityScore}\n\n`;
        
        // Add metadata
        csvContent += `Content Metadata:\n`;
        csvContent += `Title,${structureItem.analysis.metadata.title}\n`;
        csvContent += `Description,${structureItem.analysis.metadata.description}\n`;
        csvContent += `Keywords,"${structureItem.analysis.metadata.keywords.join(', ')}"\n`;
        csvContent += `Author,${structureItem.analysis.metadata.author}\n`;
        csvContent += `Publish Date,${structureItem.analysis.metadata.publishDate}\n`;
        csvContent += `Last Modified,${structureItem.analysis.metadata.lastModified}\n`;
        csvContent += `Reading Time,${structureItem.analysis.metadata.readingTime} minutes\n`;
        csvContent += `Word Count,${structureItem.analysis.metadata.wordCount}\n`;
        csvContent += `Language,${structureItem.analysis.metadata.language}\n\n`;
        
        csvContent += `Original Content:\n`;
        csvContent += `"${structureItem.originalContent.replace(/"/g, '""')}"\n\n`;
        
        csvContent += `Structured Content:\n`;
        csvContent += `"${structureItem.structuredContent.replace(/"/g, '""')}"\n\n`;
        
        // Add detailed suggestions
        csvContent += `Structure Suggestions:\n`;
        csvContent += `Type,Priority,Description,Implementation,Impact\n`;
        structureItem.analysis.suggestions.forEach(suggestion => {
          csvContent += `${suggestion.type},${suggestion.priority},"${suggestion.description.replace(/"/g, '""')}","${suggestion.implementation.replace(/"/g, '""')}","${suggestion.impact.replace(/"/g, '""')}"\n`;
        });
        break;

      default:
        csvContent += `Unknown Type Export\n`;
        csvContent += `Name,${item.name}\n`;
        csvContent += `Type,${item.type}\n`;
        csvContent += `Status,${item.status}\n`;
        csvContent += `Timestamp,${new Date(item.timestamp).toISOString()}\n`;
        csvContent += `Description,${item.description || 'N/A'}\n`;
    }
    
    const filename = `${item.type}-${item.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date(item.timestamp).toISOString().split('T')[0]}.csv`;
    onExport(csvContent, filename, 'text/csv');
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this history item? This action cannot be undone.')) {
      historyService.deleteHistoryItem(itemId);
      setRefreshKey(prev => prev + 1);
    }
  };



  const handleExportAllHistory = () => {
    const exportData = historyService.exportAllHistory();
    onExport(exportData.content, exportData.filename, exportData.mimeType);
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

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'date':
        return <CalendarDays className="h-4 w-4" />;
      case 'type':
        return <Tag className="h-4 w-4" />;
      case 'status':
        return <Activity className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      

      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary mb-4">Comprehensive History</h1>
        <p className="text-gray-600">View and manage all your analysis history including Q&A, AI visibility, content analysis, and structure analysis</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">Total Items</div>
          <div className="text-3xl font-extrabold">{filteredItems.length}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">Q&A Sessions</div>
          <div className="text-3xl font-extrabold">
            {filteredItems.filter(item => item.type === 'qa').length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">AI Visibility</div>
          <div className="text-3xl font-extrabold">
            {filteredItems.filter(item => item.type === 'ai-visibility').length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="text-lg font-bold">Selected Items</div>
          <div className="text-3xl font-extrabold">{selectedItems.size}</div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-black/10 text-black text-center">
          <div className="space-y-2">
          <button 
            onClick={handleExport} 
            className="bg-black text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-800 transition flex items-center gap-2 mx-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
            <button 
              onClick={handleExportAllHistory} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <Download className="h-4 w-4" />
              Export All JSON
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('comprehensive_history');
                setHistoryItems([]);
                setFilteredItems([]);
                setGroupedItems([]);
                alert('History cleared. Please refresh the page.');
              }}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg font-bold shadow hover:bg-orange-700 transition flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Reset History
            </button>

          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-black/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Organization
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 transition"
            >
              {filters.showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {filters.showFilters ? 'Hide' : 'Show'} Filters
            </button>

            <button
              onClick={() => {
                console.log('[History] Manual refresh triggered');
                const items = historyService.getHistoryItems();
                setHistoryItems(items);
                setRefreshKey(prev => prev + 1);
              }}
              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Group by:</span>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value as 'date' | 'type' | 'status' }))}
                className="text-sm border-0 bg-transparent text-blue-700 font-medium focus:ring-0 focus:outline-none"
              >
                <option value="date">Date</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {filters.showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all analysis..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFilter: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Type</label>
              <select
                value={filters.typeFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, typeFilter: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {filterOptions.types.map(type => (
                  <option key={type} value={type}>{getTypeDisplayName(type)}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.statusFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'name' | 'type' | 'status' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grouped Items */}
      <div className="space-y-6">
        {groupedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-black/10">
            <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No history found</h3>
            <p className="text-gray-500">Try adjusting your filters or create some analysis first.</p>
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.groupKey} className="bg-white rounded-lg border border-black/10 overflow-hidden">
              {/* Group Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
                onClick={() => toggleGroup(group.groupKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getGroupIcon(group.groupType)}
                    <div>
                      <h3 className="text-lg font-bold text-black">{group.groupTitle}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{group.items.length} items</span>
                        <span>{group.totalItems} total</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedGroups.has(group.groupKey) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Group Content */}
              {expandedGroups.has(group.groupKey) && (
                <div className="p-6 space-y-4">
                  {group.items.map((item) => {
                    try {
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          {renderHistoryItem(item)}
                        </div>
                      );
                    } catch (error) {
                      console.error('[History] Error rendering item in group:', error, item);
                      return (
                        <div key={item.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                          <div className="text-red-600">Error rendering item: {error.message}</div>
                          <div className="text-xs text-red-500 mt-2">Item ID: {item.id}</div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 