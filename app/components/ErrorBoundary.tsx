'use client';

import React from 'react';
import ApiErrorPage from './ApiErrorPage';
import ErrorDisplay from './ErrorDisplay';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: any; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const { fallback: FallbackComponent } = this.props;

      if (FallbackComponent) {
        return <FallbackComponent error={error} retry={this.retry} />;
      }

      // Check if error has status code (API error)
      if (error?.statusCode || error?.response?.status) {
        return (
          <ApiErrorPage
            error={{
              message: error.message || 'An unexpected error occurred',
              statusCode: error.statusCode || error.response?.status,
              details: error.details || error.response?.data?.details,
            }}
            onRetry={this.retry}
          />
        );
      }

      // For other errors, use simple error display
      return (
        <ErrorDisplay
          error={error?.message || 'An unexpected error occurred'}
          onRetry={this.retry}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<any>(null);

  const resetError = () => setError(null);

  const handleError = (error: any) => {
    console.error('Error handled:', error);
    setError(error);
  };

  // If there's an error with a status code, render the nice error page
  if (error?.statusCode || error?.response?.status) {
    return {
      errorElement: (
        <ApiErrorPage
          error={{
            message: error.message || 'An unexpected error occurred',
            statusCode: error.statusCode || error.response?.status,
            details: error.details || error.response?.data?.details,
          }}
          onRetry={resetError}
        />
      ),
      hasError: true,
      resetError,
      handleError,
    };
  }

  // For other errors, use simple error display
  if (error) {
    return {
      errorElement: (
        <ErrorDisplay
          error={error?.message || 'An unexpected error occurred'}
          onRetry={resetError}
        />
      ),
      hasError: true,
      resetError,
      handleError,
    };
  }

  return {
    errorElement: null,
    hasError: false,
    resetError,
    handleError,
  };
}