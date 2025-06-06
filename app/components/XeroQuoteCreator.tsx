// No longer needs useState if isCreatingQuote is a prop
// No longer needs useRouter if redirect is handled by parent or not at all here
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// No longer needs these types/constants if API call is handled by parent
// import { XeroQuoteResponse } from '../types/pipedrive';
// import { API_ENDPOINTS, DEFAULT_PIPEDRIVE_DOMAIN, REDIRECT_DELAY } from '../constants';
// import { apiCall } from '../utils/apiClient';

interface XeroQuoteCreatorProps {
  dealId: string | null; // Still useful for context or if button is disabled based on it
  companyId: string | null; // Same as dealId
  isXeroConnected: boolean; // To enable/disable the button
  onCreateQuote: () => Promise<void>; // Function passed from parent that calls apiService.createQuote
  isCreatingQuote: boolean; // Loading state from parent
  toast: { // Keep toast for immediate feedback if needed, though parent handles primary feedback
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    // info: (message: string, duration?: number) => string;
    // warning: (message: string, duration?: number) => string;
  };
}

/**
 * Component for creating Xero quotes.
 * Now delegates the actual API call to a prop function.
 */
export default function XeroQuoteCreator({ 
  dealId, 
  companyId, 
  isXeroConnected,
  onCreateQuote,
  isCreatingQuote,
  toast 
}: XeroQuoteCreatorProps) {
  // const router = useRouter(); // Only if this component handles redirect

  const handleCreateQuoteClick = async () => {
    if (!dealId || !companyId) {
      toast.error('Missing Pipedrive Deal ID or Company ID. Cannot create quote.');
      return;
    }
    // Parent (PipedriveDataViewContent) now handles showing toast messages based on API result.
    // This component just calls the passed function.
    await onCreateQuote();
    
    // If redirect is still desired from here:
    // setTimeout(() => {
    //   const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || 'pipedrive.com'; // Example default
    //   router.push(`https://${pipedriveDomain}/deal/${dealId}`);
    // }, 2000); // Example delay
  };

  if (!isXeroConnected) {
    return (
      <p className="mt-1 text-sm text-gray-600">
        Please connect to Xero to enable quote creation.
      </p>
    );
  }

  return (
    <button
      onClick={handleCreateQuoteClick}
      disabled={isCreatingQuote || !dealId || !companyId} // Also disable if IDs are missing
      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
    >
      {isCreatingQuote ? 'Creating Xero Quote...' : 'Create Xero Quote'}
    </button>
  );
}
