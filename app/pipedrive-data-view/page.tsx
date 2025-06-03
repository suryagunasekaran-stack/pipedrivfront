'use client';

import { useSearchParams } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import QuotationDetails from '../components/QuotationDetails';
import XeroIntegration from '../components/XeroIntegration';
import { usePipedriveData } from '../hooks/usePipedriveData';
import { useXeroStatus } from '../hooks/useXeroStatus';
import { useToast } from '../hooks/useToastNew';
import { ERROR_MESSAGES } from '../constants';

/**
 * Main page component for displaying Pipedrive data and Xero integration
 * 
 * This page fetches and displays:
 * - Deal details from Pipedrive
 * - Contact and organization information
 * - Product details with financial calculations
 * - Xero connection status and quote creation functionality
 * 
 * @returns JSX.Element - The rendered page component
 */
export default function PipedriveDataView() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');

  // Custom hooks for data fetching and state management
  const { data, loading, error, refetch } = usePipedriveData(dealId, companyId);
  const { 
    xeroConnected, 
    loading: xeroStatusLoading, 
    error: xeroStatusError, 
    refetchStatus 
  } = useXeroStatus(companyId);
  const toast = useToast();

  // Handle loading state
  if (loading) {
    return <LoadingSpinner message="Loading Pipedrive data..." />;
  }

  // Handle error state with retry functionality
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => {
          refetch();
          refetchStatus();
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
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-2 sm:px-4 flex flex-col items-center">
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
  );
}
