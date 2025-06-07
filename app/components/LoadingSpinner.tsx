interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay' | 'inline';
  showProgress?: boolean;
  progress?: number;
}

/**
 * Enhanced loading spinner component with multiple variants and modern design
 */
export default function LoadingSpinner({ 
  message = "Loading...", 
  size = 'md',
  variant = 'default',
  showProgress = false,
  progress = 0
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  const containerClasses = {
    default: 'flex justify-center items-center min-h-screen bg-white',
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    inline: 'flex justify-center items-center py-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={containerClasses[variant]}>
      <div className="text-center">
        {/* Main spinner with gradient */}
        <div className="relative inline-flex items-center justify-center">
          <div 
            className={`${sizeClasses[size]} border-4 border-gray-200 border-t-black rounded-full animate-spin`}
          />
          {/* Inner spinning element for extra visual appeal */}
          <div 
            className={`absolute ${size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-5 w-5' : 'h-3 w-3'} border-2 border-gray-300 border-b-gray-600 rounded-full animate-spin`}
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
          />
        </div>
        
        {/* Progress bar (if enabled) */}
        {showProgress && (
          <div className="mt-4 w-64 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-black h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        
        {/* Loading message */}
        <div className={`mt-4 ${textSizeClasses[size]} ${variant === 'overlay' ? 'text-white' : 'text-black'} font-medium`}>
          {message}
        </div>
        
        {/* Subtle pulsing dots for additional visual feedback */}
        <div className="flex justify-center space-x-1 mt-2">
          <div className={`${variant === 'overlay' ? 'bg-white' : 'bg-black'} rounded-full animate-pulse`} 
               style={{ width: '4px', height: '4px', animationDelay: '0ms' }} />
          <div className={`${variant === 'overlay' ? 'bg-white' : 'bg-black'} rounded-full animate-pulse`} 
               style={{ width: '4px', height: '4px', animationDelay: '200ms' }} />
          <div className={`${variant === 'overlay' ? 'bg-white' : 'bg-black'} rounded-full animate-pulse`} 
               style={{ width: '4px', height: '4px', animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}
