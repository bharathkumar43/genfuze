const { Builder, By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// --- Robust Selenium ChatGPT Automation ---
async function extractResponseText(driver, timeout = 30_000) {
  const selectors = [
    // ChatGPT specific selectors
    '[data-message-author-role="assistant"]',
    '[data-testid="message-content"]',
    '[data-testid="answer-text"]',
    '[data-testid^="conversation-turn-"]',
    '[class*="markdown"]',
    '[class*="prose"]',
    '[class*="whitespace-pre-wrap"]',
    '[class*="text-gray-800"]',
    '[class*="text-gray-900"]',
    '[class*="dark:text-gray-100"]',
    '[class*="dark:text-gray-200"]',
    '[class*="message"]',
    '[class*="response"]',
    '[class*="content"]',
    'div[role="article"]',
    '.text-content',
    '[data-testid="chatgpt-message"]',
    // Code block selectors
    'pre',
    'code',
    // Paragraph selectors
    'p',
    'div[class*="text"]',
    // Fallback selectors
    '[class*="conversation"]',
    '[class*="chat"]',
    '[class*="assistant"]'
  ];
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeout) {
    attempt++;
    for (const selector of selectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        console.log(`[DEBUG] Selector: ${selector}, Found: ${elements.length}`);
        for (const el of elements) {
          const text = await el.getText();
          console.log(`[DEBUG] Text for selector ${selector}:`, text);
        }
        if (elements.length > 0) {
          const latest = elements[elements.length - 1];
          await driver.sleep(2000);
          let responseText = await latest.getText();
          if (!responseText || responseText.length < 20) {
            // Try to get all child text
            const children = await latest.findElements(By.xpath('.//*'));
            let parts = [];
            for (const child of children) {
              const text = await child.getText();
              if (text && text.length > 10) parts.push(text);
            }
            if (parts.length) responseText = parts.join('\n');
          }
          if (responseText && responseText.length > 20) {
            const errorIndicators = [
              'error', 'failed', 'unavailable', 'blocked', 'detected',
              'captcha', 'verify', 'robot', 'automation'
            ];
            if (!errorIndicators.some(ind => responseText.toLowerCase().includes(ind))) {
              return responseText;
            }
          }
        }
      } catch (e) { continue; }
    }
    await driver.sleep(3000);
  }
  // Fallback: try to get body text
  try {
    const body = await driver.findElement(By.tagName('body'));
    const pageText = await body.getText();
    if (pageText && pageText.length > 100) {
      const lines = pageText.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().length > 50) return lines[i].trim();
      }
    }
  } catch {}
  return 'No response could be extracted. The AI platform may have detected automation or the response format has changed.';
}

async function getChatGPTAnswersRobust(questions) {
  const answers = [];
  let driver;
  try {
    // Use real Chrome profile for persistent login
    const options = new chrome.Options();
    options.addArguments('--user-data-dir=C:/Users/eswar/AppData/Local/Google/Chrome/User Data');
    options.addArguments('--profile-directory=Default');
    console.log('[DEBUG] About to launch Chrome with user profile...');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('[DEBUG] Chrome launched!');
    console.log('[DEBUG] About to navigate to ChatGPT...');
    try {
      await driver.get('https://chat.openai.com');
      console.log('[DEBUG] Navigation to ChatGPT successful!');
    } catch (navErr) {
      console.error('[ERROR] Navigation to ChatGPT failed:', navErr);
      throw navErr;
    }
    await driver.sleep(5000);
    // Check for login
    let loggedIn = false;
    for (let i = 0; i < 60; i++) {
      const chatInputs = await driver.findElements(By.css('textarea[placeholder*="Message"], [data-testid="chat-input"], textarea'));
      if (chatInputs.length > 0) { loggedIn = true; break; }
      await driver.sleep(1000);
    }
    if (!loggedIn) {
      throw new Error('Not logged in to ChatGPT. Please log in manually in the opened browser.');
    }
    for (const question of questions) {
      let inputElement = null;
      const selectors = [
        'textarea[placeholder*="Message"]',
        '[data-testid="chat-input"]',
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="Ask"]',
        'textarea',
        '[contenteditable="true"]',
        'input[type="text"]',
        '[role="textbox"]'
      ];
      // Find input
      for (let i = 0; i < 60; i++) {
        for (const selector of selectors) {
          const elements = await driver.findElements(By.css(selector));
          for (const el of elements) {
            if (await el.isDisplayed() && await el.isEnabled()) {
              inputElement = el;
              break;
            }
          }
          if (inputElement) break;
        }
        if (inputElement) break;
        await driver.sleep(1000);
      }
      if (!inputElement) {
        answers.push({ question, answer: '[Input element not found]' });
        continue;
      }
      // Clear input
      try {
        await inputElement.sendKeys(Key.CONTROL, 'a');
        await inputElement.sendKeys(Key.DELETE);
      } catch {}
      // Type question
      for (const char of question) {
        await inputElement.sendKeys(char);
        await driver.sleep(Math.floor(Math.random() * 30) + 10);
      }
      await driver.sleep(500);
      // Try multiple ways to submit
      let submitted = false;
      try {
        await inputElement.sendKeys(Key.ENTER);
        submitted = true;
        console.log('Pressed Key.ENTER');
      } catch (e) {
        console.log('Key.ENTER failed:', e);
      }
      if (!submitted) {
        try {
          await inputElement.sendKeys(Key.RETURN);
          submitted = true;
          console.log('Pressed Key.RETURN');
        } catch (e) {
          console.log('Key.RETURN failed:', e);
        }
      }
      if (!submitted) {
        try {
          await driver.executeScript(`
            const el = arguments[0];
            const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', which: 13, keyCode: 13});
            el.dispatchEvent(event);
          `, inputElement);
          submitted = true;
          console.log('Dispatched Enter key event via JS');
        } catch (e) {
          console.log('JS dispatch Enter failed:', e);
        }
      }
      // Wait for answer
      await driver.sleep(Math.floor(Math.random() * 7000) + 8000);
      const answer = await extractResponseText(driver);
      answers.push({ question, answer });
      await driver.sleep(2000);
    }
  } catch (err) {
    answers.push({ question: '[Automation error]', answer: err.message });
  } finally {
    if (driver) await driver.quit();
  }
  return answers;
}

module.exports = {
  getChatGPTAnswersRobust
}; 