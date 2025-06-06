'use client'; // ErrorBoundary needs to be a Client Component

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Extend window type to include gtag if you're using it for error tracking
declare global {
  interface Window {
    gtag?: (event: string, action: string, params: { description: string; fatal?: boolean }) => void;
  }
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Example: Send to Google Analytics (if gtag is configured)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString() + (errorInfo?.componentStack ? `\nComponent Stack: ${errorInfo.componentStack}` : ''),
        fatal: true, // Mark as fatal since it's an unhandled error at this boundary
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Oops! Something went wrong.</h1>
            <p className="mt-2 text-sm text-gray-600">
              We're sorry for the inconvenience. An unexpected error occurred.
              Please try reloading the page.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-left text-xs overflow-auto max-h-32">
                <p><strong>Error:</strong> {this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Component Stack</summary>
                    <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="mt-6 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            >
              Reload Page
            </button>
             <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
              className="mt-2 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Try to dismiss (may not work)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
