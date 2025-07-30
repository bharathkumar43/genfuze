// import React, { useState, useEffect } from 'react';
// import { TrendingUp, Target, FileText, BarChart3, Info, Zap, Activity, Gauge, ChevronDown, ChevronUp } from 'lucide-react';

// interface VectorSimilarityProps {
//   questionSimilarity?: number;
//   answerSimilarity?: number;
//   contentSimilarity?: number;
//   questionConfidence?: string;
//   answerConfidence?: string;
//   contentConfidence?: string;
//   showDetails?: boolean;
//   vectorData?: {
//     embeddings: number[];
//     dimensions: number;
//     model: string;
//   };
// }

// export function VectorSimilarity({
//   questionSimilarity,
//   answerSimilarity,
//   contentSimilarity,
//   questionConfidence,
//   answerConfidence,
//   contentConfidence,
//   showDetails = false,
//   vectorData
// }: VectorSimilarityProps) {
//   const [isExpanded, setIsExpanded] = useState(showDetails);
//   const [animatedValues, setAnimatedValues] = useState({
//     question: 0,
//     answer: 0,
//     content: 0
//   });

//   useEffect(() => {
//     const animateValues = () => {
//       const duration = 1500;
//       const steps = 60;
//       const stepDuration = duration / steps;

//       let currentStep = 0;
//       const timer = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
        
//         setAnimatedValues({
//           question: (questionSimilarity || 0) * progress,
//           answer: (answerSimilarity || 0) * progress,
//           content: (contentSimilarity || 0) * progress
//         });

//         if (currentStep >= steps) {
//           clearInterval(timer);
//         }
//       }, stepDuration);

//       return () => clearInterval(timer);
//     };

//     if (questionSimilarity || answerSimilarity || contentSimilarity) {
//       animateValues();
//     }
//   }, [questionSimilarity, answerSimilarity, contentSimilarity]);

//   const getConfidenceColor = (confidence?: string) => {
//     switch (confidence) {
//       case 'Very High': return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
//       case 'High': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800';
//       case 'Good': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800';
//       case 'Moderate': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
//       case 'Low': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800';
//       case 'Very Low': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800';
//       default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800';
//     }
//   };

//   const getSimilarityColor = (similarity?: number) => {
//     if (!similarity) return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400';
//     if (similarity >= 0.9) return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400';
//     if (similarity >= 0.8) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
//     if (similarity >= 0.7) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
//     if (similarity >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
//     if (similarity >= 0.5) return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400';
//     return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
//   };

//   const getSimilarityIcon = (similarity?: number) => {
//     if (!similarity) return 'text-gray-400';
//     if (similarity >= 0.8) return 'text-emerald-500';
//     if (similarity >= 0.6) return 'text-blue-500';
//     return 'text-orange-500';
//   };

//   const getSimilarityGradient = (similarity?: number) => {
//     if (!similarity) return 'from-gray-400 to-gray-500';
//     if (similarity >= 0.9) return 'from-emerald-500 to-emerald-600';
//     if (similarity >= 0.8) return 'from-green-500 to-green-600';
//     if (similarity >= 0.7) return 'from-blue-500 to-blue-600';
//     if (similarity >= 0.6) return 'from-yellow-500 to-yellow-600';
//     if (similarity >= 0.5) return 'from-orange-500 to-orange-600';
//     return 'from-red-500 to-red-600';
//   };

//   const getQualityScore = () => {
//     const values = [questionSimilarity, answerSimilarity, contentSimilarity].filter(v => v !== undefined);
//     if (values.length === 0) return 0;
//     return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
//   };

//   if (!questionSimilarity && !answerSimilarity && !contentSimilarity) {
//     return null;
//   }

//   const qualityScore = getQualityScore();

//   return (
//     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
//               <BarChart3 className="w-6 h-6" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold">Vector Similarity Analysis</h2>
//               <p className="text-purple-100 text-sm">AI-powered content matching and relevance scoring</p>
//             </div>
//           </div>
//           <button
//             onClick={() => setIsExpanded(!isExpanded)}
//             className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
//           >
//             {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
//           </button>
//         </div>
//       </div>

//       {/* Quality Score */}
//       <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Quality Score</h3>
//           <div className="flex items-center gap-2">
//             <Gauge className="w-5 h-5 text-blue-600" />
//             <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
//               {(qualityScore * 100).toFixed(1)}%
//             </span>
//           </div>
//         </div>
//         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
//           <div
//             className={`h-full bg-gradient-to-r ${getSimilarityGradient(qualityScore)} transition-all duration-1000 ease-out`}
//             style={{ width: `${qualityScore * 100}%` }}
//           />
//         </div>
//       </div>

