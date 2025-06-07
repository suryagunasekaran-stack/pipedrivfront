import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_PIPEDRIVE_DOMAIN, REDIRECT_DELAY } from '../constants';
import { createQuoteWithAuth, getCurrentUrlWithParams } from '../utils/autoAuthFlow';
import SuccessNotification from './SuccessNotification';

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
 * Enhanced component for creating Xero quotes with automatic auth flow
 */
export default function XeroQuoteCreator({ 
  dealId, 
  companyId, 
  xeroConnected, 
  toast 
}: XeroQuoteCreatorProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState<string>('');

  const handleCreateQuote = async () => {
    if (!dealId || !companyId) {
      toast.error('Missing Pipedrive Deal ID or Company ID');
      return;
    }

    setCreating(true);
    
    try {
      const currentUrl = getCurrentUrlWithParams();
      
      // Use automatic auth flow - this will handle Xero auth if needed
      await createQuoteWithAuth(companyId, dealId, currentUrl);
      
      // Listen for quote creation success event
      const handleQuoteCreated = (event: CustomEvent) => {
        setQuoteNumber(event.detail.quoteNumber);
        setShowSuccess(true);
        toast.success(`Quote ${event.detail.quoteNumber} created successfully!`);
        setCreating(false);
      };
      
      window.addEventListener('quoteCreated', handleQuoteCreated as EventListener);
      
      // Clean up event listener after 30 seconds
      setTimeout(() => {
        window.removeEventListener('quoteCreated', handleQuoteCreated as EventListener);
        setCreating(false);
      }, 30000);

    } catch (error) {
      console.error('Failed to create Xero quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quote';
      toast.error(errorMessage);
      setCreating(false);
    }
  };

  const handleViewInPipedrive = () => {
    const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || DEFAULT_PIPEDRIVE_DOMAIN;
    window.open(`https://${pipedriveDomain}/deal/${dealId}`, '_blank');
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={handleCreateQuote}
          disabled={creating}
          className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm transition-all duration-200 ${
            creating
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'text-white bg-black hover:bg-gray-800 hover:shadow-lg transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
          }`}
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Quote...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Xero Quote
            </>
          )}
        </button>
        
        {creating && (
          <p className="text-xs text-gray-500 animate-pulse">
            {xeroConnected 
              ? 'Generating quote in Xero...' 
              : 'Checking authentication...'
            }
          </p>
        )}
        
        {/* Info message about automatic auth */}
        {!xeroConnected && (
          <p className="text-xs text-gray-600 text-center max-w-xs">
            Don't worry about Xero connection - we'll handle that automatically!
          </p>
        )}
      </div>

      {/* Success notification */}
      <SuccessNotification
        show={showSuccess}
        title="Quote Created Successfully!"
        message={`Quote ${quoteNumber} has been created in Xero and linked to your Pipedrive deal.`}
        variant="celebration"
        onClose={() => setShowSuccess(false)}
        actions={[
          {
            label: 'View in Pipedrive',
            action: handleViewInPipedrive,
            variant: 'primary'
          },
          {
            label: 'Create Another',
            action: () => {
              setShowSuccess(false);
              // Allow user to create another quote if needed
            },
            variant: 'secondary'
          }
        ]}
      />
    </>
  );
}
