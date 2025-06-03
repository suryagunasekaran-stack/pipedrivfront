'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PipedriveErrorPage() {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorDescription) {
      setErrorMessage(decodeURIComponent(errorDescription));
    } else if (error) {
      setErrorMessage(decodeURIComponent(error));
    } else {
      setErrorMessage('An unexpected error occurred during authentication');
    }
  }, [searchParams]);

  const handleTryAgain = () => {
    router.push('/auth/pipedrive');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@yourcompany.com';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          {/* Error icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connection Failed
          </h1>
          
          <p className="text-gray-600 mb-6">
            We couldn't connect to your Pipedrive account.
          </p>

          {errorMessage && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-6">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={handleContactSupport}
            className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Contact Support
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            If the problem persists, please contact our support team
          </p>
        </div>
      </div>
    </div>
  );
}
