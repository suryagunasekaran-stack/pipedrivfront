/**
 * Error Boundary Component
 * Implements comprehensive error handling as specified in the Frontend Integration Guide
 */

'use client';

import React from 'react';
import { ApiError } from '../utils/errors';

// =============================================================================
// ERROR BOUNDARY STATE
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: true,
        custom_parameters: {
          component_stack: errorInfo.componentStack,
          error_boundary: true,
        },
      });
    }

    // You can also send to other services like Sentry:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retry={this.handleRetry}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// DEFAULT ERROR FALLBACK COMPONENT
// =============================================================================

interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  retry: () => void;
  showDetails?: boolean;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  retry,
  showDetails = false,
}) => {
  const [showDetailedError, setShowDetailedError] = React.useState(showDetails);
  
  const isApiError = error instanceof ApiError;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          
          {/* Error Title */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          
          {/* Error Message */}
          <p className="mt-2 text-sm text-gray-600">
            {isApiError
              ? 'We encountered an issue with our services. Please try again.'
              : 'An unexpected error occurred. Please try again or contact support if the problem persists.'
            }
          </p>

          {/* Error ID */}
          {errorId && (
            <p className="mt-2 text-xs text-gray-400">
              Error ID: {errorId}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={retry}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reload Page
          </button>

          {/* Home Button */}
          <button
            onClick={() => window.location.href = '/'}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Home
          </button>
        </div>

        {/* Error Details Toggle */}
        {(isDevelopment || showDetails) && (
          <div className="mt-6">
            <button
              onClick={() => setShowDetailedError(!showDetailedError)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDetailedError ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showDetailedError && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Error Details:
                </h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                  {error.message}
                </pre>
                
                {isApiError && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      Status Code: {(error as ApiError).statusCode}
                    </p>
                    <p className="text-xs text-gray-600">
                      Type: {(error as ApiError).type}
                    </p>
                  </div>
                )}
                
                {isDevelopment && error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="mt-1 text-xs text-gray-700 whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// HOOK FOR MANUAL ERROR HANDLING
// =============================================================================

/**
 * Hook to manually trigger error boundary
 */
export const useErrorHandler = () => {
  return React.useCallback((error: Error) => {
    // This will be caught by the nearest error boundary
    throw error;
  }, []);
};

// =============================================================================
// HIGHER-ORDER COMPONENT
// =============================================================================

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
