import { CheckCircleIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface SuccessNotificationProps {
  title: string;
  message: string;
  show: boolean;
  onClose?: () => void;
  duration?: number;
  variant?: 'default' | 'celebration' | 'minimal';
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  autoClose?: boolean;
}

/**
 * Enhanced success notification component with celebration animations
 */
export default function SuccessNotification({
  title,
  message,
  show,
  onClose,
  duration = 5000,
  variant = 'default',
  actions = [],
  autoClose = true
}: SuccessNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Trigger entrance animation
      setTimeout(() => setIsAnimating(true), 100);
      
      // Auto close after duration
      if (autoClose && onClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [show, duration, autoClose, onClose]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const variants = {
    default: {
      containerClass: 'bg-white border border-green-200 shadow-lg',
      iconClass: 'text-green-500',
      titleClass: 'text-gray-900',
      messageClass: 'text-gray-600'
    },
    celebration: {
      containerClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-xl',
      iconClass: 'text-green-500',
      titleClass: 'text-gray-900 font-bold',
      messageClass: 'text-gray-700'
    },
    minimal: {
      containerClass: 'bg-green-50 border-l-4 border-green-400',
      iconClass: 'text-green-400',
      titleClass: 'text-gray-900',
      messageClass: 'text-gray-600'
    }
  };

  const config = variants[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div
        className={`relative max-w-md w-full rounded-lg p-6 transform transition-all duration-300 ease-out ${
          isAnimating 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-4 opacity-0 scale-95'
        } ${config.containerClass}`}
      >
        {/* Celebration sparkles (for celebration variant) */}
        {variant === 'celebration' && (
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <SparklesIcon className="absolute top-2 right-2 h-4 w-4 text-yellow-400 animate-pulse" />
            <SparklesIcon className="absolute top-4 left-4 h-3 w-3 text-green-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <SparklesIcon className="absolute bottom-4 right-6 h-3 w-3 text-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircleIcon className={`h-6 w-6 ${config.iconClass}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${config.titleClass}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${config.messageClass}`}>
              {message}
            </p>
            
            {/* Actions */}
            {actions.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      handleClose();
                    }}
                    className={`inline-flex items-center text-sm font-medium transition-colors ${
                      action.variant === 'primary'
                        ? 'px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800'
                        : 'px-3 py-1 text-green-700 hover:text-green-900'
                    }`}
                  >
                    {action.label}
                    {action.variant === 'primary' && (
                      <ArrowRightIcon className="ml-1 h-3 w-3" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all ease-linear"
              style={{ 
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      {/* Custom CSS for progress animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
} 