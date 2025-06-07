import { ExclamationTriangleIcon, XCircleIcon, WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  variant?: 'default' | 'network' | 'auth' | 'validation' | 'server';
  showIcon?: boolean;
  className?: string;
  retryButtonText?: string;
  additionalActions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

/**
 * Enhanced error display component with categorized errors and actionable solutions
 */
export default function ErrorDisplay({ 
  error, 
  onRetry,
  variant = 'default',
  showIcon = true,
  className = '',
  retryButtonText = 'Try Again',
  additionalActions = []
}: ErrorDisplayProps) {
  // Error categorization and messaging
  const errorConfig = {
    default: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Something went wrong',
      suggestion: 'Please try again or contact support if the problem persists.'
    },
    network: {
      icon: WifiIcon,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      title: 'Connection Problem',
      suggestion: 'Check your internet connection and try again.'
    },
    auth: {
      icon: XCircleIcon,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Authentication Required',
      suggestion: 'Please sign in again to continue.'
    },
    validation: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Invalid Data',
      suggestion: 'Please check your input and try again.'
    },
    server: {
      icon: XCircleIcon,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Server Error',
      suggestion: 'Our servers are experiencing issues. Please try again later.'
    }
  };

  const config = errorConfig[variant];
  const Icon = config.icon;

  // Auto-detect error type based on error message
  const detectErrorType = (errorMessage: string): string => {
    const lowerError = errorMessage.toLowerCase();
    if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('timeout')) {
      return 'network';
    }
    if (lowerError.includes('auth') || lowerError.includes('unauthorized') || lowerError.includes('token')) {
      return 'auth';
    }
    if (lowerError.includes('validation') || lowerError.includes('invalid') || lowerError.includes('required')) {
      return 'validation';
    }
    if (lowerError.includes('server') || lowerError.includes('500') || lowerError.includes('internal')) {
      return 'server';
    }
    return 'default';
  };

  const detectedType = variant === 'default' ? detectErrorType(error) : variant;
  const finalConfig = errorConfig[detectedType as keyof typeof errorConfig] || config;

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className={`${finalConfig.bgColor} ${finalConfig.borderColor} border rounded-lg p-6 shadow-sm`}>
        {/* Icon and Title */}
        {showIcon && (
          <div className="flex items-center mb-4">
            <Icon className={`h-6 w-6 ${finalConfig.iconColor} mr-3`} />
            <h3 className="text-lg font-semibold text-gray-900">
              {finalConfig.title}
            </h3>
          </div>
        )}

        {/* Error Message */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {error}
          </p>
          
          {/* Helpful suggestion */}
          <p className="text-gray-600 text-xs mt-2 italic">
            {finalConfig.suggestion}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {retryButtonText}
            </button>
          )}
          
          {additionalActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                action.variant === 'primary' 
                  ? 'bg-black text-white hover:bg-gray-800 focus:ring-gray-500' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Error ID for debugging (in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-mono">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