//       {/* Similarity Metrics */}
//       <div className="p-6">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Question Similarity */}
//           {questionSimilarity !== undefined && (
//             <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
//                   <Target className={`w-5 h-5 ${getSimilarityIcon(questionSimilarity)}`} />
//                 </div>
//                 <div>
//                   <h4 className="font-medium text-gray-900 dark:text-white">Question Similarity</h4>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Content relevance</p>
//                 </div>
//               </div>
              
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSimilarityColor(questionSimilarity)}`}>
//                     {(animatedValues.question * 100).toFixed(1)}%
//                   </span>
//                 </div>
                
//                 <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
//                   <div
//                     className={`h-full bg-gradient-to-r ${getSimilarityGradient(questionSimilarity)} transition-all duration-1000 ease-out`}
//                     style={{ width: `${animatedValues.question * 100}%` }}
//                   />
//                 </div>
                
//                 {questionConfidence && (
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
//                     <span className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(questionConfidence)}`}>
//                       {questionConfidence}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Answer Similarity */}
//           {answerSimilarity !== undefined && (
//             <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
//                   <FileText className={`w-5 h-5 ${getSimilarityIcon(answerSimilarity)}`} />
//                 </div>
//                 <div>
//                   <h4 className="font-medium text-gray-900 dark:text-white">Answer Similarity</h4>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Response quality</p>
//                 </div>
//               </div>
              
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSimilarityColor(answerSimilarity)}`}>
//                     {(animatedValues.answer * 100).toFixed(1)}%
//                   </span>
//                 </div>
                
//                 <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
//                   <div
//                     className={`h-full bg-gradient-to-r ${getSimilarityGradient(answerSimilarity)} transition-all duration-1000 ease-out`}
//                     style={{ width: `${animatedValues.answer * 100}%` }}
//                   />
//                 </div>
                
//                 {answerConfidence && (
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
//                     <span className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(answerConfidence)}`}>
//                       {answerConfidence}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Content Similarity */}
//           {contentSimilarity !== undefined && (
//             <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
//                   <TrendingUp className={`w-5 h-5 ${getSimilarityIcon(contentSimilarity)}`} />
//                 </div>
//                 <div>
//                   <h4 className="font-medium text-gray-900 dark:text-white">Content Match</h4>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Source alignment</p>
//                 </div>
//               </div>
              
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Score</span>
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSimilarityColor(contentSimilarity)}`}>
//                     {(animatedValues.content * 100).toFixed(1)}%
//                   </span>
//                 </div>
                
//                 <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
//                   <div
//                     className={`h-full bg-gradient-to-r ${getSimilarityGradient(contentSimilarity)} transition-all duration-1000 ease-out`}
//                     style={{ width: `${animatedValues.content * 100}%` }}
//                   />
//                 </div>
                
//                 {contentConfidence && (
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs text-gray-500 dark:text-gray-400">Confidence:</span>
//                     <span className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(contentConfidence)}`}>
//                       {contentConfidence}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Detailed Explanation */}
//         {isExpanded && (
//           <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
//             <div className="flex items-center gap-2 mb-3">
//               <Info className="w-5 h-5 text-blue-600" />
//               <h4 className="font-medium text-blue-900 dark:text-blue-100">Similarity Analysis Guide</h4>
//             </div>
//             <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
//               <div><strong>Question Similarity:</strong> Measures how similar this question is to others in your database, helping identify duplicate or related queries.</div>
//               <div><strong>Answer Similarity:</strong> Evaluates how similar this answer is to other responses for similar questions, ensuring consistency.</div>
//               <div><strong>Content Match:</strong> Assesses how well this answer aligns with the original source content and maintains accuracy.</div>
              
//               <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
//                 <div className="flex items-center gap-4 text-xs">
//                   <span className="flex items-center gap-1">
//                     <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
//                     <span>80%+ Excellent</span>
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
//                     <span>60-79% Good</span>
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
//                     <span>Below 60% Review</span>
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Vector Data Info */}
//         {vectorData && isExpanded && (
//           <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-2 mb-2">
//               <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
//               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vector Information</span>
//             </div>
//             <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
//               <div>
//                 <span className="font-medium">Model:</span> {vectorData.model}
//               </div>
//               <div>
//                 <span className="font-medium">Dimensions:</span> {vectorData.dimensions}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// } 