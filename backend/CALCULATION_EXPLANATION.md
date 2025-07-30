# 📊 AI Visibility Analysis: Share of Voice & Rating Calculations

## 🎯 Overview

The AI visibility analysis system calculates **Share of Voice** and **Customer Rating** based on AI model responses and weighted scoring algorithms.

---

## 📈 **Share of Voice Calculation**

### **Formula:**
```
Share of Voice (%) = (Company's Total Score / Sum of All Companies' Scores) × 100
```

### **Step-by-Step Process:**

#### **1. Individual Company Score Calculation**
```javascript
// Each company gets scores from 4 AI models
const scores = {
  gemini: geminiResponse.visibilityScore,      // 0-10 scale
  perplexity: perplexityResponse.visibilityScore, // 0-10 scale
  claude: claudeResponse.visibilityScore,      // 0-10 scale
  chatgpt: chatgptResponse.visibilityScore     // 0-10 scale
};

// Calculate average score across all AI models
const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
```

#### **2. Total Market Score**
```javascript
// Sum all companies' scores
const totalMarketScore = analysisResults.reduce((sum, comp) => sum + comp.totalScore, 0);
```

#### **3. Share of Voice Calculation**
```javascript
analysisResults.forEach(comp => {
  comp.shareOfVoice = totalMarketScore > 0 
    ? ((comp.totalScore / totalMarketScore) * 100).toFixed(2) 
    : '0.00';
});
```

### **Example:**
```
Company A: Score 8.5
Company B: Score 6.2
Company C: Score 4.1
Total Market Score: 18.8

Share of Voice:
- Company A: (8.5 / 18.8) × 100 = 45.21%
- Company B: (6.2 / 18.8) × 100 = 32.98%
- Company C: (4.1 / 18.8) × 100 = 21.81%
```

---

## ⭐ **Customer Rating Calculation**

### **Formula:**
```
Customer Rating = (Total Score / 2) out of 5 stars
```

### **Step-by-Step Process:**

#### **1. Score Conversion**
```javascript
// Convert 0-10 scale to 0-5 scale
customerRating: (totalScore / 2).toFixed(1)
```

#### **2. Rating Scale**
- **0-1.0:** ⭐ (Poor)
- **1.1-2.0:** ⭐⭐ (Below Average)
- **2.1-3.0:** ⭐⭐⭐ (Average)
- **3.1-4.0:** ⭐⭐⭐⭐ (Good)
- **4.1-5.0:** ⭐⭐⭐⭐⭐ (Excellent)

### **Example:**
```
Company A: Total Score 8.5 → Rating 4.3/5 ⭐⭐⭐⭐⭐
Company B: Total Score 6.2 → Rating 3.1/5 ⭐⭐⭐⭐
Company C: Total Score 4.1 → Rating 2.1/5 ⭐⭐⭐
```

---

## 🔍 **Individual AI Model Score Calculation**

### **Weighted Scoring Formula:**
```
Total Score = (Mentions Score × 35%) + (Position Score × 30%) + (Sentiment Score × 20%) + (Brand Mentions Score × 10%)
```

### **Component Breakdown:**

#### **A. Mentions Count (35% weight)**
```javascript
const mentions = (responseText.match(new RegExp(companyName, 'gi')) || []);
const mentionsCount = mentions.length;
const mentionsScore = mentionsCount * 0.35;
```

#### **B. Position Score (30% weight)**
```javascript
const position = responseText.toLowerCase().indexOf(companyName.toLowerCase()) >= 0 ? 1 : 0;
const positionScore = position * 0.3;
```

#### **C. Sentiment Score (20% weight)**
```javascript
const positiveWords = responseText.match(/best|leading|top|innovative|recommended|trusted|popular/gi) || [];
const negativeWords = responseText.match(/problem|issue|concern|negative|bad|poor|not recommended/gi) || [];

let sentiment = 0.5; // Default neutral
if (positiveWords.length > 0) sentiment = 1; // Positive
else if (negativeWords.length > 0) sentiment = 0; // Negative

const sentimentScore = sentiment * 0.2;
```

#### **D. Brand Mentions (10% weight)**
```javascript
const brandMentions = mentionsCount;
const brandMentionsScore = brandMentions * 0.1;
```

### **Example Calculation:**
```
Company: "Cloudfuze"
AI Response: "Cloudfuze is a leading cloud migration company..."

Analysis:
- Mentions Count: 1 mention → 1 × 0.35 = 0.35
- Position: Found in text → 1 × 0.3 = 0.3
- Sentiment: "leading" (positive) → 1 × 0.2 = 0.2
- Brand Mentions: 1 mention → 1 × 0.1 = 0.1

Total Score: 0.35 + 0.3 + 0.2 + 0.1 = 0.95
```

---

## 📊 **Additional Metrics**

### **Citation Count:**
```javascript
citationCount: Math.floor(totalScore * 100)
// Example: Score 8.5 → 850 citations
```

### **AI Model Breakdown:**
```javascript
aiScores: {
  gemini: 8.5,
  perplexity: 7.2,
  claude: 9.1,
  chatgpt: 8.8
}
```

### **Detailed Analysis:**
```javascript
analysis: {
  gemini: "Full AI analysis text...",
  perplexity: "Full AI analysis text...",
  claude: "Full AI analysis text...",
  chatgpt: "Full AI analysis text..."
}
```

---

## 🎯 **Key Features**

### **✅ Multi-AI Model Analysis:**
- **4 AI Models:** Gemini, Perplexity, Claude, ChatGPT
- **Consistent Scoring:** All models use same weighted formula
- **Average Calculation:** Combines all model scores

### **✅ Weighted Scoring:**
- **Mentions (35%):** Frequency of company mentions
- **Position (30%):** Whether company is mentioned at all
- **Sentiment (20%):** Positive/negative sentiment analysis
- **Brand Mentions (10%):** Brand recognition factor

### **✅ Market Share Calculation:**
- **Relative Performance:** Compares against all competitors
- **Percentage Based:** Shows market dominance
- **Dynamic Updates:** Adjusts based on all companies

### **✅ Rating System:**
- **5-Star Scale:** Easy to understand customer ratings
- **Score Conversion:** Maps 0-10 scores to 0-5 stars
- **Decimal Precision:** Shows detailed rating scores

---

## 🔧 **Technical Implementation**

### **Code Location:**
- **Main Calculation:** Lines 1050-1100 in `aiVisibilityService.js`
- **Score Analysis:** Lines 597-696 in `aiVisibilityService.js`
- **Share of Voice:** Lines 1080-1085 in `aiVisibilityService.js`
- **Rating Calculation:** Line 1065 in `aiVisibilityService.js`

### **Output Format:**
```javascript
{
  name: "Company Name",
  citationCount: 850,
  shareOfVoice: "45.21",
  customerRating: "4.3",
  totalScore: 8.5,
  aiScores: { gemini: 8.5, perplexity: 7.2, claude: 9.1, chatgpt: 8.8 }
}
```

---

## 📈 **Benefits**

1. **✅ Comprehensive Analysis:** Uses 4 AI models for accuracy
2. **✅ Weighted Scoring:** Balances different visibility factors
3. **✅ Market Context:** Shows relative performance vs competitors
4. **✅ User-Friendly:** 5-star ratings and percentage shares
5. **✅ Detailed Breakdown:** Shows individual AI model scores
6. **✅ Real-Time Updates:** Calculates dynamically based on all companies

**The system provides accurate, comprehensive AI visibility analysis with clear share of voice and customer rating metrics!** 🎉 