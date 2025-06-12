'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PipedriveSuccessContent() {
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // You can fetch company info here if needed
    // For now, we'll just show a success message
    const company = searchParams.get('company');
    if (company) {
      setCompanyInfo({ name: decodeURIComponent(company) });
    }
  }, [searchParams]);

  const handleClose = () => {
    // Close the window if it was opened as a popup
    if (window.opener) {
      window.close();
    } else {
      // Otherwise redirect to main app
      window.location.href = '/';
    }
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
            Successfully Connected!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your Pipedrive account has been connected successfully.
            {companyInfo && (
              <span className="block mt-2 font-medium">
                Connected to: {companyInfo.name}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Continue
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            You can now close this window or continue to the application
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
