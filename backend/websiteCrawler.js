const { URL } = require('url');
const axios = require('axios');
const cheerio = require('cheerio');

class WebsiteCrawler {
  constructor() {
    this.maxPages = 50; // Maximum pages to crawl
    this.maxDepth = 3; // Maximum depth to crawl
    this.timeout = 30000; // Timeout per page
  }

  /**
   * Crawls a website and extracts content from all pages using HTTP requests
   * @param {string} baseUrl - The starting URL to crawl
   * @param {Object} options - Crawling options
   * @returns {Promise<Object>} Crawl results
   */
  async crawlWebsite(baseUrl, options = {}) {
    const {
      maxPages = this.maxPages,
      maxDepth = this.maxDepth,
      timeout = this.timeout
    } = options;

    console.log(`🌐 Starting website crawl for: ${baseUrl}`);
    console.log(`📋 Options: maxPages=${maxPages}, maxDepth=${maxDepth}, timeout=${timeout}ms`);

    const visited = new Set();
    const pages = [];
    const queue = [{ url: baseUrl, depth: 0 }];
    const baseDomain = new URL(baseUrl).hostname;

    while (queue.length > 0 && pages.length < maxPages) {
      const { url, depth } = queue.shift();
      
      if (visited.has(url) || depth > maxDepth) {
        continue;
      }

      visited.add(url);
      console.log(`📄 Crawling: ${url} (depth: ${depth})`);

      try {
        // Fetch the page content
        const response = await axios.get(url, {
          timeout: timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
          }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        
        // Extract title
        const title = $('title').text() || $('h1').first().text() || 'No Title';
        
        // Remove unwanted elements
        $('nav, header, footer, .nav, .header, .footer, .sidebar, .menu, .navigation, .breadcrumb, script, style, noscript, iframe, .ad, .advertisement, .banner, .popup, .cookie, .privacy, .terms, .disclaimer, .modal, .overlay, .tooltip, .notification, .alert, .banner, .ads, .advertisement, .sponsored, .promo, .promotion').remove();
        
        // Extract main content
        let content = '';
        const mainSelectors = ['main', 'article', '.content', '.main', '.post', '.article', '.entry', '.text', '.body', '.page-content', '.main-content'];
        
        for (const selector of mainSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            content = element.text();
            break;
          }
        }
        
        // If no main content found, get body text
        if (!content) {
          content = $('body').text();
        }
        
        // Clean up content
        content = content
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .replace(/\t/g, ' ')
          .trim();

        const pageData = {
          url,
          title,
          content,
          status: 'success',
          contentLength: content.length
        };
        
        pages.push(pageData);

        // Extract links for next level crawling
        if (depth < maxDepth) {
          const links = [];
          $('a[href]').each((i, element) => {
            const href = $(element).attr('href');
            if (href && href.startsWith('http') && href.includes(baseDomain)) {
              try {
                const url = new URL(href);
                url.hash = ''; // Remove fragments
                const cleanUrl = url.toString();
                
                // Avoid crawling common non-content URLs
                const skipPatterns = [
                  '/login', '/logout', '/signin', '/signup', '/register',
                  '/admin', '/dashboard', '/profile', '/account',
                  '/cart', '/checkout', '/payment',
                  '/api/', '/ajax/', '/json/',
                  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
                  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico',
                  '.css', '.js', '.xml', '.rss', '.atom'
                ];
                
                const shouldSkip = skipPatterns.some(pattern => 
                  cleanUrl.toLowerCase().includes(pattern.toLowerCase())
                );
                
                if (!shouldSkip && !visited.has(cleanUrl)) {
                  links.push(cleanUrl);
                }
              } catch (error) {
                // Skip invalid URLs
              }
            }
          });
          
          // Add unique links to queue
          const uniqueLinks = [...new Set(links)];
          for (const link of uniqueLinks) {
            if (!visited.has(link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }

      } catch (error) {
        console.error(`❌ Error crawling ${url}:`, error.message);
        pages.push({
          url,
          title: 'Error',
          content: '',
          status: 'error',
          error: error.message
        });
      }
      
      // Add a small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const totalContent = pages
      .filter(p => p.status === 'success')
      .map(p => p.content)
      .join('\n\n');

    console.log(`✅ Website crawl completed!`);
    console.log(`📊 Results: ${pages.length} pages crawled, ${totalContent.length} characters extracted`);

    return {
      success: true,
      baseUrl,
      pages,
      totalPages: pages.length,
      totalContent: totalContent.length,
      content: totalContent,
      summary: {
        successfulPages: pages.filter(p => p.status === 'success').length,
        errorPages: pages.filter(p => p.status === 'error').length,
        averageContentLength: pages
          .filter(p => p.status === 'success')
          .reduce((sum, p) => sum + p.content.length, 0) / Math.max(1, pages.filter(p => p.status === 'success').length)
      }
    };
  }
}

module.exports = WebsiteCrawler; 