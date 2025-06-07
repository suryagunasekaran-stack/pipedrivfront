'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import QuotationDetails from '../components/QuotationDetails';
import XeroIntegration from '../components/XeroIntegration';
import { usePipedriveData } from '../hooks/usePipedriveData';
import { useXeroStatus } from '../hooks/useXeroStatus';
import { useToast } from '../hooks/useToastNew';
import { useAuth } from '../hooks/useAuth';
import { ERROR_MESSAGES } from '../constants';
import SimpleLoader from '../components/SimpleLoader';

/**
 * Enhanced main page component for displaying Pipedrive data and Xero integration
 * 
 * This page fetches and displays:
 * - Deal details from Pipedrive
 * - Contact and organization information
 * - Product details with financial calculations
 * - Xero connection status and quote creation functionality
 * 
 * @returns JSX.Element - The rendered page component
 */
function PipedriveDataViewContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');

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

  // Check authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authResponse = await checkAuth(companyId || undefined);
        if (!authResponse.authenticated) {
          handleAuthRedirect(authResponse);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Optionally handle auth check failure
      }
    };

    verifyAuth();
  }, [checkAuth, handleAuthRedirect, companyId]);

  // Enhanced loading state with skeleton placeholders
  if (isCheckingAuth) {
    return (
      <LoadingSpinner 
        message="Verifying access permissions..." 
        size="lg"
        variant="default"
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-6 px-2 sm:px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <LoadingSpinner 
              message="Loading deal data..." 
              size="md"
              variant="inline"
            />
          </div>
          
          {/* Main content skeletons */}
          <div className="space-y-6">
            {/* Deal details skeleton */}
            <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-6">
              <SkeletonLoader variant="card" lines={5} />
            </div>
            
            {/* Product table skeleton */}
            <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-6">
              <SkeletonLoader variant="table" lines={3} />
            </div>
            
            {/* Xero integration skeleton */}
            <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonLoader variant="profile" lines={2} />
                <SkeletonLoader variant="custom" lines={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with contextual information
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <ErrorDisplay 
          error={error}
          onRetry={() => {
            refetch();
            refetchStatus();
          }}
          variant="server"
          retryButtonText="Reload Deal Data"
          additionalActions={[
            {
              label: 'Back to Dashboard',
              action: () => window.location.href = '/',
              variant: 'secondary'
            },
            {
              label: 'Contact Support',
              action: () => window.open('mailto:support@example.com', '_blank'),
              variant: 'secondary'
            }
          ]}
        />
      </div>
    );
  }

  // Enhanced no data state
  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <ErrorDisplay 
          error="No deal data found. Please verify your deal ID and company ID parameters."
          onRetry={() => {
            refetch();
            refetchStatus();
          }}
          variant="validation"
          retryButtonText="Try Again"
          additionalActions={[
            {
              label: 'Back to Dashboard',
              action: () => window.location.href = '/',
              variant: 'secondary'
            }
          ]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-4">
      {/* Enhanced header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deal Overview</h1>
          <p className="text-gray-600">
            Manage your deal details and create quotes with Xero integration
          </p>
        </div>
      </div>

      {/* Main content container */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Main quotation details card */}
        <QuotationDetails data={data} />

        {/* Xero integration section */}
        <XeroIntegration
          dealId={dealId}
          companyId={companyId}
          data={data}
          xeroConnected={xeroConnected}
          xeroStatusLoading={xeroStatusLoading}
          xeroStatusError={xeroStatusError}
          onRefreshStatus={refetchStatus}
          toast={toast}
        />
      </div>
    </div>
  );
}

export default function PipedriveDataView() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner message="Loading deal view..." size="lg" />
      </div>
    }>
      <PipedriveDataViewContent />
    </Suspense>
  );
}
