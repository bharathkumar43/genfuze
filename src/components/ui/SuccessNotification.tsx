import React, { useEffect, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface SuccessNotificationProps {
  message: string | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for animation to complete
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, autoClose, autoCloseDelay, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 relative">
          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="absolute top-2 right-2 text-green-400 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full p-1"
            aria-label="Close success notification"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Success content */}
          <div className="flex items-start gap-3 pr-6">
            <div className="flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                Success
              </h3>
              <p className="text-sm text-green-700 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          
          {/* Progress bar for auto-close */}
          {autoClose && (
            <div className="mt-3 h-1 bg-green-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300 ease-linear"
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

export default SuccessNotification; 