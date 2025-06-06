'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense, useState, useCallback } from 'react'; // Added useState, useCallback
import ErrorDisplay from '../components/ErrorDisplay';
import QuotationDetails from '../components/QuotationDetails';
import XeroIntegrationSection from '../components/XeroIntegrationSection'; // Renamed for clarity
import { usePipedriveData, FetchedPipedriveData } from '../hooks/usePipedriveData';
// useXeroStatus might be re-evaluated later, but for now, page uses it.
// The xeroConnected flag from useAuthStore is likely more up-to-date if AppInitializer ran.
import { useXeroStatus } from '../hooks/useXeroStatus';
import { useToast } from '../hooks/useToastNew';
import SimpleLoader from '../components/SimpleLoader';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { apiService, ApiError, CreateQuoteResponse } from '../services/api'; // Import apiService and types

// Component to render actual page content
function PipedriveDataViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyIdFromUrl = searchParams.get('companyId');

  const { companyId: storeCompanyId, isAuthenticated } = useAuthStore();
  const effectiveCompanyId = storeCompanyId || companyIdFromUrl;

  const { data: pipedriveData, loading: pipedriveDataLoading, error: pipedriveDataError, refetch: refetchPipedriveData } = usePipedriveData(dealId, effectiveCompanyId);

  // Consider using isAuthenticated.xero from useAuthStore as the primary source for xeroConnected status
  // especially after AppInitializer has run checkAuthStatus.
  // The useXeroStatus hook might make an additional call.
  const { 
    xeroConnected: xeroConnectedByHook, // This comes from useXeroStatus's own fetch
    loading: xeroStatusLoading, 
    error: xeroStatusError, 
    refetchStatus: refetchXeroHookStatus
  } = useXeroStatus(effectiveCompanyId);

  const actualXeroConnected = isAuthenticated.xero; // Prefer store's state for Xero connection

  const toast = useToast();
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  const handleRefetchAll = useCallback(() => {
    if (effectiveCompanyId && dealId) refetchPipedriveData();
    // if (effectiveCompanyId) refetchXeroHookStatus(); // If still using useXeroStatus hook independently
    // More robust: trigger a global auth status refresh if needed
    if (effectiveCompanyId) useAuthStore.getState().checkAuthStatus(effectiveCompanyId);
  }, [effectiveCompanyId, dealId, refetchPipedriveData]);

  const handleCreateQuote = async () => {
    if (!effectiveCompanyId || !dealId) {
      toast.error('Company ID or Deal ID is missing.');
      return;
    }
    if (!actualXeroConnected) {
      toast.error('Xero is not connected. Please connect Xero first.');
      // Optionally, redirect to Xero connection page:
      // router.push(`/auth/xero?pipedriveCompanyId=${effectiveCompanyId}`);
      return;
    }

    setIsCreatingQuote(true);
    try {
      const result: CreateQuoteResponse = await apiService.createQuote({
        pipedriveCompanyId: effectiveCompanyId,
        pipedriveDealId: dealId,
      });
      toast.success(`Quote ${result.quoteNumber} created successfully in Xero!`);
      // Optionally, refresh Pipedrive data if quote creation updates it (e.g., adds a note or field)
      if (result.pipedriveDealUpdated) {
        refetchPipedriveData();
      }
    } catch (e: any) {
      if (e instanceof ApiError) {
        toast.error(`Failed to create quote: ${e.message}`);
      } else {
        toast.error('An unknown error occurred during quote creation.');
      }
      console.error("Create Quote Error:", e);
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const handleCreateProject = () => {
    if (!effectiveCompanyId || !dealId) {
      toast.error('Company ID or Deal ID is missing.');
      return;
    }
    router.push(`/create-project-page?dealId=${dealId}&companyId=${effectiveCompanyId}`);
  };

  // Loading state for Pipedrive data
  if (pipedriveDataLoading) {
    return <SimpleLoader message="Loading deal data..." />;
  }

  // Error state from Pipedrive data fetching
  if (pipedriveDataError) {
    return (
      <ErrorDisplay 
        error={`Failed to load Pipedrive data: ${pipedriveDataError}`}
        onRetry={handleRefetchAll}
      />
    );
  }

  // No data state
  if (!pipedriveData) {
    return (
      <ErrorDisplay 
        error="No Pipedrive deal data found. Please check the Deal ID and Company ID."
        onRetry={handleRefetchAll}
      />
    );
  }

  // Ensure dealId and effectiveCompanyId are available (they should be if pipedriveData is loaded)
  if (!dealId || !effectiveCompanyId) {
      return <ErrorDisplay error="Deal ID or Company ID is missing." onRetry={handleRefetchAll} />;
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            {pipedriveData.deal?.title || 'Deal Details'}
          </h1>
        </header>

        <QuotationDetails data={pipedriveData} />

        <XeroIntegrationSection
          companyId={effectiveCompanyId}
          dealId={dealId}
          pipedriveDealData={pipedriveData}
          isXeroConnected={actualXeroConnected} // Use store's Xero status
          isXeroStatusLoading={xeroStatusLoading} // From useXeroStatus hook, or could use store's isCheckingAuth
          xeroStatusError={xeroStatusError} // From useXeroStatus hook
          onRefreshXeroStatus={() => { // This would re-trigger the specific hook or global check
            if(effectiveCompanyId) useAuthStore.getState().checkAuthStatus(effectiveCompanyId);
          }}
          onCreateXeroQuote={handleCreateQuote}
          isCreatingQuote={isCreatingQuote}
          toast={toast}
        />

        <section aria-labelledby="actions-title" className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 id="actions-title" className="text-lg font-medium text-gray-900 mb-4">Project Actions</h2>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={handleCreateProject}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1"
              >
                Create/Link Project
              </button>
              {/* Add other general actions here if any */}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function PipedriveDataViewPage() {
  return (
    <Suspense fallback={<SimpleLoader message="Loading page..." />}>
      <ProtectedRoute requireXero={false}> {/* Pipedrive auth is required, Xero is optional for viewing */}
        <PipedriveDataViewContent />
      </ProtectedRoute>
    </Suspense>
  );
}
