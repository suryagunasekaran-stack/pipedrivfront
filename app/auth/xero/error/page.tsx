'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useAuthStore } from '../../../store/authStore'; // Import useAuthStore

function XeroErrorContent() {
  const [displayMessage, setDisplayMessage] = useState<string>('An unexpected error occurred during Xero authentication.');
  const searchParams = useSearchParams();
  const router = useRouter();
  const storedCompanyId = useAuthStore((state) => state.companyId); // Get companyId from store

  const [effectiveCompanyId, setEffectiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const companyIdQueryParam = searchParams.get('companyId') || searchParams.get('pipedriveCompanyId');
    if (companyIdQueryParam) {
      setEffectiveCompanyId(companyIdQueryParam);
    } else if (storedCompanyId) {
      setEffectiveCompanyId(storedCompanyId);
    }

    const messageParam = searchParams.get('message');
    const errorParam = searchParams.get('error');
    const errorDescriptionParam = searchParams.get('error_description');
    
    if (messageParam) {
      setDisplayMessage(decodeURIComponent(messageParam));
    } else if (errorDescriptionParam) {
      setDisplayMessage(decodeURIComponent(errorDescriptionParam));
    } else if (errorParam) {
      setDisplayMessage(decodeURIComponent(errorParam));
    }
    // Default message from useState is used if no specific error params are found
  }, [searchParams, storedCompanyId]);

  const handleTryAgain = () => {
    if (effectiveCompanyId) {
      router.push(`/auth/xero?pipedriveCompanyId=${effectiveCompanyId}`);
    } else {
      // If no companyId, Pipedrive auth must happen first
      router.push('/auth/pipedrive');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
           <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xero Connection Failed
          </h1>
          <p className="text-gray-600 mb-6">
            We encountered an issue while trying to connect to your Xero account.
          </p>
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-6">
            {displayMessage}
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleTryAgain}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Try Connecting Xero Again
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-2 px-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">
            If the problem persists, ensure Pipedrive is connected first, or contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function XeroErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <XeroErrorContent />
    </Suspense>
  );
}
