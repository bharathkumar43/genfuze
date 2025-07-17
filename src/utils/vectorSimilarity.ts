// import { apiService } from '../services/apiService';
// import { QAItem } from '../types';

// export interface VectorSimilarityResult {
//   index: number;
//   questionSimilarity?: number;
//   answerSimilarity?: number;
//   contentSimilarity?: number;
//   questionConfidence?: string;
//   answerConfidence?: string;
//   contentConfidence?: string;
// }

// /**
//  * Calculate vector similarities for Q&A pairs and update the QAItem objects
//  */
// export async function calculateAndUpdateVectorSimilarities(
//   qaData: QAItem[],
//   content?: string
// ): Promise<QAItem[]> {
//   if (qaData.length === 0) {
//     return qaData;
//   }

//   try {
//     console.log('[Vector Similarity] Calculating similarities for', qaData.length, 'Q&A pairs');
    
//     // Prepare data for API call
//     const qaDataForAPI = qaData.map(qa => ({
//       question: qa.question,
//       answer: qa.answer
//     }));

//     // Call the API to calculate similarities
//     const response = await apiService.calculateVectorSimilarities(qaDataForAPI, content);
    
//     if (!response.success) {
//       console.error('[Vector Similarity] API call failed:', response);
//       return qaData;
//     }

//     // Update QAItem objects with similarity data
//     const updatedQaData = qaData.map((qa, index) => {
//       const similarityResult = response.results.find((result: VectorSimilarityResult) => result.index === index);
      
//       if (similarityResult) {
//         return {
//           ...qa,
//           questionSimilarity: similarityResult.questionSimilarity,
//           answerSimilarity: similarityResult.answerSimilarity,
//           contentSimilarity: similarityResult.contentSimilarity,
//           questionConfidence: similarityResult.questionConfidence,
//           answerConfidence: similarityResult.answerConfidence,
//           contentConfidence: similarityResult.contentConfidence
//         };
//       }
      
//       return qa;
//     });

//     console.log('[Vector Similarity] Successfully updated', updatedQaData.length, 'Q&A pairs with similarity data');
//     return updatedQaData;

//   } catch (error) {
//     console.error('[Vector Similarity] Error calculating similarities:', error);
//     return qaData; // Return original data if calculation fails
//   }
// }

// /**
//  * Get a summary of vector similarity statistics
//  */
// export function getVectorSimilarityStats(qaData: QAItem[]) {
//   const stats = {
//     totalPairs: qaData.length,
//     questionSimilarities: [] as number[],
//     answerSimilarities: [] as number[],
//     contentSimilarities: [] as number[],
//     averageQuestionSimilarity: 0,
//     averageAnswerSimilarity: 0,
//     averageContentSimilarity: 0,
//     highSimilarityCount: 0,
//     mediumSimilarityCount: 0,
//     lowSimilarityCount: 0
//   };

//   qaData.forEach(qa => {
//     if (qa.questionSimilarity !== undefined) {
//       stats.questionSimilarities.push(qa.questionSimilarity);
//     }
//     if (qa.answerSimilarity !== undefined) {
//       stats.answerSimilarities.push(qa.answerSimilarity);
//     }
//     if (qa.contentSimilarity !== undefined) {
//       stats.contentSimilarities.push(qa.contentSimilarity);
      
//       // Count similarity levels
//       if (qa.contentSimilarity >= 0.8) {
//         stats.highSimilarityCount++;
//       } else if (qa.contentSimilarity >= 0.6) {
//         stats.mediumSimilarityCount++;
//       } else {
//         stats.lowSimilarityCount++;
//       }
//     }
//   });

//   // Calculate averages
//   if (stats.questionSimilarities.length > 0) {
//     stats.averageQuestionSimilarity = stats.questionSimilarities.reduce((a, b) => a + b, 0) / stats.questionSimilarities.length;
//   }
//   if (stats.answerSimilarities.length > 0) {
//     stats.averageAnswerSimilarity = stats.answerSimilarities.reduce((a, b) => a + b, 0) / stats.answerSimilarities.length;
//   }
//   if (stats.contentSimilarities.length > 0) {
//     stats.averageContentSimilarity = stats.contentSimilarities.reduce((a, b) => a + b, 0) / stats.contentSimilarities.length;
//   }

//   return stats;
// }

// /**
//  * Get confidence level based on similarity score
//  */
// export function getConfidenceLevel(similarity: number): string {
//   if (similarity >= 0.9) return 'Very High';
//   if (similarity >= 0.8) return 'High';
//   if (similarity >= 0.7) return 'Good';
//   if (similarity >= 0.6) return 'Moderate';
//   if (similarity >= 0.5) return 'Low';
//   return 'Very Low';
// }

// /**
//  * Get color class based on similarity score
//  */
// export function getSimilarityColor(similarity: number): string {
//   if (similarity >= 0.9) return 'text-emerald-600';
//   if (similarity >= 0.8) return 'text-green-600';
//   if (similarity >= 0.7) return 'text-blue-600';
//   if (similarity >= 0.6) return 'text-yellow-600';
//   if (similarity >= 0.5) return 'text-orange-600';
//   return 'text-red-600';
// } 