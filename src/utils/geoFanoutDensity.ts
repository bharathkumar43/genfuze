import { apiService } from '../services/apiService';
import { QAItem, GEOFanoutAnalysis } from '../types';

/**
 * Calculate and update GEO fanout density for Q&A data
 * @param qaData - Array of Q&A items
 * @param content - Source content
 * @param provider - LLM provider
 * @param model - LLM model
 * @returns Updated Q&A data with fanout analysis
 */
// export async function calculateAndUpdateGEOFanoutDensity(
//   qaData: QAItem[],
//   content: string,
//   provider: string,
//   model: string
// ): Promise<QAItem[]> {
//   console.log('[GEO Fanout] Starting fanout density calculation for', qaData.length, 'Q&A pairs');
  
//   const updatedQAData = [...qaData];
  
//   for (let i = 0; i < updatedQAData.length; i++) {
//     const qaItem = updatedQAData[i];
    
//     try {
//       console.log(`[GEO Fanout] Processing Q&A pair ${i + 1}/${qaData.length}: "${qaItem.question.substring(0, 50)}..."`);
      
//       // Call the GEO fanout density API
//       const fanoutAnalysis = await apiService.trackGEOFanoutDensity({
//         mainQuestion: qaItem.question,
//         content: content,
//         provider: provider,
//         model: model
//       });
      
//       if (fanoutAnalysis.success) {
//         // Update the Q&A item with fanout analysis
//         updatedQAData[i] = {
//           ...qaItem,
//           fanoutAnalysis: fanoutAnalysis
//         };
        
//         console.log(`[GEO Fanout] Successfully calculated fanout density for Q&A pair ${i + 1}:`, {
//           totalFanoutQueries: fanoutAnalysis.summary.totalFanoutQueries,
//           contentAttributed: fanoutAnalysis.summary.contentAttributedAnswers,
//           externalAnswers: fanoutAnalysis.summary.externalAnswers,
//           fanoutDensity: (fanoutAnalysis.summary.fanoutDensity * 100).toFixed(1) + '%'
//         });
//       } else {
//         console.warn(`[GEO Fanout] Failed to calculate fanout density for Q&A pair ${i + 1}:`, fanoutAnalysis.error);
//       }
      
//     } catch (error) {
//       console.error(`[GEO Fanout] Error calculating fanout density for Q&A pair ${i + 1}:`, error);
//       // Continue with other Q&A pairs even if one fails
//     }
//   }
  
//   console.log('[GEO Fanout] Completed fanout density calculation');
//   return updatedQAData;
// }

/**
 * Get comprehensive GEO fanout analysis for a user
 * @param sessionId - Optional session ID to filter analysis
 * @returns Comprehensive fanout analysis
 */
// export async function getComprehensiveGEOFanoutAnalysis(sessionId?: string): Promise<GEOFanoutAnalysis | null> {
//   try {
//     console.log('[GEO Fanout] Getting comprehensive analysis', sessionId ? `for session ${sessionId}` : 'for all sessions');
    
//     const analysis = await apiService.getGEOFanoutAnalysis(sessionId);
    
//     if (analysis.success) {
//       console.log('[GEO Fanout] Comprehensive analysis retrieved successfully');
//       return analysis;
//     } else {
//       console.warn('[GEO Fanout] Failed to get comprehensive analysis:', analysis.error);
//       return null;
//     }
    
//   } catch (error) {
//     console.error('[GEO Fanout] Error getting comprehensive analysis:', error);
//     return null;
//   }
// }

/**
 * Calculate average fanout density across multiple Q&A pairs
 * @param qaData - Array of Q&A items with fanout analysis
 * @returns Average fanout density metrics
 */
// export function calculateAverageFanoutDensity(qaData: QAItem[]): {
//   averageFanoutDensity: number;
//   totalFanoutQueries: number;
//   totalContentAttributed: number;
//   totalExternalAnswers: number;
//   averageAttributionScore: number;
//   qaPairsWithAnalysis: number;
// } {
//   const qaPairsWithAnalysis = qaData.filter(qa => qa.fanoutAnalysis?.success).length;
  
//   if (qaPairsWithAnalysis === 0) {
//     return {
//       averageFanoutDensity: 0,
//       totalFanoutQueries: 0,
//       totalContentAttributed: 0,
//       totalExternalAnswers: 0,
//       averageAttributionScore: 0,
//       qaPairsWithAnalysis: 0
//     };
//   }
  
//   let totalFanoutQueries = 0;
//   let totalContentAttributed = 0;
//   let totalExternalAnswers = 0;
//   let totalAttributionScore = 0;
  
//   qaData.forEach(qa => {
//     if (qa.fanoutAnalysis?.success) {
//       const summary = qa.fanoutAnalysis.summary;
//       totalFanoutQueries += summary.totalFanoutQueries;
//       totalContentAttributed += summary.contentAttributedAnswers;
//       totalExternalAnswers += summary.externalAnswers;
//       totalAttributionScore += summary.averageAttributionScore * summary.totalFanoutQueries;
//     }
//   });
  
