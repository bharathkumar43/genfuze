import { QAItem } from '../types';

export interface VectorSimilarityResult {
  index: number;
  questionSimilarity?: number;
  answerSimilarity?: number;
  contentSimilarity?: number;
  questionConfidence?: string;
  answerConfidence?: string;
  contentConfidence?: string;
}

/**
 * Calculate semantic similarity between two texts using word overlap and semantic analysis
 */
function calculateSemanticSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Convert to lowercase and split into words
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Calculate Jaccard similarity
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  const jaccardSimilarity = union.length > 0 ? intersection.length / union.length : 0;
  
  // Calculate cosine similarity (simplified)
  const wordFreq1: { [key: string]: number } = {};
  const wordFreq2: { [key: string]: number } = {};
  
  words1.forEach(word => wordFreq1[word] = (wordFreq1[word] || 0) + 1);
  words2.forEach(word => wordFreq2[word] = (wordFreq2[word] || 0) + 1);
  
  const allWords = [...new Set([...words1, ...words2])];
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  allWords.forEach(word => {
    const freq1 = wordFreq1[word] || 0;
    const freq2 = wordFreq2[word] || 0;
    dotProduct += freq1 * freq2;
    norm1 += freq1 * freq1;
    norm2 += freq2 * freq2;
  });
  
  const cosineSimilarity = (norm1 > 0 && norm2 > 0) ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
  
  // Calculate semantic similarity using key concepts
  const keyConcepts1 = extractKeyConcepts(text1);
  const keyConcepts2 = extractKeyConcepts(text2);
  const conceptOverlap = keyConcepts1.filter(concept => keyConcepts2.includes(concept)).length;
  const conceptSimilarity = (keyConcepts1.length + keyConcepts2.length) > 0 ? 
    (2 * conceptOverlap) / (keyConcepts1.length + keyConcepts2.length) : 0;
  
  // Combine all similarities with weights
  const combinedSimilarity = (jaccardSimilarity * 0.3) + (cosineSimilarity * 0.4) + (conceptSimilarity * 0.3);
  
  return Math.min(1, Math.max(0, combinedSimilarity));
}

/**
 * Extract key concepts from text for better semantic matching
 */
function extractKeyConcepts(text: string): string[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'they', 'have', 'from', 'their', 'will', 'would', 'could', 'should', 'been', 'said', 'each', 'which', 'she', 'do', 'how', 'her', 'if', 'go', 'me', 'my', 'has', 'but', 'our', 'one', 'other', 'out', 'so', 'than', 'too', 'use', 'very', 'want', 'way', 'well', 'what', 'when', 'where', 'who', 'why', 'year', 'your', 'can', 'just', 'now', 'over', 'take', 'then', 'them', 'these', 'those', 'upon', 'us', 'was', 'were', 'word', 'work', 'world', 'would', 'write', 'written', 'yet']);
  
  const conceptWords = words.filter(word => !stopWords.has(word));
  
  // Count frequency and return most common concepts
  const wordFreq: { [key: string]: number } = {};
  conceptWords.forEach(word => wordFreq[word] = (wordFreq[word] || 0) + 1);
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Calculate vector similarities for Q&A pairs and update the QAItem objects
 */
