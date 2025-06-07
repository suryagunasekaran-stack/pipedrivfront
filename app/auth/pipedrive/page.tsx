'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../../services/api';
import ErrorDisplay from '../../components/ErrorDisplay';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PipedriveAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the new API service to get the Pipedrive OAuth URL
      const authUrl = await apiService.getPipedriveAuthUrl();
      
      if (authUrl) {
        // Redirect to Pipedrive OAuth
        window.location.href = authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      console.error('Pipedrive auth error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Pipedrive');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleConnect();
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Connecting to Pipedrive..." 
        size="lg"
        variant="default"
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect to Pipedrive
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your Pipedrive account to get started with project management and quote generation
          </p>
        </div>

        {error ? (
          <ErrorDisplay
            error={error}
            onRetry={handleRetry}
            variant="auth"
            retryButtonText="Try Connecting Again"
            additionalActions={[
              {
                label: 'Back to Home',
                action: () => router.push('/'),
                variant: 'secondary'
              }
            ]}
          />
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect to Pipedrive'
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By connecting, you agree to allow access to your Pipedrive data for project management purposes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
