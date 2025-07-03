'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';

interface ApiErrorPageProps {
  error: {
    title?: string;
    message: string;
    statusCode?: number;
    details?: string;
  };
  onRetry?: () => void;
  showHomeButton?: boolean;
  showSupportButton?: boolean;
}

export default function ApiErrorPage({ 
  error, 
  onRetry, 
  showHomeButton = true,
  showSupportButton = true 
}: ApiErrorPageProps) {
  const router = useRouter();

  const getErrorIcon = () => {
    const statusCode = error.statusCode;
    if (statusCode === 404) return '🔍';
    if (statusCode === 403) return '🚫';
    if (statusCode === 401) return '🔒';
    if (statusCode === 400) return '⚠️';
    if (statusCode && statusCode >= 500) return '🔥';
    return '❌';
  };

  const getErrorTitle = () => {
    if (error.title) return error.title;
    
    const statusCode = error.statusCode;
    if (statusCode === 404) return 'Not Found';
    if (statusCode === 403) return 'Access Denied';
    if (statusCode === 401) return 'Authentication Required';
    if (statusCode === 400) return 'Bad Request';
    if (statusCode && statusCode >= 500) return 'Server Error';
    return 'Something went wrong';
  };

  const getErrorDescription = () => {
    const statusCode = error.statusCode;
    if (statusCode === 404) return 'The resource you are looking for could not be found.';
    if (statusCode === 403) return 'You do not have permission to access this resource.';
    if (statusCode === 401) return 'Please authenticate to continue.';
    if (statusCode === 400) return 'The request could not be processed.';
    if (statusCode && statusCode >= 500) return 'Our servers are experiencing issues. Please try again later.';
    return 'An unexpected error occurred while processing your request.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">{getErrorIcon()}</div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {getErrorTitle()}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {getErrorDescription()}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-red-800 font-medium">
                    {error.message}
                  </p>
                  {error.details && (
                    <p className="text-xs text-red-700 mt-1">
                      {error.details}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              )}

              {showHomeButton && (
                <button
                  onClick={() => router.push('/')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </button>
              )}

              {showSupportButton && (
                <button
                  onClick={() => window.location.href = 'mailto:support@yourcompany.com'}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </button>
              )}
            </div>

            {error.statusCode && (
              <p className="text-xs text-gray-500 mt-6">
                Error Code: {error.statusCode}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}