import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XeroQuoteResponse } from '../types/pipedrive';
import { API_ENDPOINTS, REDIRECT_DELAY } from '../constants';
import { apiCall } from '../utils/apiClient';

interface XeroQuoteCreatorProps {
  dealId: string | null;
  companyId: string | null;
  xeroConnected: boolean;
  toast: {
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
  };
}

/**
 * Component for creating Xero quotes from Pipedrive deals
 */
export default function XeroQuoteCreator({ 
  dealId, 
  companyId, 
  xeroConnected, 
  toast 
}: XeroQuoteCreatorProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreateQuote = async () => {
    if (!dealId || !companyId) {
      toast.error('Missing Pipedrive Deal ID or Company ID');
      return;
    }

    setCreating(true);
    
    try {
      const responseData: XeroQuoteResponse = await apiCall(API_ENDPOINTS.XERO_QUOTE, {
        method: 'POST',
        body: JSON.stringify({ 
          pipedriveDealId: dealId, 
          pipedriveCompanyId: companyId 
        }),
      });
      
      const successMsg = responseData.message || 
        `Xero Quote ${responseData.quoteNumber || ''} created successfully!`;
      
      toast.success(successMsg);

      // Show success message instead of redirecting
      setTimeout(() => {
        alert('Quote created successfully! Please return to your Pipedrive account to view the updated deal.');
      }, REDIRECT_DELAY);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quote';
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (!xeroConnected) {
    return (
      <p className="mt-1 text-sm text-gray-600">
        Connect to Xero to enable quote creation.
      </p>
    );
  }

  return (
    <button
      onClick={handleCreateQuote}
      disabled={creating}
      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
    >
      {creating ? 'Creating Xero Quote...' : 'Create Xero Quote'}
    </button>
  );
}