export async function calculateAndUpdateVectorSimilarities(
  qaData: QAItem[],
  content?: string
): Promise<QAItem[]> {
  if (qaData.length === 0) {
    return qaData;
  }

  try {
    console.log('[Vector Similarity] Calculating similarities for', qaData.length, 'Q&A pairs');
    
    // Update QAItem objects with similarity data
    const updatedQaData = qaData.map((qa, index) => {
      let questionSimilarity = 0;
      let answerSimilarity = 0;
      let contentSimilarity = 0;
      
      // Calculate question similarity with other questions
      if (qaData.length > 1) {
        const otherQuestions = qaData.filter((_, i) => i !== index).map(q => q.question);
        const similarities = otherQuestions.map(q => calculateSemanticSimilarity(qa.question, q));
        questionSimilarity = similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0;
      }
      
      // Calculate answer similarity with other answers
      if (qaData.length > 1 && qa.answer) {
        const otherAnswers = qaData.filter((_, i) => i !== index && qaData[i].answer).map(q => q.answer);
        const similarities = otherAnswers.map(a => calculateSemanticSimilarity(qa.answer, a));
        answerSimilarity = similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0;
      }
      
      // Calculate content similarity (how well answer matches the source content)
      if (content && qa.answer) {
        contentSimilarity = calculateSemanticSimilarity(qa.answer, content);
      }
      
      return {
        ...qa,
        questionSimilarity: questionSimilarity,
        answerSimilarity: answerSimilarity,
        contentSimilarity: contentSimilarity,
        questionConfidence: getConfidenceLevel(questionSimilarity),
        answerConfidence: getConfidenceLevel(answerSimilarity),
        contentConfidence: getConfidenceLevel(contentSimilarity),
        vectorSimilarity: contentSimilarity ? `${(contentSimilarity * 100).toFixed(1)}%` : null
      };
    });

    console.log('[Vector Similarity] Successfully updated', updatedQaData.length, 'Q&A pairs with similarity data');
    return updatedQaData;

  } catch (error) {
    console.error('[Vector Similarity] Error calculating similarities:', error);
    return qaData; // Return original data if calculation fails
  }
}

/**
 * Get a summary of vector similarity statistics
 */
export function getVectorSimilarityStats(qaData: QAItem[]) {
  const stats = {
    totalPairs: qaData.length,
    questionSimilarities: [] as number[],
    answerSimilarities: [] as number[],
    contentSimilarities: [] as number[],
    averageQuestionSimilarity: 0,
    averageAnswerSimilarity: 0,
    averageContentSimilarity: 0,
    highSimilarityCount: 0,
    mediumSimilarityCount: 0,
    lowSimilarityCount: 0
  };

  qaData.forEach(qa => {
    if (qa.questionSimilarity !== undefined) {
      stats.questionSimilarities.push(qa.questionSimilarity);
    }
    if (qa.answerSimilarity !== undefined) {
      stats.answerSimilarities.push(qa.answerSimilarity);
    }
    if (qa.contentSimilarity !== undefined) {
      stats.contentSimilarities.push(qa.contentSimilarity);
      
      // Count similarity levels
      if (qa.contentSimilarity >= 0.8) {
        stats.highSimilarityCount++;
      } else if (qa.contentSimilarity >= 0.6) {
        stats.mediumSimilarityCount++;
      } else {
        stats.lowSimilarityCount++;
      }
    }
  });

  // Calculate averages
  if (stats.questionSimilarities.length > 0) {
    stats.averageQuestionSimilarity = stats.questionSimilarities.reduce((a, b) => a + b, 0) / stats.questionSimilarities.length;
  }
  if (stats.answerSimilarities.length > 0) {
    stats.averageAnswerSimilarity = stats.answerSimilarities.reduce((a, b) => a + b, 0) / stats.answerSimilarities.length;
  }
  if (stats.contentSimilarities.length > 0) {
    stats.averageContentSimilarity = stats.contentSimilarities.reduce((a, b) => a + b, 0) / stats.contentSimilarities.length;
  }

  return stats;
}

/**
 * Get confidence level based on similarity score
 */
export function getConfidenceLevel(similarity: number): string {
  if (similarity >= 0.9) return 'Very High';
  if (similarity >= 0.8) return 'High';
  if (similarity >= 0.7) return 'Good';
  if (similarity >= 0.6) return 'Moderate';
  if (similarity >= 0.5) return 'Low';
  return 'Very Low';
}

/**
 * Get color class based on similarity score
 */
export function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.9) return 'text-emerald-600';
  if (similarity >= 0.8) return 'text-green-600';
  if (similarity >= 0.7) return 'text-blue-600';
  if (similarity >= 0.6) return 'text-yellow-600';
  if (similarity >= 0.5) return 'text-orange-600';
  return 'text-red-600';
} 