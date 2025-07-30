// Browser automation temporarily disabled. Using API-based approach instead.

/**
 * Stub function for compareAnswers - browser automation is disabled
 * @param {Array} questions - Array of questions
 * @returns {Promise<Array>} Array with disabled message
 */
async function compareAnswers(questions) {
  console.log('⚠️ Browser automation is disabled. Using API-based approach instead.');
  return questions.map(question => ({
    question,
    perplexity: '[Browser automation disabled - use API]',
    chatgpt: '[Browser automation disabled - use API]',
    gemini: '[Browser automation disabled - use API]',
    claude: '[Browser automation disabled - use API]'
  }));
}

module.exports = { compareAnswers };