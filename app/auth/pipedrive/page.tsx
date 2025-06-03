'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PipedriveAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the Pipedrive OAuth URL
      const response = await fetch('/api/auth/auth-url');
      
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Pipedrive OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Pipedrive');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect to Pipedrive
          </h1>
          <p className="text-gray-600 mb-8">
            Connect your Pipedrive account to get started with project management
          </p>
        </div>

        <div className="space-y-4">
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
              'Connect to Pipedrive'
            )}
          </button>

          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By connecting, you agree to allow access to your Pipedrive data
          </p>
        </div>
      </div>
    </div>
  );
}
