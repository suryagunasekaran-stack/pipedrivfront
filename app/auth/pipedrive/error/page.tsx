'use client';

import { Suspense } from 'react';

function PipedriveErrorContent() {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoToPipedrive = () => {
    window.open('https://app.pipedrive.com/', '_blank');
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
            Error
          </h1>
          
          <p className="text-gray-600 mb-6">
            Something went wrong. Please try again.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Go Back
          </button>

          <button
            onClick={handleGoToPipedrive}
            className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Go to Pipedrive
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Click above to navigate away from this page
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function PipedriveErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipedriveErrorContent />
    </Suspense>
  );
}
