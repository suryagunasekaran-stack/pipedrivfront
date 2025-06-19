'use client';

import { Suspense } from "react";

function PipedriveSuccessContent() {

  const handleGoToPipedrive = () => {
    window.open('https://app.pipedrive.com/', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          {/* Success checkmark */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Success!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Operation completed successfully.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoToPipedrive}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Go to Pipedrive
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Click the button above to access your Pipedrive account
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

export default function PipedriveSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipedriveSuccessContent />
    </Suspense>
  );
}
