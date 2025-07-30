const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class SmartCompetitorDiscoveryService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.semrushApiKey = process.env.SEMRUSH_API_KEY;
    this.semrushBaseUrl = 'https://api.semrush.com';
  }

  async discoverSmartCompetitors(domain, userWebsite = null, companyName = '') {
    try {
      if (!this.semrushApiKey) {
        throw new Error('SEMrush API key not configured');
      }
      // 1. Get competitors from SEMrush
      const competitors = await this.getSemrushCompetitors(domain);
      // 2. For each competitor, get SEO metrics and AI visibility (if available)
      const enrichedCompetitors = [];
      for (const comp of competitors) {
        const metrics = await this.getSemrushMetrics(comp.domain);
        enrichedCompetitors.push({
          name: comp.name,
          domain: comp.domain,
          seoScore: metrics.seoScore,
          aiVisibility: metrics.aiVisibility,
          organicTraffic: metrics.organicTraffic,
          backlinks: metrics.backlinks,
          shareOfVoice: metrics.shareOfVoice,
          mentionRate: metrics.mentionRate,
          avgRanking: metrics.avgRanking,
          lastUpdated: new Date().toISOString(),
        });
      }
      // Add user company if not present
      if (companyName && !enrichedCompetitors.find(c => c.name.toLowerCase() === companyName.trim().toLowerCase())) {
        enrichedCompetitors.unshift({
          name: companyName.trim() + ' (You)',
          domain: userWebsite || domain,
          seoScore: 0,
          aiVisibility: 0,
          organicTraffic: 0,
          backlinks: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
      // Limit to 10
      const topCompetitors = enrichedCompetitors.slice(0, 10);
      return {
        success: true,
        competitors: topCompetitors,
        targetDomain: domain,
        targetAnalysis: {},
        totalAnalyzed: topCompetitors.length
      };
    } catch (error) {
      console.error('[Smart Competitor Discovery] Error:', error);
      return {
        success: false,
        competitors: [],
        error: error.message
      };
    }
  }

  async discoverCompetitorsGeminiAndSEMrush(domain, companyName = '') {
    // 1. Use Gemini API to generate a list of 10 competitors
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `List 10 competitors of ${companyName || domain}. Only list the company names or domains, separated by commas.`;
    let competitorsList = [];
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.candidates[0]?.content?.parts[0]?.text || '';
      competitorsList = text.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    } catch (err) {
      console.error('[Gemini] Error generating competitors:', err);
      return {
        success: false,
        competitors: [],
        error: 'Failed to generate competitors from Gemini.'
      };
    }
    if (!competitorsList.length) {
      console.warn('[Gemini] No competitors returned for', companyName || domain);
      return {
        success: false,
        competitors: [],
        error: 'Gemini did not return any competitors.'
      };
    }
    // 2. For each competitor, just set all metrics to 0
    const enrichedCompetitors = competitorsList.map(comp => ({
      name: comp,
      domain: comp,
      seoScore: 0,
      aiVisibility: 0,
      organicTraffic: 0,
      backlinks: 0,
      shareOfVoice: 0,
      mentionRate: 0,
      avgRanking: 0,
      lastUpdated: new Date().toISOString(),
    }));
    return {
      success: true,
      competitors: enrichedCompetitors,
      targetDomain: domain,
      targetAnalysis: {},
      totalAnalyzed: enrichedCompetitors.length
    };
  }

  async getSemrushCompetitors(domain) {
    // Use SEMrush API to get competitors for the given domain
    // Example endpoint: https://api.semrush.com/?type=domain_organic_competitors&key=API_KEY&export_columns=Dn&domain=example.com&database=us
    const url = `${this.semrushBaseUrl}/?type=domain_organic_competitors&key=${this.semrushApiKey}&export_columns=Dn&domain=${domain}&database=us`;
    const response = await axios.get(url);
    const lines = response.data.split('\n');
    const competitors = [];
    for (let i = 1; i < lines.length; i++) { // skip header
      const cols = lines[i].split(';');
      if (cols[0]) {
        competitors.push({ name: cols[0], domain: cols[0] });
      }
    }
    return competitors;
  }

  async getSemrushMetrics(domain) {
    // Use SEMrush API to get SEO metrics for the given domain
    // Example endpoint: https://api.semrush.com/?type=domain_ranks&key=API_KEY&export_columns=Dn,Rk,Or,Ot,Oc,Ad,At,Ac&domain=example.com&database=us
    const url = `${this.semrushBaseUrl}/?type=domain_ranks&key=${this.semrushApiKey}&export_columns=Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sv,Mr,Ar&domain=${domain}&database=us`;
    const response = await axios.get(url);
    const lines = response.data.split('\n');
    let seoScore = 0, aiVisibility = 0, organicTraffic = 0, backlinks = 0, shareOfVoice = 0, mentionRate = 0, avgRanking = 0;
    if (lines.length > 1) {
      const cols = lines[1].split(';');
      // Example: Dn;Rk;Or;Ot;Oc;Ad;At;Ac;Sv;Mr;Ar
      //          0  1  2  3  4  5  6  7  8   9   10
      seoScore = parseInt(cols[1], 10) || 0; // Rank as SEO score
      organicTraffic = parseInt(cols[3], 10) || 0;
      backlinks = parseInt(cols[7], 10) || 0;
      shareOfVoice = parseFloat(cols[8]) || 0;
      mentionRate = parseFloat(cols[9]) || 0;
      avgRanking = parseFloat(cols[10]) || 0;
      // AI visibility is not a standard SEMrush metric; set to 0 or use a custom logic if available
      aiVisibility = 0;
    }
    return { seoScore, aiVisibility, organicTraffic, backlinks, shareOfVoice, mentionRate, avgRanking };
  }

  getFallbackCompetitors(domain) {
    // Generic fallback competitors for different business types
    const genericCompetitors = [
      { domain: 'competitor1.com', name: 'Competitor 1', isUserWebsite: false },
      { domain: 'competitor2.com', name: 'Competitor 2', isUserWebsite: false },
      { domain: 'competitor3.com', name: 'Competitor 3', isUserWebsite: false },
      { domain: 'competitor4.com', name: 'Competitor 4', isUserWebsite: false },
      { domain: 'competitor5.com', name: 'Competitor 5', isUserWebsite: false },
      { domain: 'competitor6.com', name: 'Competitor 6', isUserWebsite: false },
      { domain: 'competitor7.com', name: 'Competitor 7', isUserWebsite: false },
      { domain: 'competitor8.com', name: 'Competitor 8', isUserWebsite: false },
      { domain: 'competitor9.com', name: 'Competitor 9', isUserWebsite: false },
      { domain: 'competitor10.com', name: 'Competitor 10', isUserWebsite: false }
    ];
    
    return genericCompetitors;
  }

  async analyzeDomain(domain) {
    try {
      const response = await axios.get(`https://${domain}`, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract key information
      const title = $('title').text() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      const keywords = $('meta[name="keywords"]').attr('content') || '';
      const bodyText = $('body').text().substring(0, 5000); // First 5000 chars
      
      // Analyze business type
      const businessType = this.detectBusinessType(title, description, bodyText);
      
      // Extract key services/products
      const services = this.extractServices(title, description, bodyText);
      
      // Detect target audience
      const targetAudience = this.detectTargetAudience(bodyText);
      
      // Analyze content focus
      const contentFocus = this.analyzeContentFocus(bodyText);
      
      return {
        domain,
        title,
        description,
        businessType,
        services,
        targetAudience,
        contentFocus,
        contentLength: bodyText.length,
        hasEcommerce: bodyText.toLowerCase().includes('shop') || bodyText.toLowerCase().includes('buy'),
        hasBlog: bodyText.toLowerCase().includes('blog') || bodyText.toLowerCase().includes('article'),
        hasServices: bodyText.toLowerCase().includes('service') || bodyText.toLowerCase().includes('solution')
      };
      
    } catch (error) {
      console.error(`[Domain Analysis] Error for ${domain}:`, error.message);
      return {
        domain,
        title: '',
        description: '',
        businessType: 'unknown',
        services: [],
        targetAudience: 'general',
        contentFocus: 'general',
        contentLength: 0,
        hasEcommerce: false,
        hasBlog: false,
        hasServices: false
      };
    }
  }

  detectBusinessType(title, description, bodyText) {
    const text = (title + ' ' + description + ' ' + bodyText).toLowerCase();
    
    if (text.includes('saas') || text.includes('software') || text.includes('platform')) {
      return 'saas';
    } else if (text.includes('agency') || text.includes('marketing') || text.includes('consulting')) {
      return 'agency';
    } else if (text.includes('ecommerce') || text.includes('shop') || text.includes('store')) {
      return 'ecommerce';
    } else if (text.includes('blog') || text.includes('news') || text.includes('media')) {
      return 'content';
    } else if (text.includes('education') || text.includes('course') || text.includes('training')) {
      return 'education';
    } else if (text.includes('health') || text.includes('medical') || text.includes('fitness')) {
      return 'health';
    } else if (text.includes('finance') || text.includes('banking') || text.includes('investment')) {
      return 'finance';
    } else {
      return 'general';
    }
  }

  extractServices(title, description, bodyText) {
    const text = (title + ' ' + description + ' ' + bodyText).toLowerCase();
    const services = [];
    
    // Common service keywords
    const serviceKeywords = [
      'web design', 'development', 'marketing', 'seo', 'social media',
      'consulting', 'training', 'coaching', 'analytics', 'automation',
      'design', 'branding', 'content', 'strategy', 'management'
    ];
    
    serviceKeywords.forEach(service => {
      if (text.includes(service)) {
        services.push(service);
      }
    });
    
    return services.slice(0, 5); // Top 5 services
  }

  detectTargetAudience(bodyText) {
    const text = bodyText.toLowerCase();
    
    if (text.includes('startup') || text.includes('small business')) {
      return 'startups';
    } else if (text.includes('enterprise') || text.includes('corporate')) {
      return 'enterprise';
    } else if (text.includes('freelancer') || text.includes('individual')) {
      return 'individuals';
    } else {
      return 'general';
    }
  }

  analyzeContentFocus(bodyText) {
    const text = bodyText.toLowerCase();
    
    if (text.includes('technology') || text.includes('tech')) {
      return 'technology';
    } else if (text.includes('business') || text.includes('strategy')) {
      return 'business';
    } else if (text.includes('creative') || text.includes('design')) {
      return 'creative';
    } else {
      return 'general';
    }
  }

  async findActualCompetitors(domain, domainAnalysis) {
    const competitors = [];
    
    // Method 1: Find competitors based on business type
    const businessTypeCompetitors = await this.findBusinessTypeCompetitors(domainAnalysis.businessType, domain);
    competitors.push(...businessTypeCompetitors);
    
    // Method 2: Find competitors based on services
    const serviceCompetitors = await this.findServiceBasedCompetitors(domainAnalysis.services, domain);
    competitors.push(...serviceCompetitors);
    
    // Method 3: Find competitors based on target audience
    const audienceCompetitors = await this.findAudienceBasedCompetitors(domainAnalysis.targetAudience, domain);
    competitors.push(...audienceCompetitors);
    
    // Method 4: Find competitors based on content focus
    const contentCompetitors = await this.findContentBasedCompetitors(domainAnalysis.contentFocus, domain);
    competitors.push(...contentCompetitors);
    
    return competitors;
  }

  async findBusinessTypeCompetitors(businessType, excludeDomain) {
    const competitorMap = {
      'saas': [
        { domain: 'notion.so', name: 'Notion', businessType: 'saas', similarity: 0.92 },
        { domain: 'slack.com', name: 'Slack', businessType: 'saas', similarity: 0.89 },
        { domain: 'asana.com', name: 'Asana', businessType: 'saas', similarity: 0.87 },
        { domain: 'trello.com', name: 'Trello', businessType: 'saas', similarity: 0.85 },
        { domain: 'clickup.com', name: 'ClickUp', businessType: 'saas', similarity: 0.83 },
        { domain: 'monday.com', name: 'Monday.com', businessType: 'saas', similarity: 0.81 },
        { domain: 'basecamp.com', name: 'Basecamp', businessType: 'saas', similarity: 0.79 },
        { domain: 'wrike.com', name: 'Wrike', businessType: 'saas', similarity: 0.77 },
        { domain: 'teamgantt.com', name: 'TeamGantt', businessType: 'saas', similarity: 0.75 },
        { domain: 'smartsheet.com', name: 'Smartsheet', businessType: 'saas', similarity: 0.73 }
      ],
      'agency': [
        { domain: 'hubspot.com', name: 'HubSpot', businessType: 'agency', similarity: 0.91 },
        { domain: 'mailchimp.com', name: 'Mailchimp', businessType: 'agency', similarity: 0.88 },
        { domain: 'canva.com', name: 'Canva', businessType: 'agency', similarity: 0.86 },
        { domain: 'figma.com', name: 'Figma', businessType: 'agency', similarity: 0.84 },
        { domain: 'buffer.com', name: 'Buffer', businessType: 'agency', similarity: 0.82 },
        { domain: 'hootsuite.com', name: 'Hootsuite', businessType: 'agency', similarity: 0.80 },
        { domain: 'sproutsocial.com', name: 'Sprout Social', businessType: 'agency', similarity: 0.78 },
        { domain: 'later.com', name: 'Later', businessType: 'agency', similarity: 0.76 },
        { domain: 'planoly.com', name: 'Planoly', businessType: 'agency', similarity: 0.74 },
        { domain: 'tailwindapp.com', name: 'Tailwind', businessType: 'agency', similarity: 0.72 }
      ],
      'ecommerce': [
        { domain: 'shopify.com', name: 'Shopify', businessType: 'ecommerce', similarity: 0.93 },
        { domain: 'woocommerce.com', name: 'WooCommerce', businessType: 'ecommerce', similarity: 0.90 },
        { domain: 'bigcommerce.com', name: 'BigCommerce', businessType: 'ecommerce', similarity: 0.87 },
        { domain: 'magento.com', name: 'Magento', businessType: 'ecommerce', similarity: 0.85 },
        { domain: 'prestashop.com', name: 'PrestaShop', businessType: 'ecommerce', similarity: 0.83 },
        { domain: 'opencart.com', name: 'OpenCart', businessType: 'ecommerce', similarity: 0.81 },
        { domain: 'volusion.com', name: 'Volusion', businessType: 'ecommerce', similarity: 0.79 },
        { domain: '3dcart.com', name: '3dcart', businessType: 'ecommerce', similarity: 0.77 },
        { domain: 'ecwid.com', name: 'Ecwid', businessType: 'ecommerce', similarity: 0.75 },
        { domain: 'squarespace.com', name: 'Squarespace', businessType: 'ecommerce', similarity: 0.73 }
      ],
      'content': [
        { domain: 'medium.com', name: 'Medium', businessType: 'content', similarity: 0.91 },
        { domain: 'substack.com', name: 'Substack', businessType: 'content', similarity: 0.88 },
        { domain: 'ghost.org', name: 'Ghost', businessType: 'content', similarity: 0.86 },
        { domain: 'wordpress.com', name: 'WordPress', businessType: 'content', similarity: 0.84 },
        { domain: 'squarespace.com', name: 'Squarespace', businessType: 'content', similarity: 0.82 },
        { domain: 'wix.com', name: 'Wix', businessType: 'content', similarity: 0.80 },
        { domain: 'weebly.com', name: 'Weebly', businessType: 'content', similarity: 0.78 },
        { domain: 'webflow.com', name: 'Webflow', businessType: 'content', similarity: 0.76 },
        { domain: 'carrd.co', name: 'Carrd', businessType: 'content', similarity: 0.74 },
        { domain: 'strikingly.com', name: 'Strikingly', businessType: 'content', similarity: 0.72 }
      ],
      'education': [
        { domain: 'coursera.org', name: 'Coursera', businessType: 'education', similarity: 0.91 },
        { domain: 'udemy.com', name: 'Udemy', businessType: 'education', similarity: 0.88 },
        { domain: 'skillshare.com', name: 'Skillshare', businessType: 'education', similarity: 0.86 },
        { domain: 'pluralsight.com', name: 'Pluralsight', businessType: 'education', similarity: 0.84 },
        { domain: 'linkedin.com/learning', name: 'LinkedIn Learning', businessType: 'education', similarity: 0.82 },
        { domain: 'edx.org', name: 'edX', businessType: 'education', similarity: 0.80 },
        { domain: 'khanacademy.org', name: 'Khan Academy', businessType: 'education', similarity: 0.78 },
        { domain: 'udacity.com', name: 'Udacity', businessType: 'education', similarity: 0.76 },
        { domain: 'codecademy.com', name: 'Codecademy', businessType: 'education', similarity: 0.74 },
        { domain: 'freecodecamp.org', name: 'freeCodeCamp', businessType: 'education', similarity: 0.72 }
      ]
    };
    
    return competitorMap[businessType] || [];
  }

  async findServiceBasedCompetitors(services, excludeDomain) {
    const serviceCompetitors = [];
    
    services.forEach(service => {
      const serviceMap = {
        'web design': [
          { domain: 'webflow.com', name: 'Webflow', service: 'web design', similarity: 0.85 },
          { domain: 'wix.com', name: 'Wix', service: 'web design', similarity: 0.82 }
        ],
        'marketing': [
          { domain: 'mailchimp.com', name: 'Mailchimp', service: 'marketing', similarity: 0.88 },
          { domain: 'convertkit.com', name: 'ConvertKit', service: 'marketing', similarity: 0.85 }
        ],
        'seo': [
          { domain: 'semrush.com', name: 'SEMrush', service: 'seo', similarity: 0.90 },
          { domain: 'ahrefs.com', name: 'Ahrefs', service: 'seo', similarity: 0.88 }
        ],
        'development': [
          { domain: 'github.com', name: 'GitHub', service: 'development', similarity: 0.85 },
          { domain: 'gitlab.com', name: 'GitLab', service: 'development', similarity: 0.82 }
        ]
      };
      
      if (serviceMap[service]) {
        serviceCompetitors.push(...serviceMap[service]);
      }
    });
    
    return serviceCompetitors;
  }

  async findAudienceBasedCompetitors(targetAudience, excludeDomain) {
    const audienceMap = {
      'startups': [
        { domain: 'producthunt.com', name: 'Product Hunt', audience: 'startups', similarity: 0.85 },
        { domain: 'indiehackers.com', name: 'Indie Hackers', audience: 'startups', similarity: 0.82 }
      ],
      'enterprise': [
        { domain: 'salesforce.com', name: 'Salesforce', audience: 'enterprise', similarity: 0.88 },
        { domain: 'microsoft.com', name: 'Microsoft', audience: 'enterprise', similarity: 0.85 }
      ],
      'individuals': [
        { domain: 'fiverr.com', name: 'Fiverr', audience: 'individuals', similarity: 0.85 },
        { domain: 'upwork.com', name: 'Upwork', audience: 'individuals', similarity: 0.82 }
      ]
    };
    
    return audienceMap[targetAudience] || [];
  }

  async findContentBasedCompetitors(contentFocus, excludeDomain) {
    const contentMap = {
      'technology': [
        { domain: 'techcrunch.com', name: 'TechCrunch', focus: 'technology', similarity: 0.85 },
        { domain: 'theverge.com', name: 'The Verge', focus: 'technology', similarity: 0.82 }
      ],
      'business': [
        { domain: 'forbes.com', name: 'Forbes', focus: 'business', similarity: 0.88 },
        { domain: 'entrepreneur.com', name: 'Entrepreneur', focus: 'business', similarity: 0.85 }
      ],
      'creative': [
        { domain: 'behance.net', name: 'Behance', focus: 'creative', similarity: 0.85 },
        { domain: 'dribbble.com', name: 'Dribbble', focus: 'creative', similarity: 0.82 }
      ]
    };
    
    return contentMap[contentFocus] || [];
  }

  rankCompetitorsBySimilarity(competitors, targetAnalysis) {
    return competitors.map(competitor => {
      let similarityScore = 0;
      
      // Business type similarity (40% weight)
      if (competitor.businessType === targetAnalysis.businessType) {
        similarityScore += 40;
      }
      
      // Service similarity (30% weight)
      const serviceOverlap = competitor.services?.filter(s => 
        targetAnalysis.services.includes(s)
      ).length || 0;
      similarityScore += (serviceOverlap / targetAnalysis.services.length) * 30;
      
      // Audience similarity (20% weight)
      if (competitor.audience === targetAnalysis.targetAudience) {
        similarityScore += 20;
      }
      
      // Content focus similarity (10% weight)
      if (competitor.focus === targetAnalysis.contentFocus) {
        similarityScore += 10;
      }
      
      return {
        ...competitor,
        similarityScore: Math.round(similarityScore)
      };
    }).sort((a, b) => b.similarityScore - a.similarityScore);
  }

  extractCompanyName(domain) {
    // Extract company name from domain
    const name = domain.replace(/^www\./, '').split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

module.exports = SmartCompetitorDiscoveryService; 