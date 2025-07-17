const axios = require('axios');
const cheerio = require('cheerio');

class CompetitorDiscoveryService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async discoverCompetitors(domain, industry = null) {
    try {
      console.log(`[Competitor Discovery] Starting discovery for domain: ${domain}`);
      
      const competitors = [];
      
      // Method 1: Industry-based discovery
      if (industry) {
        const industryCompetitors = await this.findIndustryCompetitors(industry);
        competitors.push(...industryCompetitors);
      }
      
      // Method 2: Similar web analysis (simulated)
      const similarWebCompetitors = await this.findSimilarWebCompetitors(domain);
      competitors.push(...similarWebCompetitors);
      
      // Method 3: Search engine analysis
      const searchCompetitors = await this.findSearchEngineCompetitors(domain);
      competitors.push(...searchCompetitors);
      
      // Method 4: Social media analysis
      const socialCompetitors = await this.findSocialMediaCompetitors(domain);
      competitors.push(...socialCompetitors);
      
      // Remove duplicates and limit to top 10
      const uniqueCompetitors = this.removeDuplicates(competitors);
      const topCompetitors = uniqueCompetitors.slice(0, 10);
      
      console.log(`[Competitor Discovery] Found ${topCompetitors.length} competitors`);
      
      return {
        success: true,
        competitors: topCompetitors,
        totalFound: uniqueCompetitors.length
      };
      
    } catch (error) {
      console.error('[Competitor Discovery] Error:', error);
      return {
        success: false,
        error: error.message,
        competitors: []
      };
    }
  }

  async findIndustryCompetitors(industry) {
    // Simulated industry-based competitor discovery
    const industryMap = {
      'technology': [
        { domain: 'microsoft.com', name: 'Microsoft', industry: 'Technology' },
        { domain: 'apple.com', name: 'Apple Inc.', industry: 'Technology' },
        { domain: 'google.com', name: 'Google', industry: 'Technology' },
        { domain: 'amazon.com', name: 'Amazon', industry: 'Technology' },
        { domain: 'facebook.com', name: 'Meta', industry: 'Technology' }
      ],
      'ecommerce': [
        { domain: 'amazon.com', name: 'Amazon', industry: 'E-commerce' },
        { domain: 'ebay.com', name: 'eBay', industry: 'E-commerce' },
        { domain: 'walmart.com', name: 'Walmart', industry: 'E-commerce' },
        { domain: 'target.com', name: 'Target', industry: 'E-commerce' },
        { domain: 'bestbuy.com', name: 'Best Buy', industry: 'E-commerce' }
      ],
      'finance': [
        { domain: 'chase.com', name: 'Chase Bank', industry: 'Finance' },
        { domain: 'bankofamerica.com', name: 'Bank of America', industry: 'Finance' },
        { domain: 'wellsfargo.com', name: 'Wells Fargo', industry: 'Finance' },
        { domain: 'citibank.com', name: 'Citibank', industry: 'Finance' },
        { domain: 'capitalone.com', name: 'Capital One', industry: 'Finance' }
      ],
      'healthcare': [
        { domain: 'mayoclinic.org', name: 'Mayo Clinic', industry: 'Healthcare' },
        { domain: 'clevelandclinic.org', name: 'Cleveland Clinic', industry: 'Healthcare' },
        { domain: 'hopkinsmedicine.org', name: 'Johns Hopkins Medicine', industry: 'Healthcare' },
        { domain: 'stanfordhealthcare.org', name: 'Stanford Health Care', industry: 'Healthcare' },
        { domain: 'mountsinai.org', name: 'Mount Sinai', industry: 'Healthcare' }
      ],
      'education': [
        { domain: 'harvard.edu', name: 'Harvard University', industry: 'Education' },
        { domain: 'stanford.edu', name: 'Stanford University', industry: 'Education' },
        { domain: 'mit.edu', name: 'MIT', industry: 'Education' },
        { domain: 'yale.edu', name: 'Yale University', industry: 'Education' },
        { domain: 'princeton.edu', name: 'Princeton University', industry: 'Education' }
      ]
    };

    return industryMap[industry.toLowerCase()] || [];
  }

  async findSimilarWebCompetitors(domain) {
    // Simulated SimilarWeb competitor analysis
    const similarWebMap = {
      'example.com': [
        { domain: 'sample.com', name: 'Sample Corp', similarity: 0.85 },
        { domain: 'demo.com', name: 'Demo Inc', similarity: 0.78 },
        { domain: 'test.com', name: 'Test Company', similarity: 0.72 }
      ],
      'google.com': [
        { domain: 'bing.com', name: 'Bing', similarity: 0.92 },
        { domain: 'yahoo.com', name: 'Yahoo', similarity: 0.88 },
        { domain: 'duckduckgo.com', name: 'DuckDuckGo', similarity: 0.85 }
      ],
      'amazon.com': [
        { domain: 'ebay.com', name: 'eBay', similarity: 0.90 },
        { domain: 'walmart.com', name: 'Walmart', similarity: 0.87 },
        { domain: 'target.com', name: 'Target', similarity: 0.83 }
      ]
    };

    return similarWebMap[domain] || [];
  }

  async findSearchEngineCompetitors(domain) {
    // Simulated search engine competitor analysis
    const searchMap = {
      'example.com': [
        { domain: 'competitor1.com', name: 'Competitor One', searchVolume: 10000 },
        { domain: 'competitor2.com', name: 'Competitor Two', searchVolume: 8500 },
        { domain: 'competitor3.com', name: 'Competitor Three', searchVolume: 7200 }
      ]
    };

    return searchMap[domain] || [];
  }

  async findSocialMediaCompetitors(domain) {
    // Simulated social media competitor analysis
    const socialMap = {
      'example.com': [
        { domain: 'social1.com', name: 'Social Competitor 1', followers: 50000 },
        { domain: 'social2.com', name: 'Social Competitor 2', followers: 42000 },
        { domain: 'social3.com', name: 'Social Competitor 3', followers: 38000 }
      ]
    };

    return socialMap[domain] || [];
  }

  removeDuplicates(competitors) {
    const seen = new Set();
    return competitors.filter(comp => {
      const key = comp.domain.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async detectIndustry(domain) {
    try {
      const response = await axios.get(`https://${domain}`, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Simple keyword-based industry detection
      const text = $('body').text().toLowerCase();
      
      if (text.includes('technology') || text.includes('software') || text.includes('app')) {
        return 'technology';
      } else if (text.includes('shop') || text.includes('buy') || text.includes('cart')) {
        return 'ecommerce';
      } else if (text.includes('bank') || text.includes('finance') || text.includes('credit')) {
        return 'finance';
      } else if (text.includes('health') || text.includes('medical') || text.includes('doctor')) {
        return 'healthcare';
      } else if (text.includes('university') || text.includes('college') || text.includes('education')) {
        return 'education';
      }
      
      return 'general';
    } catch (error) {
      console.error(`[Industry Detection] Error for ${domain}:`, error.message);
      return 'general';
    }
  }
}

module.exports = CompetitorDiscoveryService; 