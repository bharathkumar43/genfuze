// Download file helper
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Website crawler function
export async function crawlWebsite(
  baseUrl: string, 
  maxPages: number = 10,
  onProgress?: (progress: {
    currentPage: string;
    crawledPages: number;
    totalPages: number;
    status: 'crawling' | 'success' | 'error' | 'skipped';
    contentLength?: number;
    error?: string;
  }) => void
): Promise<{ content: string; pages: string[] }> {
  const visited = new Set<string>();
  const content: string[] = [];
  const pages: string[] = [];
  const queue: string[] = [baseUrl];
  
  // Check if unlimited crawling is enabled
  const isUnlimited = maxPages >= Number.MAX_SAFE_INTEGER;
  
  const corsProxies = [
    {
      name: 'AllOrigins',
      url: (targetUrl: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      extractContent: (data: any) => data.contents
    },
    {
      name: 'CORS Anywhere (Heroku)',
      url: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
      extractContent: (data: any) => data
    },
    {
      name: 'ThingProxy',
      url: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
      extractContent: (data: any) => data
    },
    {
      name: 'CORS.SH',
      url: (targetUrl: string) => `https://cors.sh/${targetUrl}`,
      extractContent: (data: any) => data
    }
  ];

  const extractTextFromHtml = (html: string): string => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation, .ads, .advertisement');
    scripts.forEach(el => el.remove());
    
    // Try to find main content areas
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.blog-content',
      '.post-body',
      'main',
      '.main-content',
      '.page-content'
    ];
    
    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = tempDiv.querySelector(selector);
      if (mainContent && mainContent.textContent && mainContent.textContent.length > 200) {
        break;
      }
    }
    
    // If no main content found, use the whole body
    if (!mainContent) {
      mainContent = tempDiv;
    }
    
    // Extract text content
    let textContent = mainContent.textContent || (mainContent as HTMLElement).innerText || '';
    
    // Clean up the text
    textContent = textContent
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .trim();
    
    return textContent;
  };

  const extractLinks = (html: string, baseUrl: string): string[] => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const links: string[] = [];
    const anchorTags = tempDiv.querySelectorAll('a[href]');
    
    anchorTags.forEach(anchor => {
      const href = anchor.getAttribute('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          // Only include links from the same domain
          if (new URL(absoluteUrl).hostname === new URL(baseUrl).hostname) {
            links.push(absoluteUrl);
          }
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  };

  const fetchPage = async (url: string): Promise<{ content: string; links: string[] } | null> => {
    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy.url(url);
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/html, */*',
          },
        });
        
        if (!response.ok) {
          continue;
        }

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          data = proxy.extractContent(data);
        } else {
          data = await response.text();
        }
        
        if (!data || (typeof data === 'string' && data.length < 100)) {
          continue;
        }

        const textContent = extractTextFromHtml(data);
        const links = extractLinks(data, url);
        
        if (textContent && textContent.length > 100) {
          return { content: textContent, links };
        }
      } catch (error) {
        console.error(`Error with ${proxy.name} for ${url}:`, error);
        continue;
      }
    }
    return null;
  };

  // Start crawling
  while (queue.length > 0 && (isUnlimited || visited.size < maxPages)) {
    const currentUrl = queue.shift()!;
    
    if (visited.has(currentUrl)) {
      continue;
    }
    
    visited.add(currentUrl);
    
    // Send progress update for current page
    onProgress?.({
      currentPage: currentUrl,
      crawledPages: pages.length,
      totalPages: isUnlimited ? -1 : maxPages, // -1 indicates unlimited mode
      status: 'crawling'
    });
    
    try {
      const result = await fetchPage(currentUrl);
      
      if (result) {
        content.push(`=== Page: ${currentUrl} ===\n${result.content}\n`);
        pages.push(currentUrl);
        
        // Send success progress update
        onProgress?.({
          currentPage: currentUrl,
          crawledPages: pages.length,
          totalPages: isUnlimited ? -1 : maxPages,
          status: 'success',
          contentLength: result.content.length
        });
        
        // Add new links to queue
        for (const link of result.links) {
          if (!visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }
      } else {
        // Send skipped progress update
        onProgress?.({
          currentPage: currentUrl,
          crawledPages: pages.length,
          totalPages: isUnlimited ? -1 : maxPages,
          status: 'skipped'
        });
      }
      
      // Add a small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      // Send error progress update
      onProgress?.({
        currentPage: currentUrl,
        crawledPages: pages.length,
        totalPages: isUnlimited ? -1 : maxPages,
        status: 'error',
        error: (error as Error).message
      });
      console.error(`Error crawling ${currentUrl}:`, error);
    }
  }
  
  return {
    content: content.join('\n\n'),
    pages
  };
}