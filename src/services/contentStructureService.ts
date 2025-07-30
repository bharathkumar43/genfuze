import { apiService } from './apiService';

export interface ContentStructureAnalysis {
  originalContent: string;
  structuredContent: string;
  seoScore: number;
  llmOptimizationScore: number;
  readabilityScore: number;
  suggestions: StructureSuggestion[];
  metadata: ContentMetadata;
  structuredData: StructuredData;
}

export interface StructureSuggestion {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'quote' | 'code' | 'link' | 'image' | 'schema';
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementation: string;
  impact: string;
}

export interface ContentMetadata {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  publishDate: string;
  lastModified: string;
  readingTime: number;
  wordCount: number;
  language: string;
}

export interface StructuredData {
  faqSchema?: FAQSchema;
  articleSchema?: ArticleSchema;
  howToSchema?: HowToSchema;
  breadcrumbSchema?: BreadcrumbSchema;
}

export interface FAQSchema {
  '@context': string;
  '@type': string;
  mainEntity: FAQItem[];
}

export interface FAQItem {
  '@type': string;
  name: string;
  acceptedAnswer: {
    '@type': string;
    text: string;
  };
}

export interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
}

export interface HowToSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  step: HowToStep[];
}

export interface HowToStep {
  '@type': string;
  name: string;
  text: string;
  url?: string;
  image?: string;
}

export interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  '@type': string;
  position: number;
  name: string;
  item: string;
}

class ContentStructureService {
  async analyzeContentStructure(content: string, url?: string): Promise<ContentStructureAnalysis> {
    try {
      // Use the API service for content analysis
      const response = await apiService.analyzeContentStructure(content, url);
      
      if (response.success) {
        return response.analysis;
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing content structure:', error);
      throw new Error('Failed to analyze content structure');
    }
  }



  async applyStructureSuggestions(content: string, suggestions: StructureSuggestion[]): Promise<string> {
    try {
      const response = await apiService.applyStructureSuggestions(content, suggestions);
      
      if (response.success) {
        return response.improvedContent;
      } else {
        throw new Error(response.error || 'Failed to apply suggestions');
      }
    } catch (error) {
      console.error('Error applying structure suggestions:', error);
      return content;
    }
  }


}

export const contentStructureService = new ContentStructureService(); 