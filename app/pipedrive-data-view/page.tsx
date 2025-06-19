'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import XeroConnectionStatus from '../components/XeroConnectionStatus';
import { usePipedriveData } from '../hooks/usePipedriveData';
import { useXeroStatus } from '../hooks/useXeroStatus';
import { useToast } from '../hooks/useToastNew';
import { useAuth } from '../hooks/useAuth';
import { ERROR_MESSAGES, API_ENDPOINTS, DEFAULT_PIPEDRIVE_DOMAIN, REDIRECT_DELAY } from '../constants';
import { XeroQuoteResponse } from '../types/pipedrive';
import { apiCall } from '../utils/apiClient';
import SimpleLoader from '../components/SimpleLoader';
import { calculateProductSummary, calculateProductFinancials } from '../utils/calculations';

// Import new UI components
import { 
  PageLayout, PageHeader, PageContent, ContentGrid, MainContent, Sidebar,
  Card, CardHeader, CardContent,
  Button,
  StatCard, InfoItem, AlertBox,
  DataRow, DetailCard
} from '../components/ui';

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
function PipedriveDataViewContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');
  const uiAction = searchParams.get('uiAction');
  // Extract additional parameters from query string
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('userEmail');
  const userName = searchParams.get('userName');
  const tenantId = searchParams.get('tenantId');
  const xeroConnectedParam = searchParams.get('xeroConnected');
  const xeroJustConnected = searchParams.get('xeroJustConnected');
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
      // Include user info and additional parameters from query params
      const requestBody = {
        pipedriveCompanyId: companyId,
        pipedriveDealId: dealId,
        // Include user info from query params
        ...(userId && { userId }),
        ...(userEmail && { userEmail }),
        ...(userName && { userName }),
        ...(tenantId && { tenantId }),
        ...(xeroConnectedParam && { xeroConnected: xeroConnectedParam === 'true' }),
        ...(xeroJustConnected && { xeroJustConnected: xeroJustConnected === 'true' }),
      };

      const responseData: XeroQuoteResponse = await apiCall(API_ENDPOINTS.XERO_QUOTE, {
        method: 'POST',
        body: JSON.stringify(requestBody),
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

  // Format currency helper
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
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
  const existingQuoteNumber = data.dealDetails?.["5016d4ba7c51895eef88fadadff9ddd1301da89e"];

  // If quote exists, redirect to quote exists page
  if (existingQuoteNumber && xeroConnected) {
    const QuoteExistsPage = require('../components/QuoteExistsPage').default;
    return (
      <QuoteExistsPage
        type="quote"
        number={existingQuoteNumber}
        dealId={dealId}
        companyId={companyId}
        dealTitle={data.dealDetails?.title}
        organizationName={data.organizationDetails?.name}
        userId={userId || undefined}
        userEmail={userEmail || undefined}
        userName={userName || undefined}
      />
    );
  }

  // Default view - show quotation details with new UI
  return (
    <PageLayout>
      <PageHeader 
        title="Pipedrive Deal Details" 
        subtitle="Review deal information and create Xero quote"
      />
      
      <PageContent>
        <ContentGrid>
          <MainContent>
            {/* Show special message if uiAction=createQuote */}
            {uiAction === 'createQuote' && !existingQuoteNumber && (
              <AlertBox type="info">
                You've been directed here to create a Xero quote for this Pipedrive deal.
              </AlertBox>
            )}
            
            {/* Deal Overview */}
            <Card>
              <CardHeader title="Deal Overview" />
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard 
                    label="Deal Title" 
                    value={data.dealDetails?.title || 'N/A'} 
                  />
                  <StatCard 
                    label="Currency" 
                    value={data.dealDetails?.currency || 'N/A'} 
                  />
                  <StatCard 
                    label="Created" 
                    value={data.dealDetails?.add_time ? new Date(data.dealDetails.add_time).toLocaleDateString() : 'N/A'} 
                  />
                  <StatCard 
                    label="Products" 
                    value={data.dealProducts?.length || 0} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Organization Details */}
            <Card>
              <CardHeader title="Organization Details" />
              <CardContent className="space-y-3">
                <DataRow 
                  label="Organization Name" 
                  value={data.organizationDetails?.name || 'N/A'} 
                />
                <DataRow 
                  label="Primary Contact" 
                  value={data.personDetails?.name || 'N/A'} 
                />
                <DataRow 
                  label="Email" 
                  value={data.personDetails?.email?.map((e: any) => e.value).join(', ') || 'N/A'} 
                />
                <DataRow 
                  label="Phone" 
                  value={data.personDetails?.phone?.map((p: any) => p.value).join(', ') || 'N/A'} 
                />
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card>
              <CardHeader title="Products" />
              <CardContent className="space-y-3">
                {data.dealProducts && data.dealProducts.length > 0 ? (
                  <>
                    {data.dealProducts.map((product: any, index: number) => {
                      const productCalc = calculateProductFinancials(product);
                      return (
                        <DetailCard
                          key={index}
                          title={product.name}
                          subtitle={`Quantity: ${product.quantity} × ${formatCurrency(product.item_price || 0, data.dealDetails?.currency)}`}
                          value={formatCurrency(productCalc.lineTotal, data.dealDetails?.currency)}
                          extra={
                            product.discount && product.discount > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Discount: {product.discount}{product.discount_type === 'percentage' ? '%' : ` ${data.dealDetails?.currency}`}
                              </p>
                            )
                          }
                        />
                      );
                    })}
                    
                    {/* Financial Summary */}
                    {(() => {
                      const summary = calculateProductSummary(data.dealProducts);
                      return (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Subtotal</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(summary.subtotal, data.dealDetails?.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Tax</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(summary.totalTax, data.dealDetails?.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-base font-medium text-gray-900">Total</span>
                              <span className="text-base font-semibold text-gray-900">
                                {formatCurrency(summary.grandTotal, data.dealDetails?.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No products found</p>
                )}
              </CardContent>
            </Card>
          </MainContent>
          
          <Sidebar>
            {/* Xero Integration */}
            <Card>
              <CardHeader title="Xero Integration" />
              <CardContent>
                <XeroConnectionStatus
                  companyId={companyId}
                  xeroConnected={xeroConnected}
                  loading={xeroStatusLoading}
                  error={xeroStatusError}
                  onRefreshStatus={refetchStatus}
                />
                
                <div className="mt-6">
                  <Button
                    onClick={handleCreateQuote}
                    disabled={!xeroConnected || creatingQuote}
                    loading={creatingQuote}
                    fullWidth
                  >
                    {creatingQuote ? 'Creating Xero Quote...' : 'Create Xero Quote'}
                  </Button>
                  
                  {!xeroConnected && (
                    <p className="text-center text-sm text-gray-600 mt-2">
                      Please connect to Xero first to enable quote creation
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Deal Information */}
            <Card>
              <CardHeader title="Deal Information" />
              <CardContent className="space-y-3">
                <InfoItem label="Deal ID" value={dealId || 'N/A'} />
                <InfoItem label="Company ID" value={companyId || 'N/A'} />
                <InfoItem label="Deal Title" value={data.dealDetails?.title || 'N/A'} />
                <InfoItem label="Created Date" value={
                  data.dealDetails?.add_time 
                    ? new Date(data.dealDetails.add_time).toLocaleDateString() 
                    : 'N/A'
                } />
              </CardContent>
            </Card>
            
            {/* Actions */}
            <Card>
              <CardHeader title="Actions" />
              <CardContent className="space-y-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || DEFAULT_PIPEDRIVE_DOMAIN;
                    window.open(`https://${pipedriveDomain}/deal/${dealId}`, '_blank');
                  }}
                >
                  View in Pipedrive
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </Sidebar>
        </ContentGrid>
      </PageContent>
    </PageLayout>
  );
}

function LoadingFallback() {
  return <SimpleLoader />;
}

export default function PipedriveDataView() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipedriveDataViewContent />
    </Suspense>
  );
}
