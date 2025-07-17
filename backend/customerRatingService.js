const axios = require('axios');

class CustomerRatingService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async analyzeCustomerRating(domain) {
    try {
      console.log(`[Customer Rating] Analyzing customer ratings for: ${domain}`);
      
      const analysis = {
        overallRating: 0,
        totalReviews: 0,
        positiveReviews: 0,
        negativeReviews: 0,
        neutralReviews: 0,
        sentimentScore: 0,
        customerSatisfaction: 0,
        responseRate: 0,
        averageResponseTime: 0,
        reviewVelocity: 0,
        trustScore: 0,
        recommendationRate: 0,
        lastUpdated: new Date().toISOString()
      };

      // Simulate comprehensive customer rating analysis
      const results = await this.performRatingAnalysis(domain);
      
      return {
        success: true,
        domain: domain,
        analysis: { ...analysis, ...results }
      };
      
    } catch (error) {
      console.error(`[Customer Rating] Error for ${domain}:`, error);
      return {
        success: false,
        domain: domain,
        error: error.message
      };
    }
  }

  async performRatingAnalysis(domain) {
    // Simulated customer rating analysis with realistic data
    const ratingMap = {
      'google.com': {
        overallRating: 4.6,
        totalReviews: 2500000,
        positiveReviews: 2200000,
        negativeReviews: 150000,
        neutralReviews: 150000,
        sentimentScore: 0.82,
        customerSatisfaction: 92,
        responseRate: 85,
        averageResponseTime: 2.5,
        reviewVelocity: 1500,
        trustScore: 94,
        recommendationRate: 89
      },
      'microsoft.com': {
        overallRating: 4.2,
        totalReviews: 1800000,
        positiveReviews: 1500000,
        negativeReviews: 200000,
        neutralReviews: 100000,
        sentimentScore: 0.72,
        customerSatisfaction: 84,
        responseRate: 78,
        averageResponseTime: 3.2,
        reviewVelocity: 1200,
        trustScore: 88,
        recommendationRate: 76
      },
      'amazon.com': {
        overallRating: 4.4,
        totalReviews: 3500000,
        positiveReviews: 3000000,
        negativeReviews: 250000,
        neutralReviews: 250000,
        sentimentScore: 0.79,
        customerSatisfaction: 88,
        responseRate: 92,
        averageResponseTime: 1.8,
        reviewVelocity: 2500,
        trustScore: 91,
        recommendationRate: 82
      },
      'apple.com': {
        overallRating: 4.7,
        totalReviews: 2200000,
        positiveReviews: 2000000,
        negativeReviews: 120000,
        neutralReviews: 80000,
        sentimentScore: 0.85,
        customerSatisfaction: 94,
        responseRate: 88,
        averageResponseTime: 2.1,
        reviewVelocity: 1800,
        trustScore: 95,
        recommendationRate: 91
      },
      'facebook.com': {
        overallRating: 3.8,
        totalReviews: 2800000,
        positiveReviews: 1800000,
        negativeReviews: 600000,
        neutralReviews: 400000,
        sentimentScore: 0.43,
        customerSatisfaction: 62,
        responseRate: 45,
        averageResponseTime: 5.5,
        reviewVelocity: 2000,
        trustScore: 68,
        recommendationRate: 54
      }
    };

    // Generate realistic data for unknown domains
    if (!ratingMap[domain]) {
      return this.generateRealisticRatingData(domain);
    }

    return ratingMap[domain];
  }

  generateRealisticRatingData(domain) {
    // Generate realistic rating data based on domain characteristics
    const domainLength = domain.length;
    const hasNumbers = /\d/.test(domain);
    const hasHyphens = domain.includes('-');
    
    // Base metrics
    let baseRating = 3.5;
    let baseReviews = 500;
    let baseSatisfaction = 70;
    
    // Adjust based on domain characteristics
    if (domainLength < 10) {
      baseRating += 0.3;
      baseReviews *= 1.5;
      baseSatisfaction += 5;
    }
    
    if (hasNumbers) {
      baseRating -= 0.2;
      baseReviews *= 0.8;
      baseSatisfaction -= 3;
    }
    
    if (hasHyphens) {
      baseRating -= 0.1;
      baseReviews *= 0.9;
      baseSatisfaction -= 2;
    }
    
    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4;
    const rating = Math.min(5, Math.max(1, baseRating * randomFactor));
    const reviews = Math.floor(baseReviews * randomFactor);
    const satisfaction = Math.min(100, Math.max(0, baseSatisfaction * randomFactor));
    
    const positiveReviews = Math.floor(reviews * (rating / 5) * 0.8);
    const negativeReviews = Math.floor(reviews * ((5 - rating) / 5) * 0.6);
    const neutralReviews = reviews - positiveReviews - negativeReviews;
    
    return {
      overallRating: Math.round(rating * 10) / 10,
      totalReviews: reviews,
      positiveReviews: positiveReviews,
      negativeReviews: negativeReviews,
      neutralReviews: neutralReviews,
      sentimentScore: Math.round((positiveReviews / reviews) * 100) / 100,
      customerSatisfaction: Math.round(satisfaction),
      responseRate: Math.floor(60 + Math.random() * 30),
      averageResponseTime: Math.round((1 + Math.random() * 5) * 10) / 10,
      reviewVelocity: Math.floor(50 + Math.random() * 200),
      trustScore: Math.floor(satisfaction * 0.9 + Math.random() * 10),
      recommendationRate: Math.floor(satisfaction * 0.8 + Math.random() * 15)
    };
  }

  async analyzeMultipleRatings(domains) {
    const results = [];
    
    for (const domain of domains) {
      try {
        const result = await this.analyzeCustomerRating(domain);
        results.push(result);
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`[Customer Rating] Error for ${domain}:`, error);
        results.push({
          success: false,
          domain: domain,
          error: error.message
        });
      }
    }
    
    return results;
  }

  calculateRatingScore(analysis) {
    if (!analysis || !analysis.success) return 0;
    
    const data = analysis.analysis;
    let score = 0;
    
    // Overall Rating (0-30 points)
    score += (data.overallRating / 5) * 30;
    
    // Customer Satisfaction (0-25 points)
    score += (data.customerSatisfaction / 100) * 25;
    
    // Sentiment Score (0-20 points)
    score += data.sentimentScore * 20;
    
    // Trust Score (0-15 points)
    score += (data.trustScore / 100) * 15;
    
    // Recommendation Rate (0-10 points)
    score += (data.recommendationRate / 100) * 10;
    
    return Math.round(score);
  }

  getRatingGrade(score) {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500' };
    if (score >= 70) return { grade: 'B+', color: 'text-blue-600' };
    if (score >= 60) return { grade: 'B', color: 'text-blue-500' };
    if (score >= 50) return { grade: 'C+', color: 'text-yellow-600' };
    if (score >= 40) return { grade: 'C', color: 'text-yellow-500' };
    if (score >= 30) return { grade: 'D+', color: 'text-orange-600' };
    if (score >= 20) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-600' };
  }

  getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return {
      fullStars,
      hasHalfStar,
      emptyStars,
      rating: Math.round(rating * 10) / 10
    };
  }
}

module.exports = CustomerRatingService; 