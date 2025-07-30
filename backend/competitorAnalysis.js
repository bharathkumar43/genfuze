const axios = require('axios');
const unfluff = require('unfluff');
const cheerio = require('cheerio');

class CompetitorAnalysisService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async analyzeCompetitor(domain, userContent = '') {
    if (!domain) {
      console.error('[Competitor Analysis] analyzeCompetitor called with missing domain:', domain);
      return {
        success: false,
        domain: domain,
        error: 'Missing domain for competitor analysis.'
      };
    }
    try {
      console.log(`[Competitor Analysis] Starting analysis for domain: ${domain}`);
      
      // Normalize domain
      const normalizedDomain = this.normalizeDomain(domain);
      const url = `https://${normalizedDomain}`;
      
      // Extract content from competitor website
      const competitorContent = await this.extractWebsiteContent(url);
      
      if (!competitorContent || !competitorContent.text) {
        throw new Error('Failed to extract content from competitor website');
      }

      // Analyze the content
      const analysis = await this.analyzeContent(competitorContent.text, competitorContent.html, userContent);
      
      return {
        success: true,
        domain: normalizedDomain,
        url: url,
        analysis: analysis,
        contentLength: competitorContent.text.length,
        title: competitorContent.title,
        description: competitorContent.description,
        headings: competitorContent.headings,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`[Competitor Analysis] Error analyzing ${domain}:`, error);
      return {
        success: false,
        domain: domain,
        error: error.message
      };
    }
  }

  normalizeDomain(domain) {
    // Remove protocol if present
    let normalized = domain.replace(/^https?:\/\//, '');
    // Remove www if present
    normalized = normalized.replace(/^www\./, '');
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  }

  async extractWebsiteContent(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const html = response.data;
      const data = unfluff(html);
      // Extract headings using cheerio
      const $ = cheerio.load(html);
      const headings = [];
      for (let i = 1; i <= 6; i++) {
        $(`h${i}`).each((_, el) => {
          headings.push({ tag: `h${i}`, text: $(el).text().trim() });
        });
      }
      return {
        text: data.text || '',
        title: data.title || '',
        description: data.description || '',
        html: html,
        headings: headings
      };
    } catch (error) {
      console.error(`[Competitor Analysis] Failed to extract content from ${url}:`, error.message);
      throw new Error(`Failed to access website: ${error.message}`);
    }
  }

  async analyzeContent(text, html, userContent = '') {
    const analysis = {
      contentQuality: this.calculateContentQuality(text),
      seoScore: this.calculateSEOScore(html, text),
      readabilityScore: this.calculateReadabilityScore(text),
      keywordDensity: this.calculateKeywordDensity(text),
      contentLength: text.length,
      wordCount: this.getWordCount(text),
      averageSentenceLength: this.getAverageSentenceLength(text),
      averageWordLength: this.getAverageWordLength(text)
    };

    // If user content is provided, add comparison metrics
    if (userContent) {
      analysis.comparison = this.compareWithUserContent(text, userContent);
    }

    return analysis;
  }

  calculateContentQuality(text) {
    if (!text || text.length === 0) return 0;

    let score = 0;
    const wordCount = this.getWordCount(text);
    
    // Content length score (0-25 points)
    if (wordCount >= 1000) score += 25;
    else if (wordCount >= 500) score += 20;
    else if (wordCount >= 300) score += 15;
    else if (wordCount >= 100) score += 10;
    else score += 5;

    // Sentence structure score (0-25 points)
    const avgSentenceLength = this.getAverageSentenceLength(text);
    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) score += 25;
    else if (avgSentenceLength >= 8 && avgSentenceLength <= 25) score += 20;
    else if (avgSentenceLength >= 5 && avgSentenceLength <= 30) score += 15;
    else score += 10;

    // Word variety score (0-25 points)
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size;
    const wordVariety = uniqueWords / wordCount;
    if (wordVariety >= 0.6) score += 25;
    else if (wordVariety >= 0.5) score += 20;
    else if (wordVariety >= 0.4) score += 15;
    else score += 10;

    // Readability score (0-25 points)
    const readability = this.calculateReadabilityScore(text);
    score += Math.round(readability * 0.25);

    return Math.min(100, Math.max(0, score));
  }

  calculateSEOScore(html, text) {
    if (!html || !text) return 0;

    let score = 0;
    const $ = cheerio.load(html);
    
    // Title tag (0-20 points)
    const title = $('title').text().trim();
    if (title && title.length >= 30 && title.length <= 60) score += 20;
    else if (title && title.length >= 10 && title.length <= 70) score += 15;
    else if (title) score += 10;

    // Meta description (0-15 points)
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.length >= 120 && metaDesc.length <= 160) score += 15;
    else if (metaDesc && metaDesc.length >= 50 && metaDesc.length <= 200) score += 10;
    else if (metaDesc) score += 5;

    // Heading structure (0-20 points)
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    if (h1Count === 1) score += 10;
    else if (h1Count > 0) score += 5;
    
    if (h2Count > 0) score += 5;
    if (h3Count > 0) score += 5;

    // Content length (0-15 points)
    const wordCount = this.getWordCount(text);
    if (wordCount >= 1000) score += 15;
    else if (wordCount >= 500) score += 12;
    else if (wordCount >= 300) score += 8;
    else if (wordCount >= 100) score += 5;

    // Internal links (0-10 points)
    const internalLinks = $('a[href^="/"]').length;
    if (internalLinks >= 5) score += 10;
    else if (internalLinks >= 2) score += 5;

    // Images with alt text (0-10 points)
    const images = $('img');
    const imagesWithAlt = $('img[alt]').length;
    if (images.length > 0) {
      const altPercentage = (imagesWithAlt / images.length) * 100;
      if (altPercentage >= 80) score += 10;
      else if (altPercentage >= 50) score += 5;
    }

    // Keyword density (0-10 points)
    const keywordDensity = this.calculateKeywordDensity(text);
    if (keywordDensity >= 1 && keywordDensity <= 3) score += 10;
    else if (keywordDensity >= 0.5 && keywordDensity <= 5) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  calculateReadabilityScore(text) {
    if (!text || text.length === 0) return 0;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.match(/\b\w+\b/g) || [];
    const syllables = this.countSyllables(text);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Calculate Flesch Reading Ease
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert to 0-100 scale
    if (fleschScore >= 90) return 100;
    else if (fleschScore >= 80) return 95;
    else if (fleschScore >= 70) return 90;
    else if (fleschScore >= 60) return 85;
    else if (fleschScore >= 50) return 80;
    else if (fleschScore >= 30) return 70;
    else if (fleschScore >= 0) return 60;
    else return 50;
  }

  calculateKeywordDensity(text) {
    if (!text || text.length === 0) return 0;

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    // Get most common words (excluding stop words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs']);

    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Get top keywords
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    if (sortedWords.length === 0) return 0;

    // Calculate average density of top keywords
    const totalDensity = sortedWords.reduce((sum, [, count]) => {
      return sum + (count / words.length) * 100;
    }, 0);

    return Math.round((totalDensity / sortedWords.length) * 100) / 100;
  }

  countSyllables(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let syllableCount = 0;

    words.forEach(word => {
      syllableCount += this.countWordSyllables(word);
    });

    return syllableCount;
  }

  countWordSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  getWordCount(text) {
    if (!text) return 0;
    const words = text.match(/\b\w+\b/g) || [];
    return words.length;
  }

  getAverageSentenceLength(text) {
    if (!text) return 0;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.getWordCount(text);
    return sentences.length > 0 ? Math.round((words / sentences.length) * 10) / 10 : 0;
  }

  getAverageWordLength(text) {
    if (!text) return 0;
    const words = text.match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;
    
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return Math.round((totalLength / words.length) * 10) / 10;
  }

  compareWithUserContent(competitorText, userContent) {
    const userWordCount = this.getWordCount(userContent);
    const competitorWordCount = this.getWordCount(competitorText);
    
    return {
      contentLengthRatio: userWordCount > 0 ? Math.round((competitorWordCount / userWordCount) * 100) / 100 : 0,
      userWordCount,
      competitorWordCount,
      difference: competitorWordCount - userWordCount
    };
  }

  async analyzeMultipleCompetitors(domains, userContent = '') {
    const results = [];
    
    for (const domain of domains) {
      try {
        const result = await this.analyzeCompetitor(domain, userContent);
        results.push(result);
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Competitor Analysis] Error analyzing ${domain}:`, error);
        results.push({
          success: false,
          domain: domain,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = CompetitorAnalysisService; 