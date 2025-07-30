const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extracts the full HTML of a page using HTTP requests.
 * @param {string} url
 * @returns {Promise<string>} The full HTML as a string
 */
async function extractFullPageHtml(url) {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Remove script tags for cleaner output
    $('script').remove();
    
    // Get the full HTML
    return $.html();
  } catch (err) {
    throw new Error(`Failed to extract HTML from ${url}: ${err.message}`);
  }
}

module.exports = { extractFullPageHtml }; 