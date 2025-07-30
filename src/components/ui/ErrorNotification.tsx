import React, { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorNotificationProps {
  error: string | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  type?: 'error' | 'warning' | 'info';
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  type = 'error'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      console.log('🔔 [ErrorNotification] Error received:', error);
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          console.log('🔔 [ErrorNotification] Auto-closing notification');
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for animation to complete
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      console.log('🔔 [ErrorNotification] No error, hiding notification');
      setIsVisible(false);
    }
  }, [error, autoClose, autoCloseDelay, onClose]);

  if (!error) return null;

  // Define styles based on type
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      text: 'text-red-700',
      closeButton: 'text-red-400 hover:text-red-600',
      progressBg: 'bg-red-200',
      progressBar: 'bg-red-500',
      titleText: 'Authentication Error'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      closeButton: 'text-yellow-400 hover:text-yellow-600',
      progressBg: 'bg-yellow-200',
      progressBar: 'bg-yellow-500',
      titleText: 'Warning'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      text: 'text-blue-700',
      closeButton: 'text-blue-400 hover:text-blue-600',
      progressBg: 'bg-blue-200',
      progressBar: 'bg-blue-500',
      titleText: 'Information'
    }
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className={`border rounded-lg shadow-lg p-4 relative ${currentStyle.container}`}>
          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`absolute top-2 right-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-1 ${currentStyle.closeButton}`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Content */}
          <div className="flex items-start gap-3 pr-6">
            <div className="flex-shrink-0">
              <AlertCircle className={`w-5 h-5 ${currentStyle.icon}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-semibold mb-1 ${currentStyle.title}`}>
                {currentStyle.titleText}
              </h3>
              <p className={`text-sm leading-relaxed ${currentStyle.text}`}>
                {error}
              </p>
            </div>
          </div>
          
          {/* Progress bar for auto-close */}
          {autoClose && (
            <div className={`mt-3 h-1 rounded-full overflow-hidden ${currentStyle.progressBg}`}>
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-linear ${currentStyle.progressBar}`}
                style={{
                  width: isVisible ? '0%' : '100%',
                  transitionDuration: `${autoCloseDelay}ms`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification; 