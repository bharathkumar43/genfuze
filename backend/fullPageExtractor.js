const { chromium } = require('playwright');

/**
 * Extracts the full HTML of a page, including inlined styles for external CSS.
 * @param {string} url
 * @returns {Promise<string>} The full HTML as a string
 */
async function extractFullPageHtml(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    // Inline all external stylesheets
    await page.addInitScript(() => {
      window.inlineStylesPromise = (async () => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        for (const link of links) {
          try {
            const href = link.href;
            const resp = await fetch(href);
            if (resp.ok) {
              const css = await resp.text();
              const style = document.createElement('style');
              style.textContent = css;
              link.parentNode.insertBefore(style, link);
              link.remove();
            }
          } catch (e) { /* ignore */ }
        }
      })();
    });
    // Wait for styles to be inlined
    await page.evaluate(() => window.inlineStylesPromise);
    // Get the full HTML
    const html = await page.content();
    await browser.close();
    return html;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = { extractFullPageHtml }; 