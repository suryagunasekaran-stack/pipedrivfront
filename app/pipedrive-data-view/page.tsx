'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import QuotationDetails from '../components/QuotationDetails';
import QuoteExistsPage from '../components/QuoteExistsPage';
import XeroConnectionStatus from '../components/XeroConnectionStatus';
import { usePipedriveData } from '../hooks/usePipedriveData';
import { useXeroStatus } from '../hooks/useXeroStatus';
import { useToast } from '../hooks/useToastNew';
import { useAuth } from '../hooks/useAuth';
import { ERROR_MESSAGES, API_ENDPOINTS, DEFAULT_PIPEDRIVE_DOMAIN, REDIRECT_DELAY } from '../constants';
import { XeroQuoteResponse } from '../types/pipedrive';
import { apiCall } from '../utils/apiClient';
import SimpleLoader from '../components/SimpleLoader';

/**
 * Main page component for displaying Pipedrive data
 * 
 * This page fetches and displays:
 * - Deal details from Pipedrive
 * - Contact and organization information
 * - Product details with financial calculations
 * 
 * @returns JSX.Element - The rendered page component
 */
export default function PipedriveDataView() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');
  const uiAction = searchParams.get('uiAction');
  const router = useRouter();
  
  // State to track if we've already attempted authentication
  const [authAttempted, setAuthAttempted] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);

  // Authentication handling
  const { checkAuth, handleAuthRedirect, isCheckingAuth } = useAuth();

  // Custom hooks for data fetching and state management
  const { data, loading, error, refetch } = usePipedriveData(dealId, companyId);
  const { 
    xeroConnected, 
    loading: xeroStatusLoading, 
    error: xeroStatusError, 
    refetchStatus 
  } = useXeroStatus(companyId);
  const toast = useToast();

  // Check authentication on mount - only once
  useEffect(() => {
    if (authAttempted) return; // Prevent multiple auth attempts
    
    const verifyAuth = async () => {
      try {
        setAuthAttempted(true);
        
        const authResponse = await checkAuth(companyId || undefined);
        if (!authResponse.authenticated) {
          handleAuthRedirect(authResponse);
          return;
        }

        // Don't auto-redirect to Xero auth - let user decide
      } catch (error) {
        console.error('Authentication check failed:', error);
        toast.error('Authentication check failed. Please try again.');
      }
    };

    verifyAuth();
  }, [authAttempted, checkAuth, handleAuthRedirect, companyId, toast]);

  // Handle create quote functionality
  const handleCreateQuote = async () => {
    if (!dealId || !companyId) {
      toast.error('Missing Pipedrive Deal ID or Company ID');
      return;
    }

    if (!xeroConnected) {
      toast.error('Not connected to Xero. Please connect to Xero first.');
      return;
    }

    setCreatingQuote(true);
    
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

      // Redirect after a short delay to allow toast to be seen
      setTimeout(() => {
        const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || DEFAULT_PIPEDRIVE_DOMAIN;
        router.push(`https://${pipedriveDomain}/deal/${dealId}`);
      }, REDIRECT_DELAY);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quote';
      toast.error(errorMessage);
      
      // If it's an auth error, refresh the Xero status
      if (errorMessage.includes('auth') || errorMessage.includes('token')) {
        toast.info('Refreshing Xero connection status...');
        refetchStatus();
      }
    } finally {
      setCreatingQuote(false);
    }
  };

  // Handle loading state (including auth check)
  if (loading || isCheckingAuth || xeroStatusLoading || !authAttempted) {
    return <SimpleLoader/>;
  }

  // Handle error state with retry functionality
  if (error || xeroStatusError) {
    return (
      <ErrorDisplay 
        error={error || xeroStatusError || 'An error occurred'} 
        onRetry={() => {
          refetch();
          refetchStatus();
          setAuthAttempted(false); // Allow retry of auth
        }} 
      />
    );
  }

  // Handle no data state
  if (!data) {
    return (
      <ErrorDisplay 
        error="No data found. Please check your deal ID and company ID."
        onRetry={() => {
          refetch();
          refetchStatus();
          setAuthAttempted(false); // Allow retry of auth
        }}
      />
    );
  }

  // Check if quote already exists from the deal's custom field
  // Using specific custom field hash - TODO: implement company-specific mapping
  const existingQuoteNumber = data.dealDetails?.["5016d4ba7c51895eef88fadadff9ddd1301da89e"];

  // Console log to see the actual data structure
  console.log('Deal Details:', data.dealDetails);
  console.log('Full Data:', data);
  console.log('Quotation Number:', existingQuoteNumber);

  // If quote exists, show the quote page
  if (existingQuoteNumber && xeroConnected) {
    return (
      <QuoteExistsPage
        type="quote"
        number={existingQuoteNumber}
        dealId={dealId}
        companyId={companyId}
        dealTitle={data.dealDetails?.title}
        organizationName={data.organizationDetails?.name}
      />
    );
  }

  // Default view - show quotation details and create quote option
  return (
    <div className="min-h-screen bg-white py-6 px-2 sm:px-4 flex flex-col items-center">
      {/* Main quotation details card */}
      <QuotationDetails data={data} />
      
      {/* Show special message if uiAction=createQuote */}
      {uiAction === 'createQuote' && !existingQuoteNumber && (
        <div className="w-full max-w-5xl bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You've been directed here to create a Xero quote for this Pipedrive deal.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Quote Section - Always show if uiAction is createQuote or if user wants to create quote */}
      {(uiAction === 'createQuote' || xeroConnected) && (
        <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Create Xero Quote</h3>
          
          {/* Show Xero connection status and options */}
          <div className="mb-4">
            <XeroConnectionStatus
              companyId={companyId}
              xeroConnected={xeroConnected}
              loading={xeroStatusLoading}
              error={xeroStatusError}
              onRefreshStatus={refetchStatus}
            />
          </div>
          
          {/* Create Quote Button - only enabled if connected */}
          <div className="flex justify-center">
            <button
              onClick={handleCreateQuote}
              disabled={creatingQuote || !xeroConnected}
              className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                xeroConnected && !creatingQuote
                  ? 'text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  : 'text-gray-500 bg-gray-300 cursor-not-allowed'
              }`}
            >
              {creatingQuote ? 'Creating Xero Quote...' : 'Create Xero Quote'}
            </button>
          </div>
          
          {!xeroConnected && (
            <p className="text-center text-sm text-gray-600 mt-2">
              Please connect to Xero first to enable quote creation
            </p>
          )}
        </div>
      )}
    </div>
  );
}
