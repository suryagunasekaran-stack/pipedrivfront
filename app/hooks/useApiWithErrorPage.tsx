'use client';

import React from 'react';
import ApiErrorPage from '../components/ApiErrorPage';
import ErrorDisplay from '../components/ErrorDisplay';
import SimpleLoader from '../components/SimpleLoader';

interface UseApiWithErrorPageOptions {
  onRetry?: () => void | Promise<void>;
  showHomeButton?: boolean;
  showSupportButton?: boolean;
  loadingComponent?: React.ReactNode;
}

interface ApiError {
  message: string;
  statusCode?: number;
  details?: string;
}

export function useApiWithErrorPage({
  loading,
  error,
  errorDetails,
  onRetry,
  showHomeButton = true,
  showSupportButton = true,
  loadingComponent,
}: {
  loading: boolean;
  error: string | null;
  errorDetails?: { statusCode?: number; details?: string } | null;
} & UseApiWithErrorPageOptions) {
  // Return loading component if loading
  if (loading) {
    return {
      shouldRender: true,
      component: loadingComponent || <SimpleLoader />,
    };
  }

  // Return error component if error exists
  if (error) {
    // For API errors with status codes, use the nice error page
    if (errorDetails?.statusCode) {
      return {
        shouldRender: true,
        component: (
          <ApiErrorPage
            error={{
              message: error,
              statusCode: errorDetails.statusCode,
              details: errorDetails.details,
            }}
            onRetry={onRetry}
            showHomeButton={showHomeButton}
            showSupportButton={showSupportButton}
          />
        ),
      };
    }

    // For other errors, use the standard error display
    return {
      shouldRender: true,
      component: (
        <ErrorDisplay 
          error={error}
          onRetry={onRetry}
        />
      ),
    };
  }

  // No loading or error, continue with normal rendering
  return {
    shouldRender: false,
    component: null,
  };
}

// HOC version for wrapping components
export function withApiErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options?: UseApiWithErrorPageOptions
) {
  return function WrappedComponent(props: P & {
    loading?: boolean;
    error?: string | null;
    errorDetails?: { statusCode?: number; details?: string } | null;
    refetch?: () => void | Promise<void>;
  }) {
    const { loading = false, error = null, errorDetails = null, refetch, ...restProps } = props;
    
    const { shouldRender, component } = useApiWithErrorPage({
      loading,
      error,
      errorDetails,
      onRetry: refetch || options?.onRetry,
      ...options,
    });

    if (shouldRender) {
      return component;
    }

    return <Component {...(restProps as P)} />;
  };
}