<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
# LLM Q&A Tool with AI-Powered Confidence Calculation

A React TypeScript application that generates intelligent questions from blog content and provides AI-powered answers using Google's Gemini API.

## 🚀 New Features

### 🔑 Separate API Keys for Questions and Answers

The application now supports using different API keys and models for question generation and answer generation:

- **Question Generation**: Use one API key and model for generating questions
- **Answer Generation**: Use a different API key and model for generating answers
- **Cost Optimization**: Use different models based on task requirements
- **Quota Management**: Manage API quotas separately for different tasks
- **Model Selection**: Choose the best model for each specific task

#### Benefits of Separate API Keys:

1. **Cost Optimization**: Use cheaper models for questions, premium models for answers
2. **Quota Management**: Distribute API usage across different accounts
3. **Model Specialization**: Use models optimized for specific tasks
4. **Risk Mitigation**: Reduce impact of API key issues or rate limits
5. **Team Collaboration**: Different team members can use their own API keys

#### Configuration Options:

- **Question API Key**: API key for question generation
- **Answer API Key**: API key for answer generation  
- **Question Model**: Model selection for questions (Gemini 1.5 Flash, Pro, etc.)
- **Answer Model**: Model selection for answers (Gemini 1.5 Flash, Pro, etc.)

### 🧠 AI-Powered Confidence Calculation

The application now supports two methods for calculating question confidence levels:

### 1. AI-Powered Confidence (Gemini) - **Recommended**
- Uses Gemini API to analyze how relevant each question is to the blog content
- Provides more accurate and nuanced confidence scores
- Considers semantic understanding, not just keyword matching
- Requires additional API calls (increases cost slightly)

### 2. Keyword-Based Confidence (Fast)
- Uses simple keyword matching for confidence calculation
- Faster and doesn't require additional API calls
- Less accurate but sufficient for basic use cases

## 🎯 How AI-Powered Confidence Works

The Gemini-based confidence calculation:

1. **Analyzes Question Relevance**: Evaluates how well each question relates to the blog content
2. **Considers Multiple Factors**:
   - Whether the question can be answered using the content
   - How directly the content addresses the question topic
   - The depth of information available in the content
   - Whether the question asks about concepts, facts, or details present in the content

3. **Provides 0-100 Score**:
   - 0-20: Not relevant at all
   - 21-40: Slightly relevant
   - 41-60: Moderately relevant
   - 61-80: Highly relevant
   - 81-100: Extremely relevant

## 🔧 Configuration

In the Configuration section, you can configure:

### API Keys and Models
- **Question API Key**: API key for question generation
- **Answer API Key**: API key for answer generation  
- **Question Model**: Model selection for questions (Gemini 1.5 Flash, Pro, etc.)
- **Answer Model**: Model selection for answers (Gemini 1.5 Flash, Pro, etc.)

### Confidence Calculation
- **AI-Powered (Gemini)**: More accurate confidence scores using AI analysis
- **Keyword-Based (Fast)**: Faster confidence calculation using keyword matching

## 💡 Benefits of AI-Powered Confidence

1. **Better Question Filtering**: More accurate confidence scores help you identify the most relevant questions
2. **Improved Resource Usage**: Focus on high-confidence questions for better answers
3. **Semantic Understanding**: AI considers meaning, not just word overlap
4. **Context Awareness**: Understands relationships between concepts in the content

## 📊 Example Confidence Scores

| Question | Keyword-Based | AI-Powered | Reason |
|----------|---------------|------------|---------|
| "What are the benefits of cloud computing?" | 50% | 85% | AI understands semantic relevance |
| "How does blockchain work?" | 0% | 15% | AI recognizes topic mismatch |
| "What is machine learning?" | 40% | 75% | AI considers conceptual relevance |

## 🛠️ Technical Implementation

The confidence calculation uses:
- **Batch Processing**: Calculates confidence for all questions in a single API call when possible
- **Fallback Mechanism**: Automatically falls back to keyword-based method if AI calculation fails
- **Error Handling**: Graceful handling of API errors and rate limiting
- **Progress Tracking**: Shows confidence calculation progress in the UI

## 💰 Cost Considerations

- **AI-Powered Confidence**: Adds ~1-2 additional API calls per question generation
- **Keyword-Based Confidence**: No additional API calls
- **Cost Impact**: Minimal - confidence calculation uses efficient prompts and models

## 🎯 Usage Tips

1. **For High-Quality Results**: Use AI-Powered confidence for better question selection
2. **For Speed**: Use Keyword-Based confidence for faster processing
3. **For Budget**: Use Keyword-Based confidence to minimize API costs
4. **For Accuracy**: Use AI-Powered confidence for the most relevant questions

## 🔄 Switching Between Methods

You can switch between confidence calculation methods at any time in the Configuration section. The choice affects:
- Question generation speed
- API usage and costs
- Confidence score accuracy
- Question filtering quality

The application will remember your preference for future sessions. 
=======
# Multi_LLM_Q-A
>>>>>>> a9f0068e8648997ffde0a209606d0896c5532faa
=======
# Mix_LLM
>>>>>>> 784b1b5605980facbde91fc26fba71f25e56cb7f
=======
# genfuze
>>>>>>> 4417237f6429c1eb28af0a223c2fb3ab29098a5d