//   const averageFanoutDensity = totalFanoutQueries > 0 ? totalContentAttributed / totalFanoutQueries : 0;
//   const averageAttributionScore = totalFanoutQueries > 0 ? totalAttributionScore / totalFanoutQueries : 0;
  
//   return {
//     averageFanoutDensity,
//     totalFanoutQueries,
//     totalContentAttributed,
//     totalExternalAnswers,
//     averageAttributionScore,
//     qaPairsWithAnalysis
//   };
// }

/**
 * Get insights based on fanout density analysis
 * @param qaData - Array of Q&A items with fanout analysis
 * @returns Array of insights and recommendations
 */
// export function getFanoutDensityInsights(qaData: QAItem[]): Array<{
//   type: 'success' | 'warning' | 'info';
//   priority: 'high' | 'medium' | 'low';
//   message: string;
//   recommendation: string;
// }> {
//   const insights: Array<{
//     type: 'success' | 'warning' | 'info';
//     priority: 'high' | 'medium' | 'low';
//     message: string;
//     recommendation: string;
//   }> = [];
  
//   const qaPairsWithAnalysis = qaData.filter(qa => qa.fanoutAnalysis?.success);
  
//   if (qaPairsWithAnalysis.length === 0) {
//     insights.push({
//       type: 'info',
//       priority: 'medium',
//       message: 'No fanout density analysis available',
//       recommendation: 'Generate answers to enable fanout density analysis'
//     });
//     return insights;
//   }
  
//   // Calculate overall metrics
//   const metrics = calculateAverageFanoutDensity(qaData);
  
//   // Fanout density insights
//   if (metrics.averageFanoutDensity < 0.5) {
//     insights.push({
//       type: 'warning',
//       priority: 'high',
//       message: `Low average fanout density (${(metrics.averageFanoutDensity * 100).toFixed(1)}%)`,
//       recommendation: 'Many answers are coming from external knowledge. Consider expanding your content to cover more aspects.'
//     });
//   } else if (metrics.averageFanoutDensity > 0.9) {
//     insights.push({
//       type: 'success',
//       priority: 'medium',
//       message: `Excellent fanout density (${(metrics.averageFanoutDensity * 100).toFixed(1)}%)`,
//       recommendation: 'Your content provides comprehensive coverage. Consider exploring new topics or aspects.'
//     });
//   }
  
//   // Attribution score insights
//   if (metrics.averageAttributionScore < 0.6) {
//     insights.push({
//       type: 'warning',
//       priority: 'high',
//       message: `Low average attribution score (${(metrics.averageAttributionScore * 100).toFixed(1)}%)`,
//       recommendation: 'Answers have low similarity to your content. Review content quality and question generation strategy.'
//     });
//   }
  
//   // Coverage insights
//   const lowCoveragePairs = qaPairsWithAnalysis.filter(qa => 
//     qa.fanoutAnalysis?.summary.fanoutDensity && qa.fanoutAnalysis.summary.fanoutDensity < 0.5
//   );
  
//   if (lowCoveragePairs.length > qaPairsWithAnalysis.length * 0.3) {
//     insights.push({
//       type: 'warning',
//       priority: 'medium',
//       message: `${lowCoveragePairs.length} out of ${qaPairsWithAnalysis.length} Q&A pairs have low content coverage`,
//       recommendation: 'Focus on improving content coverage for topics with low fanout density.'
//     });
//   }
  
//   // Aspect coverage insights
//   const aspectCoverage: { [aspect: string]: { total: number; fromContent: number } } = {};
  
//   qaPairsWithAnalysis.forEach(qa => {
//     if (qa.fanoutAnalysis?.densityMetrics.aspectCoverage) {
//       Object.entries(qa.fanoutAnalysis.densityMetrics.aspectCoverage).forEach(([aspect, coverage]) => {
//         if (!aspectCoverage[aspect]) {
//           aspectCoverage[aspect] = { total: 0, fromContent: 0 };
//         }
//         aspectCoverage[aspect].total += coverage.total;
//         aspectCoverage[aspect].fromContent += coverage.fromContent;
//       });
//     }
//   });
  
//   Object.entries(aspectCoverage).forEach(([aspect, coverage]) => {
//     const coverageRatio = coverage.total > 0 ? coverage.fromContent / coverage.total : 0;
//     if (coverageRatio < 0.5) {
//       insights.push({
//         type: 'info',
//         priority: 'medium',
//         message: `Low content coverage for aspect: ${aspect.replace('_', ' ')}`,
//         recommendation: `Add more content covering ${aspect.replace('_', ' ')} or adjust question focus.`
//       });
//     }
//   });
  
//   return insights;
// } 