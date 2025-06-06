'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { apiService, ApiError } from '../../services/api';

export default function XeroAuthPage() {
  const [error, setError] = useState<string | null>(null);
  // companyIdFromUrl will hold the ID from URL query param
  const [companyIdFromUrl, setCompanyIdFromUrl] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Get companyId from store and check URL params
  const storeCompanyId = useAuthStore((state) => state.companyId);
  const setCompanyIdInStore = useAuthStore((state) => state.setCompanyId);

  useEffect(() => {
    const companyIdQueryParam = searchParams.get('pipedriveCompanyId');

    if (companyIdQueryParam) {
      setCompanyIdFromUrl(companyIdQueryParam);
      // Optionally, if store is not set but URL has it, update the store.
      // This can happen if user navigates directly with URL param.
      if (!storeCompanyId) {
        setCompanyIdInStore(companyIdQueryParam);
      }
    } else if (!storeCompanyId) {
      setError('Pipedrive company ID is missing. Please connect to Pipedrive first.');
    }
    // If storeCompanyId exists, we prefer that, but connectXero will use the param it's given.
  }, [searchParams, storeCompanyId, setCompanyIdInStore]);

  const effectiveCompanyId = storeCompanyId || companyIdFromUrl;

  const handleConnect = useCallback(() => {
    if (!effectiveCompanyId) {
      setError('No Pipedrive company ID available. Please ensure you have connected Pipedrive or the ID is in the URL.');
      return;
    }
    setError(null);
    // apiService.connectXero handles the redirect directly.
    // No separate loading state needed here as the page will navigate away.
    try {
      apiService.connectXero(effectiveCompanyId);
    } catch (err) { // This catch might not be effective if connectXero always redirects
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while trying to connect to Xero.');
      }
    }
  }, [effectiveCompanyId]);

  const handleBackToPipedrive = () => {
    router.push('/auth/pipedrive');
  };

  // Show loading or initial check state if company ID is being determined
  useEffect(() => {
    // If there's no effectiveCompanyId and no error yet, it might be still loading from URL or store
    // This is a brief moment, so a spinner might be too flashy.
    // The main check is the error state or the presence of effectiveCompanyId for button display.
  }, [effectiveCompanyId, error]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect to Xero
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your Xero account to enable quote creation and financial integration.
          </p>
          {effectiveCompanyId && (
            <p className="text-sm text-gray-500 mb-4">
              This will be linked to your Pipedrive company.
            </p>
          )}
        </div>

        <div className="space-y-4">
          {effectiveCompanyId ? (
            <button
              onClick={handleConnect}
              // No 'loading' state from this component as apiService.connectXero redirects
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Connect to Xero
            </button>
          ) : (
            <button
              onClick={handleBackToPipedrive}
              className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              Connect to Pipedrive First
            </button>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By connecting, you agree to allow access to your Xero data.
          </p>
        </div>
      </div>
    </div>
  );
}
