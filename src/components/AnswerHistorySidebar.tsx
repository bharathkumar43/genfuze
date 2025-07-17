import React, { useState, useEffect } from 'react';
import { SessionData } from '../types';
import { Filter, Calendar, Cpu, Link, ChevronDown, X, History as HistoryIcon } from 'lucide-react';

interface AnswerHistorySidebarProps {
  answerSessions: SessionData[];
  onLoadFilteredSessions?: (filters: {
    fromDate: string;
    toDate: string;
    llmProvider: string;
    llmModel: string;
    blogLink: string;
    search: string;
  }) => Promise<void>;
  onClearFilters?: () => void;
  isLoading?: boolean;
  currentFilters?: {
    fromDate: string;
    toDate: string;
    llmProvider: string;
    llmModel: string;
    blogLink: string;
    search: string;
  };
}

export function AnswerHistorySidebar({ 
  answerSessions, 
  onLoadFilteredSessions, 
  onClearFilters, 
  isLoading = false,
  currentFilters 
}: AnswerHistorySidebarProps) {
  const [filter, setFilter] = useState(currentFilters?.search || '');
  const [fromDate, setFromDate] = useState(currentFilters?.fromDate || '');
  const [toDate, setToDate] = useState(currentFilters?.toDate || '');
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // New filter states
  const [llmProviderFilter, setLlmProviderFilter] = useState(currentFilters?.llmProvider || '');
  const [llmModelFilter, setLlmModelFilter] = useState(currentFilters?.llmModel || '');

  // Update local state when currentFilters change
  useEffect(() => {
    if (currentFilters) {
      setFromDate(currentFilters.fromDate);
      setToDate(currentFilters.toDate);
      setLlmProviderFilter(currentFilters.llmProvider);
      setLlmModelFilter(currentFilters.llmModel);
      setFilter(currentFilters.search);
    }
  }, [currentFilters]);

  // Get unique providers and models for filter dropdowns
  const uniqueProviders = Array.from(new Set(
    answerSessions
      .map(s => s.answerProvider)
      .filter(Boolean)
  )).sort();

  const uniqueModels = Array.from(new Set(
    answerSessions
      .map(s => s.answerModel)
      .filter(Boolean)
  )).sort();

  const filteredSessions = answerSessions.filter(session => {
    const sessionDate = new Date(session.timestamp);
    const dateStr = sessionDate.toLocaleString();
    
    // Text filter (date/time)
    if (filter && !dateStr.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    
    // Date range filter
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      if (sessionDate < fromDateTime) {
        return false;
      }
    }
    
    if (toDate) {
      const toDateTime = new Date(toDate + 'T23:59:59'); // End of day
      if (sessionDate > toDateTime) {
        return false;
      }
    }

    // LLM Provider filter
    if (llmProviderFilter && session.answerProvider !== llmProviderFilter) {
      return false;
    }

    // LLM Model filter
    if (llmModelFilter && session.answerModel !== llmModelFilter) {
      return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilter('');
    setFromDate('');
    setToDate('');
    setLlmProviderFilter('');
    setLlmModelFilter('');
    setActiveFilter(null);
    
    // Call parent clear filters function if available
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const applyFilters = () => {
    if (onLoadFilteredSessions) {
      const newFilters = {
        fromDate,
        toDate,
        llmProvider: llmProviderFilter,
        llmModel: llmModelFilter,
        blogLink: '', // Not used for answer sessions
        search: filter
      };
      onLoadFilteredSessions(newFilters);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (fromDate || toDate) count++;
    if (llmProviderFilter) count++;
    if (llmModelFilter) count++;
    if (filter) count++;
    return count;
  };

  const renderFilterContent = () => {
    switch (activeFilter) {
      case 'date':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Date Range Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="px-2 py-1 border rounded text-xs flex-1"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="px-2 py-1 border rounded text-xs flex-1"
                  placeholder="To"
                />
              </div>
              <button
                onClick={() => setActiveFilter(null)}
                className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Apply Date Filter
              </button>
            </div>
          </div>
        );
      
      case 'provider':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">LLM Provider Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <select
                value={llmProviderFilter}
                onChange={e => setLlmProviderFilter(e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs"
              >
                <option value="">All Providers</option>
                {uniqueProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              <button
                onClick={() => setActiveFilter(null)}
                className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Apply Provider Filter
              </button>
            </div>
          </div>
        );
      
      case 'model':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">LLM Model Filter</h4>
              <button
                onClick={() => setActiveFilter(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <select
                value={llmModelFilter}
                onChange={e => setLlmModelFilter(e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs"
              >
                <option value="">All Models</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <button
                onClick={() => setActiveFilter(null)}
                className="w-full px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Apply Model Filter
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <aside className="card w-80 h-full fixed left-0 top-0 z-40 backdrop-blur-md bg-black/90 border-r border-genfuze-green/60 shadow-xl flex flex-col">
      <div className="flex items-center gap-3 mb-4 p-4 border-b border-genfuze-green/30">
        <HistoryIcon className="w-6 h-6 text-genfuze-green" />
        <h2 className="text-xl font-bold text-genfuze-green">Answer History</h2>
      </div>
      
      {/* Filter Dropdown */}
      <div className="mb-4">
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFiltersCount()}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilterDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10">
              <div className="p-3">
                {activeFilter ? (
                  renderFilterContent()
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 mb-3">Select Filter Type</h4>
                    <button
                      onClick={() => setActiveFilter('date')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Date Range
                      {(fromDate || toDate) && <span className="ml-auto text-green-600">●</span>}
                    </button>
                    <button
                      onClick={() => setActiveFilter('provider')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                    >
                      <Cpu className="w-4 h-4" />
                      LLM Provider
                      {llmProviderFilter && <span className="ml-auto text-green-600">●</span>}
                    </button>
                    <button
                      onClick={() => setActiveFilter('model')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded text-sm"
                    >
                      <Cpu className="w-4 h-4" />
                      LLM Model
                      {llmModelFilter && <span className="ml-auto text-green-600">●</span>}
                    </button>
                    {getActiveFiltersCount() > 0 && (
                      <button
                        onClick={clearFilters}
                        className="w-full mt-2 px-3 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Filters Button */}
      {getActiveFiltersCount() > 0 && onLoadFilteredSessions && (
        <div className="mb-3">
          <button
            onClick={applyFilters}
            className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            Apply Filters ({getActiveFiltersCount()})
          </button>
        </div>
      )}

      {/* Text Filter */}
      <input
        type="text"
        placeholder="Filter by date/time..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="mb-3 px-3 py-2 border rounded w-full text-sm"
      />

      {!selectedSession ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredSessions.length === 0 && (
            <div className="text-gray-500 text-center py-4 text-sm">No answer sessions found.</div>
          )}
          {filteredSessions.map(session => (
            <div
              key={session.id}
              className="p-3 border rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
              onClick={() => setSelectedSession(session)}
            >
              <div className="font-medium text-green-700 text-sm">{session.name}</div>
              <div className="text-xs text-gray-500 mt-1">{new Date(session.timestamp).toLocaleString()}</div>
              
              {/* Source Information */}
              {session.sourceUrls && session.sourceUrls.length > 0 && (
                <div className="text-xs mt-1">
                  <div className="font-medium text-gray-700">Source URLs ({session.sourceUrls.length}):</div>
                  {session.sourceUrls.slice(0, 2).map((url, index) => (
                    <div key={index} className="truncate">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">
                        {url}
                      </a>
                    </div>
                  ))}
                  {session.sourceUrls.length > 2 && (
                    <div className="text-gray-500">+{session.sourceUrls.length - 2} more</div>
                  )}
                  {session.crawlMode && (
                    <div className="text-gray-600 mt-1">
                      {session.crawlMode === 'website' ? '🌐 Website Crawl' : '📄 Single Page'}
                      {session.crawledPages && session.crawledPages.length > 0 && (
                        <span className="ml-1">({session.crawledPages.length} pages)</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Legacy single URL support */}
              {session.blogUrl && !session.sourceUrls && (
                <div className="text-xs mt-1">
                  <a href={session.blogUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">Source Link</a>
                </div>
              )}
              
              <div className="text-xs text-gray-600 mt-1">
                {session.qaData.length} answers &bull; Total Cost: ${session.statistics.totalCost}
                {session.answerProvider && (
                  <span className="block mt-1">
                    Provider: {session.answerProvider}
                    {session.answerModel && ` (${session.answerModel})`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button
            className="mb-3 text-green-600 hover:underline text-sm"
            onClick={() => setSelectedSession(null)}
          >
            ← Back to Answer History
          </button>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <div className="text-sm font-semibold text-gray-800">{selectedSession.name}</div>
            <div className="text-xs text-gray-500">{new Date(selectedSession.timestamp).toLocaleString()}</div>
            
            {/* Source Information */}
            {selectedSession.sourceUrls && selectedSession.sourceUrls.length > 0 && (
              <div className="text-xs mt-1">
                <div className="font-medium text-gray-700 mb-1">Source URLs ({selectedSession.sourceUrls.length}):</div>
                {selectedSession.sourceUrls.map((url, index) => (
                  <div key={index} className="mb-1">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">
                      {url}
                    </a>
                  </div>
                ))}
                {selectedSession.crawlMode && (
                  <div className="text-gray-600 mt-1">
                    Crawl Mode: {selectedSession.crawlMode === 'website' ? '🌐 Website Crawl' : '📄 Single Page'}
                  </div>
                )}
                {selectedSession.crawledPages && selectedSession.crawledPages.length > 0 && (
                  <div className="text-gray-600 mt-1">
                    Crawled Pages: {selectedSession.crawledPages.length}
                  </div>
                )}
              </div>
            )}
            
            {/* Legacy single URL support */}
            {selectedSession.blogUrl && !selectedSession.sourceUrls && (
              <div className="text-xs">
                <a href={selectedSession.blogUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">{selectedSession.blogUrl}</a>
              </div>
            )}
            
            {selectedSession.answerProvider && (
              <div className="text-xs text-gray-600 mt-1">
                Provider: {selectedSession.answerProvider}
                {selectedSession.answerModel && ` (${selectedSession.answerModel})`}
              </div>
            )}
            {selectedSession.qaData.map((qa, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded border">
                <div className="text-sm font-medium text-gray-900">Q{idx + 1}: {qa.question}</div>
                {qa.answer && (
                  <div className="mt-1 text-gray-800"><span className="font-semibold">A:</span> {qa.answer}</div>
                )}
                <div className="text-xs text-gray-600 mt-1">
                  Output Tokens: {qa.outputTokens}
                  {qa.cost && <span className="ml-2 text-purple-600">API Cost: ${qa.cost.toFixed(8)}</span>}
                  {typeof qa.citationLikelihood === 'number' && (
                    <span className="ml-2 text-red-600">Citation: {qa.citationLikelihood}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
} 