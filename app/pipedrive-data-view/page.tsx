'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '../components/ErrorDisplay';
import XeroConnectionStatus from '../components/XeroConnectionStatus';
import { usePipedriveData } from '../hooks/usePipedriveData';
import { useXeroStatus } from '../hooks/useXeroStatus';
import { useToast } from '../hooks/useToastNew';
import { ERROR_MESSAGES, API_ENDPOINTS, DEFAULT_PIPEDRIVE_DOMAIN, REDIRECT_DELAY } from '../constants';
import { XeroQuoteResponse } from '../types/pipedrive';
import { apiCall } from '../utils/apiClient';
import SimpleLoader from '../components/SimpleLoader';
import { calculateProductSummary, calculateProductFinancials } from '../utils/calculations';

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
  
  // Custom hooks for data fetching and state management
  const { data, loading, error, refetch } = usePipedriveData(dealId, companyId);
  const toast = useToast();


  // Handle create quote functionality
  const handleCreateQuote = async () => {
    if (!dealId || !companyId) {
      toast.error('Missing Pipedrive Deal ID or Company ID');
      return;
    }
    
    try {
      // Include user info and additional parameters from query params
      const requestBody = {
        pipedriveCompanyId: companyId,
        pipedriveDealId: dealId,
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
      
    }
  };

  // Format currency helper
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Handle loading state
  if (loading) {
    return <SimpleLoader/>;
  }


  // Handle no data state
  if (!data) {
    return (
      <ErrorDisplay 
        error="No data found. Please check your deal ID and company ID."
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  // Check if quote already exists from the deal's custom field
  const existingQuoteNumber = data.dealDetails?.customFields?.quoteNumber || 
                              data.dealDetails?.["5016d4ba7c51895eef88fadadff9ddd1301da89e"]; // Fallback for legacy

  // If quote exists, redirect to quote exists page
  if (existingQuoteNumber) {
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
    <div className="bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Section */}
        <div className="px-4 sm:px-0">
          <h3 className="text-base/7 font-semibold text-gray-900">Pipedrive Deal Details</h3>
          <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Review deal information and create Xero quote</p>
        </div>

        {/* Show special message if uiAction=createQuote */}
        {uiAction === 'createQuote' && !existingQuoteNumber && (
          <div className="mt-4 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              You've been directed here to create a Xero quote for this Pipedrive deal.
            </p>
          </div>
        )}

        {/* Deal Overview Section */}
        <div className="mt-6 border-t border-gray-100">
          <dl className="divide-y divide-gray-100">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Deal Title</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.dealDetails?.title || 'N/A'}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Currency</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.dealDetails?.currency || 'N/A'}</dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Created Date</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                {data.dealDetails?.add_time ? new Date(data.dealDetails.add_time).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-gray-900">Deal ID</dt>
              <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{dealId || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Organization Details Section */}
        <div className="mt-10">
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Organization Details</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Contact and company information</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Organization Name</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.organizationDetails?.name || 'N/A'}</dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Primary Contact</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.personDetails?.name || 'N/A'}</dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Email address</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {data.personDetails?.email?.map((e: any) => e.value).join(', ') || 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Phone</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {data.personDetails?.phone?.map((p: any) => p.value).join(', ') || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-10">
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Products</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Deal products and pricing</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            {data.dealProducts && data.dealProducts.length > 0 ? (
              <>
                <dl className="divide-y divide-gray-100">
                  {data.dealProducts.map((product: any, index: number) => {
                    const productCalc = calculateProductFinancials(product);
                    return (
                      <div key={index} className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">{product.name}</dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                          <div>
                            <span>Quantity: {product.quantity} × {formatCurrency(product.item_price || 0, data.dealDetails?.currency)}</span>
                            {product.discount && product.discount > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Discount: {product.discount}{product.discount_type === 'percentage' ? '%' : ` ${data.dealDetails?.currency}`})
                              </span>
                            )}
                            <span className="ml-4 font-medium">{formatCurrency(productCalc.lineTotal, data.dealDetails?.currency)}</span>
                          </div>
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {/* Financial Summary */}
                {(() => {
                  const summary = calculateProductSummary(data.dealProducts);
                  return (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <dl className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Subtotal</dt>
                          <dd className="font-medium text-gray-900">
                            {formatCurrency(summary.subtotal, data.dealDetails?.currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Tax</dt>
                          <dd className="font-medium text-gray-900">
                            {formatCurrency(summary.totalTax, data.dealDetails?.currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-4 text-base">
                          <dt className="font-medium text-gray-900">Total</dt>
                          <dd className="font-semibold text-gray-900">
                            {formatCurrency(summary.grandTotal, data.dealDetails?.currency)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">No products found</p>
            )}
          </div>
        </div>

        {/* Create Quote Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleCreateQuote}
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Quote
          </button>
        </div>
      </div>
    </div>
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
