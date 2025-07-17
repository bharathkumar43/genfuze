import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Info, Loader2, Clock, Target, Zap } from 'lucide-react';

interface ProgressSectionProps {
  progress: number;
  status: string;
  statusType: 'info' | 'success' | 'error' | 'warning';
  isVisible: boolean;
  isLoading?: boolean;
  currentStep?: string;
  totalSteps?: number;
  estimatedTime?: number;
  speed?: number;
}

export function ProgressSection({ 
  progress, 
  status, 
  statusType, 
  isVisible, 
  isLoading = false,
  currentStep = '',
  totalSteps = 0,
  estimatedTime = 0,
  speed = 0
}: ProgressSectionProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, isVisible]);

  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (statusType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusBgColor = () => {
    switch (statusType) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400';
    }
  };

  const getProgressColor = () => {
    switch (statusType) {
      case 'success':
        return 'from-green-500 to-emerald-600';
      case 'error':
        return 'from-red-500 to-pink-600';
      case 'warning':
        return 'from-yellow-500 to-orange-600';
      default:
        return 'from-blue-500 to-purple-600';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatSpeed = (speed: number) => {
    if (speed < 1000) return `${speed} req/min`;
    return `${(speed / 1000).toFixed(1)}k req/min`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Processing Progress</h2>
              <p className="text-blue-100 text-sm">AI-powered content analysis in progress</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Main Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {Math.round(animatedProgress * 100)}%
              </span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out relative`}
                  style={{ width: `${animatedProgress * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusBgColor()}`}>
            {getStatusIcon()}
            <div className="flex-1">
              <span className="font-medium">{status}</span>
              {currentStep && (
                <p className="text-sm opacity-80 mt-1">Current: {currentStep}</p>
              )}
            </div>
          </div>

          {/* Detailed Stats */}
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Steps</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {totalSteps > 0 ? `${Math.ceil(animatedProgress * totalSteps)}/${totalSteps}` : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Est. Time</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {estimatedTime > 0 ? formatTime(estimatedTime) : 'Calculating...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Speed</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {speed > 0 ? formatSpeed(speed) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps (if available) */}
      {totalSteps > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Processing Steps</span>
            <span>{Math.ceil(animatedProgress * totalSteps)} of {totalSteps}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                  i < Math.ceil(animatedProgress * totalSteps)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}