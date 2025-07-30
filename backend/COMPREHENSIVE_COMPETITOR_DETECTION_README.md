# 🔍 Comprehensive Competitor Detection System

This system implements the exact same multi-method competitor detection process shown in the backend logs, providing detailed debugging and comprehensive competitor analysis.

## 🎯 Features

### **Multi-Method Detection:**
1. **📰 Industry News Search** - 5 different queries per company
2. **🏢 Public Database Search** - 5 different queries per company  
3. **🌐 Web Search with Relaxed Filtering** - Enhanced filtering criteria
4. **📚 Wikipedia-based Search** - 4 different queries per company

### **AI-Powered Processing:**
- **Competitor Extraction**: AI analyzes search results to extract competitor names
- **Competitor Validation**: AI validates and filters competitors for accuracy
- **Frequency Ranking**: Competitors found by more methods rank higher

### **Comprehensive Debugging:**
- Detailed logging at every step
- Method-by-method breakdown
- Frequency mapping and ranking
- Validation results

## 🚀 Quick Start

### **1. Setup Environment Variables**

Create a `.env` file in the backend directory:

```env
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_google_custom_search_engine_id_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional API Keys
OPENAI_API_KEY=your_openai_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

### **2. Test the System**

#### **Option A: Direct Test Script**
```bash
cd Genfuze/project.webapp/backend
node test-comprehensive-competitor-detection.js
```

#### **Option B: API Test Server**
```bash
cd Genfuze/project.webapp/backend
node test-competitor-api.js
```

Then visit: `http://localhost:5001/api/test-competitors/Cloudfuze?industry=Cloud`

#### **Option C: Integration with Main Server**
The system is already integrated into the main AI visibility analysis.

## 📊 Detailed Process Flow

### **Step 1: Initial Search**
```
🔍 Search query: "Cloudfuze competitors Cloud"
📈 Found 10 initial search results
```

### **Step 2: Multi-Method Detection**

#### **Method 1: Industry News Search**
```
📰 Method 1: Industry news search...
🔍 Industry news query 1: "Cloudfuze vs competitors"
🔍 Industry news query 2: "Cloudfuze market analysis"
🔍 Industry news query 3: "Cloudfuze industry report"
🔍 Industry news query 4: "Cloudfuze competitive landscape"
🔍 Industry news query 5: "Cloudfuze market share analysis"
✅ Found 33 competitors via industry news
```

#### **Method 2: Public Database Search**
```
🏢 Method 2: Public company database search...
🔍 Public database query 1: "Cloudfuze company profile"
🔍 Public database query 2: "Cloudfuze competitors list"
🔍 Public database query 3: "Cloudfuze industry competitors"
🔍 Public database query 4: "Cloudfuze market competitors"
🔍 Public database query 5: "Cloudfuze business competitors"
✅ Found 10 competitors via public database
```

#### **Method 3: Web Search with Relaxed Filtering**
```
🌐 Method 3: Web search with relaxed filtering...
🎯 Extracted 23 competitors with relaxed filtering
```

#### **Method 4: Wikipedia-based Search**
```
📚 Method 4: Wikipedia-based search...
🔍 Wikipedia query 1: "Cloudfuze wikipedia competitors"
🔍 Wikipedia query 2: "Cloudfuze wikipedia alternative companies"
🔍 Wikipedia query 3: "Cloudfuze wikipedia industry companies"
🔍 Wikipedia query 4: "Cloudfuze wikipedia market companies"
✅ Found 0 competitors via Wikipedia
```

### **Step 3: Result Combination**
```
📊 Combining results from all methods...
📈 Method results: {
  industryNews: [...],
  publicDatabase: [...],
  webSearch: [...],
  wikipedia: [...]
}
📊 Total unique competitors found: 46
📈 Frequency map: {
  "Quest On Demand Migration": 2,
  "AvePoint Confidence": 2,
  "Box": 2,
  ...
}
```

### **Step 4: Frequency Ranking**
```
📈 Ranked competitors by frequency:
  1. Quest On Demand Migration (frequency: 2)
  2. AvePoint Confidence (frequency: 2)
  3. Box (frequency: 2)
  4. Progress ShareFile (frequency: 2)
  5. Wiz (frequency: 2)
  ...
```

### **Step 5: AI Validation**
```
✅ Validating competitors with AI...
🤖 Validating 46 competitors for "Cloudfuze"
📝 Sending validation prompt to AI...
✅ Validation complete: 16 valid competitors
🎯 Final validated competitors: [
  "Quest On Demand Migration",
  "AvePoint Confidence",
  "Progress ShareFile",
  ...
]
```

