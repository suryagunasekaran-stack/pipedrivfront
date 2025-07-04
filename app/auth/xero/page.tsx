'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function XeroAuthContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipedriveCompanyId, setPipedriveCompanyId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const companyId = searchParams.get('pipedriveCompanyId');
    if (!companyId) {
      setError('No Pipedrive company ID provided. Please connect to Pipedrive first.');
      return;
    }
    setPipedriveCompanyId(companyId);
  }, [searchParams]);

  const handleConnect = async () => {
    if (!pipedriveCompanyId) {
      setError('No Pipedrive company ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch the Xero OAuth URL with company association
      const response = await fetch(`/api/auth/xero-auth-url?pipedriveCompanyId=${pipedriveCompanyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get Xero authorization URL');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Xero OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Xero');
      setLoading(false);
    }
  };

  const handleBackToPipedrive = () => {
    router.push('/auth/pipedrive');
  };

  if (!pipedriveCompanyId && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect to Xero
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your Xero account to enable quote creation and financial integration
          </p>
          {pipedriveCompanyId && (
            <p className="text-sm text-gray-500 mb-4">
              This will be linked to your Pipedrive company
            </p>
          )}
        </div>

        <div className="space-y-4">
          {pipedriveCompanyId ? (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect to Xero'
              )}
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
            By connecting, you agree to allow access to your Xero data
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

export default function XeroAuthPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <XeroAuthContent />
    </Suspense>
  );
}
