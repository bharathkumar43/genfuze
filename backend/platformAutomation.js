// Browser automation temporarily disabled. See browserAutomation.js for current implementation.
/*
const { chromium } = require('playwright');
const path = require('path');

const userDataDir = 'C:/Users/eswar/AppData/Local/Google/Chrome/User Data';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function getPerplexityAnswer(page, question) {
  try {
    await page.goto('https://www.perplexity.ai/');
    try {
      await page.waitForSelector('button[aria-label="Close"]', { timeout: 5000 });
      await page.click('button[aria-label="Close"]');
    } catch {}
    await page.waitForSelector('div[contenteditable="true"]');
    await page.click('div[contenteditable="true"]');
    await page.type('div[contenteditable="true"]', question, { delay: 50 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(12000);
    let answer = '';
    try {
      await page.waitForSelector('.text-textMain', { timeout: 30000 });
      const answerElems = await page.$$('.text-textMain');
      if (answerElems.length > 0) {
        answer = await answerElems[answerElems.length - 1].textContent();
      }
    } catch (e) {
      console.error('Perplexity answer extraction failed:', e);
    }
    return answer || '[Answer not found]';
  } catch (err) {
    console.error('Perplexity automation error:', err);
    return '[Automation error: ' + err.message + ']';
  }
}

async function getChatGPTAnswer(page, question) {
  try {
    await page.goto('https://chat.openai.com/');
    await page.waitForSelector('textarea');
    await page.fill('textarea', question);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(12000);
    let answer = '';
    try {
      await page.waitForSelector('.markdown.prose, .text-base', { timeout: 30000 });
      const answerElem = await page.$('.markdown.prose, .text-base');
      if (answerElem) {
        answer = await answerElem.textContent();
      }
    } catch {}
    return answer || '[Answer not found]';
  } catch (err) {
    console.error('ChatGPT automation error:', err);
    return '[Automation error: ' + err.message + ']';
  }
}

async function getGeminiAnswer(page, question) {
  try {
    await page.goto('https://gemini.google.com/');
    await page.waitForTimeout(5000);
    await page.waitForSelector('textarea', { timeout: 60000 });
    await page.fill('textarea', question);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    let answer = '';
    try {
      await page.waitForSelector('.response-text, .markdown', { timeout: 30000 });
      const answerElem = await page.$('.response-text, .markdown');
      if (answerElem) {
        answer = await answerElem.textContent();
      }
    } catch {}
    return answer || '[Answer not found]';
  } catch (err) {
    console.error('Gemini automation error:', err);
    return '[Automation error: ' + err.message + ']';
  }
}

async function getClaudeAnswer(page, question) {
  try {
    await page.goto('https://claude.ai/');
    await page.waitForSelector('textarea');
    await page.fill('textarea', question);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(12000);
    let answer = '';
    try {
      await page.waitForSelector('.message-content', { timeout: 30000 });
      const answerElem = await page.$('.message-content');
      if (answerElem) {
        answer = await answerElem.textContent();
      }
    } catch {}
    return answer || '[Answer not found]';
  } catch (err) {
    console.error('Claude automation error:', err);
    return '[Automation error: ' + err.message + ']';
  }
}

async function compareAnswers(questions) {
  const results = [];
  const browserPerplexity = await chromium.launch({ headless: false });
  const pagePerplexity = await browserPerplexity.newPage();
  const browserPersistent = await chromium.launchPersistentContext(userDataDir, {
    executablePath: chromePath,
    headless: false,
  });
  const pageChatGPT = await browserPersistent.newPage();
  const pageGemini = await browserPersistent.newPage();
  const pageClaude = await browserPersistent.newPage();
  for (const question of questions) {
    const row = { question };
    row.perplexity = await getPerplexityAnswer(pagePerplexity, question);
    row.chatgpt = await getChatGPTAnswer(pageChatGPT, question);
    row.gemini = await getGeminiAnswer(pageGemini, question);
    row.claude = await getClaudeAnswer(pageClaude, question);
    results.push(row);
  }
  await browserPerplexity.close();
  await browserPersistent.close();
  return results;
}

module.exports = { compareAnswers };
*/ 