## 🔧 API Usage

### **Main Function**
```javascript
const { detectCompetitorsComprehensive } = require('./comprehensiveCompetitorDetection');

const competitors = await detectCompetitorsComprehensive('Cloudfuze', searchResults);
```

### **Individual Methods**
```javascript
const { 
  searchIndustryNewsCompetitors,
  searchPublicCompanyDatabase,
  extractCompetitorsWithRelaxedFiltering,
  searchWikipediaCompetitors
} = require('./comprehensiveCompetitorDetection');

// Use individual methods
const industryNewsCompetitors = await searchIndustryNewsCompetitors('Cloudfuze');
const publicDbCompetitors = await searchPublicCompanyDatabase('Cloudfuze');
```

## 📈 Expected Output

### **Console Logs:**
```
[DEBUG] ==========================================
[DEBUG] COMPETITOR DETECTION STARTED
[DEBUG] ==========================================
[DEBUG] Target company: "Cloudfuze"
[DEBUG] Search results available: 10

[DEBUG] Method 1: Industry news search...
[DEBUG] Industry news search completed. Found 33 competitors
[DEBUG] Found competitors via industry news: ["Quest On Demand Migration", "AvePoint Confidence", ...]

[DEBUG] Method 2: Public company database search...
[DEBUG] Public database search completed. Found 10 competitors
[DEBUG] Found competitors via public database: ["Quest On Demand Migration", "AvePoint Confidence", ...]

[DEBUG] Method 3: Improved web search with relaxed filtering...
[DEBUG] Web search with relaxed filtering completed. Found 23 competitors
[DEBUG] Found competitors via relaxed filtering: ["ShareGate", "Quest", "AvePoint", ...]

[DEBUG] Method 4: Wikipedia-based search...
[DEBUG] Wikipedia search completed. Found 0 competitors

[DEBUG] ==========================================
[DEBUG] COMBINING RESULTS FROM ALL METHODS
[DEBUG] ==========================================
[DEBUG] Total unique competitors found: 46
[DEBUG] Frequency map: { "Quest On Demand Migration": 2, "AvePoint Confidence": 2, ... }

[DEBUG] Ranked competitors by frequency:
  1. Quest On Demand Migration (frequency: 2)
  2. AvePoint Confidence (frequency: 2)
  3. Box (frequency: 2)
  ...

[DEBUG] ==========================================
[DEBUG] VALIDATING COMPETITORS
[DEBUG] ==========================================
[DEBUG] Final validated competitors: 16
```

### **Final Results:**
```javascript
[
  "Quest On Demand Migration",
  "AvePoint Confidence", 
  "Progress ShareFile",
  "MultCloud",
  "ShareGate",
  "CloudZero",
  "BitTitan",
  "CloudHealth by VMware",
  "odrive",
  "cloudHQ",
  "AvePoint",
  "CloudMounter",
  "CloudHQ",
  "Air Explorer",
  "Cloudsfer",
  "CloudHealth"
]
```

## 🎯 Key Benefits

1. **Comprehensive Coverage**: 4 different detection methods
2. **AI-Powered Accuracy**: AI extraction and validation
3. **Frequency Ranking**: More reliable competitors ranked higher
4. **Detailed Debugging**: Full visibility into the process
5. **Rate Limiting**: Built-in delays to avoid API limits
6. **Error Handling**: Graceful fallback if any method fails

## 🔧 Configuration

### **Search Queries per Method:**

#### **Industry News (5 queries):**
- `{company} vs competitors`
- `{company} market analysis`
- `{company} industry report`
- `{company} competitive landscape`
- `{company} market share analysis`

#### **Public Database (5 queries):**
- `{company} company profile`
- `{company} competitors list`
- `{company} industry competitors`
- `{company} market competitors`
- `{company} business competitors`

#### **Wikipedia (4 queries):**
- `{company} wikipedia competitors`
- `{company} wikipedia alternative companies`
- `{company} wikipedia industry companies`
- `{company} wikipedia market companies`

### **Rate Limiting:**
- 1 second delay between individual queries
- 2 second delay between methods
- Retry logic for failed requests

## 🚀 Integration

This system is already integrated into the main AI visibility analysis and can be used as a standalone competitor detection service.

The comprehensive competitor detection provides the foundation for accurate AI visibility analysis across multiple AI models. 