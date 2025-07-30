import { HistoryItem, QAHistoryItem, AIVisibilityHistoryItem, ContentAnalysisHistoryItem, StructureAnalysisHistoryItem, SessionData } from '../types';

const HISTORY_KEY = 'comprehensive_history';

export interface HistoryService {
  addHistoryItem: (item: HistoryItem) => void;
  getHistoryItems: () => HistoryItem[];
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  exportHistoryItem: (id: string) => { content: string; filename: string; mimeType: string } | null;
  exportAllHistory: () => { content: string; filename: string; mimeType: string };
}

class LocalHistoryService implements HistoryService {
  private getHistoryFromStorage(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading history from storage:', error);
      return [];
    }
  }

  private saveHistoryToStorage(items: HistoryItem[]): void {
    try {
      console.log('[HistoryService] Saving to storage:', items.length, 'items');
      console.log('[HistoryService] Items being saved:', items);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
      console.log('[HistoryService] Successfully saved to localStorage');
    } catch (error) {
      console.error('Error saving history to storage:', error);
    }
  }

  addHistoryItem(item: HistoryItem): void {
    console.log('[HistoryService] Adding history item:', item);
    const items = this.getHistoryFromStorage();
    // Check if item already exists (by ID)
    const existingIndex = items.findIndex(existing => existing.id === item.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      items[existingIndex] = item;
      console.log('[HistoryService] Updated existing item');
    } else {
      // Add new item at the beginning
      items.unshift(item);
      console.log('[HistoryService] Added new item, total items:', items.length);
    }
    
    this.saveHistoryToStorage(items);
  }

  getHistoryItems(): HistoryItem[] {
    const items = this.getHistoryFromStorage();
    console.log('[HistoryService] Getting history items:', items.length, 'items');
    
    // Filter out any sample data (items with 'sample-' prefix)
    const realItems = items.filter(item => !item.id.startsWith('sample-'));
    
    if (realItems.length !== items.length) {
      console.log('[HistoryService] Filtered out sample data, keeping only real items:', realItems.length);
      this.saveHistoryToStorage(realItems);
    }
    
    return realItems;
  }

  clearHistory(): void {
    this.saveHistoryToStorage([]);
  }

  clearSampleData(): void {
    const items = this.getHistoryFromStorage();
    const realItems = items.filter(item => !item.id.startsWith('sample-'));
    this.saveHistoryToStorage(realItems);
    console.log('[HistoryService] Cleared sample data, kept', realItems.length, 'real items');
  }

  deleteHistoryItem(id: string): void {
    const items = this.getHistoryFromStorage();
    const filteredItems = items.filter(item => item.id !== id);
    this.saveHistoryToStorage(filteredItems);
  }

  exportHistoryItem(id: string): { content: string; filename: string; mimeType: string } | null {
    try {
      console.log('[HistoryService] Exporting item:', id);
      const items = this.getHistoryFromStorage();
      console.log('[HistoryService] All items:', items);
      const item = items.find(item => item.id === id);
      
      if (!item) {
        console.error('[HistoryService] Item not found:', id);
        return null;
      }

      console.log('[HistoryService] Found item:', item);
      const content = this.formatHistoryItemForExport(item);
      console.log('[HistoryService] Formatted content:', content);
      
      if (!content) {
        console.error('[HistoryService] Failed to format content for item:', id);
        return null;
      }
      
      const filename = `${item.type}-${item.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date(item.timestamp).toISOString().split('T')[0]}.json`;
      
      const jsonContent = JSON.stringify(content, null, 2);
      console.log('[HistoryService] JSON content length:', jsonContent.length);
      
      return {
        content: jsonContent,
        filename,
        mimeType: 'application/json'
      };
    } catch (error) {
      console.error('[HistoryService] Error exporting item:', id, error);
      return null;
    }
  }

  exportAllHistory(): { content: string; filename: string; mimeType: string } {
    const items = this.getHistoryFromStorage();
    const exportData = {
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      items: items.map(item => this.formatHistoryItemForExport(item))
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      filename: `genfuze-history-export-${new Date().toISOString().split('T')[0]}.json`,
      mimeType: 'application/json'
    };
  }

  private formatHistoryItemForExport(item: HistoryItem): any {
    const baseExport = {
      id: item.id,
      type: item.type,
      name: item.name,
      timestamp: item.timestamp,
      status: item.status,
      description: item.description,
      exportDate: new Date().toISOString()
    };

    switch (item.type) {
      case 'qa':
        const qaItem = item as QAHistoryItem;
        return {
          ...baseExport,
          sessionInfo: {
            id: qaItem.sessionData.id,
            model: qaItem.sessionData.model,
            blogContent: qaItem.sessionData.blogContent,
            totalInputTokens: qaItem.sessionData.totalInputTokens,
            totalOutputTokens: qaItem.sessionData.totalOutputTokens
          },
          statistics: qaItem.sessionData.statistics,
          questionsAndAnswers: qaItem.sessionData.qaData.map((qa, index) => ({
            questionNumber: index + 1,
            question: qa.question,
            answer: qa.answer,
            accuracy: qa.accuracy,
            sentiment: qa.sentiment,
            geoScore: qa.geoScore,
            citationLikelihood: qa.citationLikelihood,
            inputTokens: qa.inputTokens,
            outputTokens: qa.outputTokens,
            totalTokens: qa.totalTokens,
            cost: qa.cost
          }))
        };

      case 'ai-visibility':
        const aiItem = item as AIVisibilityHistoryItem;
        return {
          ...baseExport,
          company: aiItem.company,
          industry: aiItem.industry,
          analysis: {
            overallScore: aiItem.analysis.overallScore,
            contentQuality: aiItem.analysis.contentQuality,
            technicalSEO: aiItem.analysis.technicalSEO,
            userExperience: aiItem.analysis.userExperience,
            competitivePosition: aiItem.analysis.competitivePosition,
            competitors: aiItem.analysis.competitors.map(comp => ({
              name: comp.name,
              website: comp.website,
              relevanceScore: comp.relevanceScore,
              strengths: comp.strengths,
              weaknesses: comp.weaknesses
            })),
            recommendations: aiItem.analysis.recommendations.map(rec => ({
              priority: rec.priority,
              recommendation: rec.recommendation,
              impact: rec.impact,
              effort: rec.effort
            }))
          }
        };

      case 'content-analysis':
        const contentItem = item as ContentAnalysisHistoryItem;
        return {
          ...baseExport,
          url: contentItem.url,
          content: contentItem.content,
          analysis: {
            seoScore: contentItem.analysis.seoScore,
            readabilityScore: contentItem.analysis.readabilityScore,
            contentLength: contentItem.analysis.contentLength,
            keywordDensity: contentItem.analysis.keywordDensity,
            suggestions: contentItem.analysis.suggestions.map(sug => ({
              category: sug.category,
              suggestion: sug.suggestion,
              priority: sug.priority
            }))
          }
        };

      case 'structure-analysis':
        const structureItem = item as StructureAnalysisHistoryItem;
        return {
          ...baseExport,
          originalContent: structureItem.originalContent,
          structuredContent: structureItem.structuredContent,
          analysis: {
            seoScore: structureItem.analysis.seoScore,
            llmOptimizationScore: structureItem.analysis.llmOptimizationScore,
            readabilityScore: structureItem.analysis.readabilityScore,
            metadata: structureItem.analysis.metadata,
            suggestions: structureItem.analysis.suggestions.map(suggestion => ({
              type: suggestion.type,
              priority: suggestion.priority,
              description: suggestion.description,
              implementation: suggestion.implementation,
              impact: suggestion.impact
            }))
          }
        };

      default:
        return baseExport;
    }
  }

  // Helper methods for different page types
  addQAHistory(sessionData: SessionData): void {
    const qaItem: QAHistoryItem = {
      id: sessionData.id,
      type: 'qa',
      name: sessionData.name,
      timestamp: sessionData.timestamp,
      userId: sessionData.userId,
      status: 'completed',
      description: `Q&A session with ${sessionData.qaData.length} questions`,
      sessionData
    };
    this.addHistoryItem(qaItem);
  }

  addAIVisibilityHistory(data: {
    id: string;
    name: string;
    company: string;
    industry?: string;
    analysis: AIVisibilityHistoryItem['analysis'];
  }): void {
    const aiItem: AIVisibilityHistoryItem = {
      id: data.id,
      type: 'ai-visibility',
      name: data.name,
      timestamp: new Date().toISOString(),
      status: 'completed',
      description: `AI visibility analysis for ${data.company}`,
      company: data.company,
      industry: data.industry,
      analysis: data.analysis
    };
    this.addHistoryItem(aiItem);
  }

  addContentAnalysisHistory(data: {
    id: string;
    name: string;
    url?: string;
    content: string;
    analysis: ContentAnalysisHistoryItem['analysis'];
  }): void {
    const contentItem: ContentAnalysisHistoryItem = {
      id: data.id,
      type: 'content-analysis',
      name: data.name,
      timestamp: new Date().toISOString(),
      status: 'completed',
      description: `Content analysis for ${data.url || 'content'}`,
      url: data.url,
      content: data.content,
      analysis: data.analysis
    };
    this.addHistoryItem(contentItem);
  }

  addStructureAnalysisHistory(data: {
    id: string;
    name: string;
    originalContent: string;
    structuredContent: string;
    analysis: StructureAnalysisHistoryItem['analysis'];
  }): void {
    const structureItem: StructureAnalysisHistoryItem = {
      id: data.id,
      type: 'structure-analysis',
      name: data.name,
      timestamp: new Date().toISOString(),
      status: 'completed',
      description: 'Content structure analysis completed',
      originalContent: data.originalContent,
      structuredContent: data.structuredContent,
      analysis: data.analysis
    };
    this.addHistoryItem(structureItem);
  }
}

// Export singleton instance
export const historyService = new LocalHistoryService(); 