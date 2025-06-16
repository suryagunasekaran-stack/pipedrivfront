'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '../components/ErrorDisplay';
import QuoteUpdateSuccess from '../components/QuoteUpdateSuccess';
import { useToast } from '../hooks/useToastNew';
import { useAuth } from '../hooks/useAuth';
import { useQuotationData } from '../hooks/useQuotationData';
import { REDIRECT_DELAY, DEFAULT_PIPEDRIVE_DOMAIN } from '../constants';
import { api } from '../utils/apiClient';
import SimpleLoader from '../components/SimpleLoader';
import { 
  formatCurrency, 
  calculateProductsTotal, 
  getXeroStatusColor, 
  getComparisonItemColor, 
  getComparisonSummaryClass,
  getProductUnitPrice
} from '../utils/quotationUtils';
import { QuotationDataResponse, ComparisonAnalysis, UpdateQuoteResponse } from '../types/quotation';

function UpdateQuotationContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');
  const router = useRouter();
  
  const [updatingQuote, setUpdatingQuote] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<UpdateQuoteResponse['data'] | null>(null);

  // Custom hooks
  const { checkAuth, handleAuthRedirect, isCheckingAuth } = useAuth();
  const toast = useToast();
  const { quotationData, comparisonAnalysis, loading, error, refetch } = useQuotationData(dealId, companyId);

  // Check authentication on mount
  useEffect(() => {
    if (authAttempted) return;
    
    const verifyAuth = async () => {
      try {
        setAuthAttempted(true);
        
        const authResponse = await checkAuth(companyId || undefined);
        if (!authResponse.authenticated) {
          handleAuthRedirect(authResponse);
          return;
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        toast.error('Authentication check failed. Please try again.');
      }
    };

    verifyAuth();
  }, [authAttempted, checkAuth, handleAuthRedirect, companyId, toast]);

  // Handle update quote functionality
  const handleUpdateQuote = async () => {
    if (!dealId || !companyId) {
      toast.error('Missing Deal ID or Company ID');
      return;
    }

    if (!comparisonAnalysis?.canUpdate) {
      toast.error(comparisonAnalysis?.message || 'Cannot update quote');
      return;
    }

    if (!quotationData?.xeroQuotation?.quoteId) {
      toast.error('Xero Quote ID not found. Cannot update quote.');
      return;
    }

    setUpdatingQuote(true);
    
    try {
      const updatePayload = { 
        dealId, 
        companyId,
        quoteId: quotationData?.xeroQuotation?.quoteId,
        // Include the full product data for the backend to sync
        products: quotationData.products,
        // Include discount analysis for backend reference
        discountAnalysis: comparisonAnalysis?.productComparison?.discountAnalysis,
        // Include comparison mismatches for context
        comparisonMismatches: comparisonAnalysis?.productComparison?.mismatches
      };

      // LOG THE PAYLOAD BEING SENT
      console.log('=== UPDATE QUOTE PAYLOAD BEING SENT ===');
      console.log(JSON.stringify(updatePayload, null, 2));
      console.log('=== FULL QUOTATION DATA CONTEXT ===');
      console.log('Products:', quotationData.products);
      console.log('Xero Quotation:', quotationData.xeroQuotation);
      console.log('Comparison Analysis:', comparisonAnalysis);
      console.log('=== END PAYLOAD LOG ===');
      
      const response = await api.updateXeroQuote(updatePayload);
      
      console.log('=== UPDATE QUOTE RESPONSE ===');
      console.log(JSON.stringify(response, null, 2));
      console.log('=== END RESPONSE LOG ===');
      
      // Show success component instead of toast and redirect
      setUpdateSuccess(response.data);

    } catch (error) {
      console.error('=== UPDATE QUOTE ERROR ===', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quote';
      toast.error(errorMessage);
    } finally {
      setUpdatingQuote(false);
    }
  };

  // Debug: Log the full response payload
  useEffect(() => {
    if (quotationData) {
      console.log('=== FULL QUOTATION DATA PAYLOAD ===');
      console.log(JSON.stringify(quotationData, null, 2));
      console.log('=== END PAYLOAD ===');
    }
    
    if (comparisonAnalysis) {
      console.log('=== COMPARISON ANALYSIS ===');
      console.log(JSON.stringify(comparisonAnalysis, null, 2));
      console.log('=== END COMPARISON ANALYSIS ===');
    }

    if (quotationData?.products) {
      console.log('=== PRODUCT DATA ===');
      quotationData.products.forEach((product, index) => {
        console.log(`Product ${index}:`, {
          name: product.name,
          quantity: product.quantity,
          unit_price: product.unit_price,
          unit_price_type: typeof product.unit_price,
          sum: product.sum,
          sum_type: typeof product.sum
        });
      });
    }
  }, [quotationData, comparisonAnalysis]);

  // Show success component if update was successful
  if (updateSuccess) {
    return (
      <QuoteUpdateSuccess 
        updateData={updateSuccess}
        dealTitle={quotationData?.deal.title}
        onClose={() => setUpdateSuccess(null)}
      />
    );
  }

  // Handle loading state
  if (loading || isCheckingAuth || !authAttempted) {
    return <SimpleLoader />;
  }

  // Handle error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={refetch} 
      />
    );
  }

  // Handle no data state
  if (!quotationData) {
    return (
      <ErrorDisplay 
        error="No quotation data found."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Update Xero Quotation</h1>
          <div className="text-sm text-gray-600">
            <p>Deal: {quotationData.deal.title}</p>
            <p>Quote Number: {quotationData.quotationNumber || 'N/A'}</p>
            {quotationData.xeroQuotation && (
              <p>Xero Status: <span className={`font-semibold ${getXeroStatusColor(quotationData.xeroQuotation.status)}`}>
                {quotationData.xeroQuotation.status}
              </span></p>
            )}
          </div>
        </div>

        {/* Deal & Organization Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Deal Details */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Deal Value</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(quotationData.deal.value, quotationData.deal.currency)}
                </dd>
              </div>
              {quotationData.deal.expected_close_date && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Expected Close Date</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(quotationData.deal.expected_close_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {quotationData.deal.department && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Department</dt>
                  <dd className="text-sm font-medium text-gray-900">{quotationData.deal.department}</dd>
                </div>
              )}
              {quotationData.deal.vesselName && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Vessel Name</dt>
                  <dd className="text-sm font-medium text-gray-900">{quotationData.deal.vesselName}</dd>
                </div>
              )}
              {quotationData.deal.location && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Location</dt>
                  <dd className="text-sm font-medium text-gray-900">{quotationData.deal.location}</dd>
                </div>
              )}
              {quotationData.deal.salesInCharge && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Sales In Charge</dt>
                  <dd className="text-sm font-medium text-gray-900">{quotationData.deal.salesInCharge}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            {quotationData.organization && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Organization</h3>
                <p className="text-sm text-gray-900">{quotationData.organization.name}</p>
                {quotationData.organization.address && (
                  <p className="text-sm text-gray-600">{quotationData.organization.address}</p>
                )}
              </div>
            )}
            {quotationData.person && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Contact Person</h3>
                <p className="text-sm text-gray-900">{quotationData.person.name}</p>
                {quotationData.person.email?.[0] && (
                  <p className="text-sm text-gray-600">{quotationData.person.email[0].value}</p>
                )}
                {quotationData.person.phone?.[0] && (
                  <p className="text-sm text-gray-600">{quotationData.person.phone[0].value}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Comparison */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Comparison</h2>
          
          {/* Comparison Summary */}
          {comparisonAnalysis && (
            <div className={`mb-4 p-4 rounded-lg ${getComparisonSummaryClass(comparisonAnalysis)}`}>
              <div className="flex items-center">
                <div className="flex-1">
                  {comparisonAnalysis.canUpdate ? (
                    (() => {
                      const discountIssues = comparisonAnalysis.productComparison?.discountAnalysis?.filter(
                        item => !item.discountMatch || (item.discrepancy && item.discrepancy > 0.01)
                      ) || [];
                      const hasChanges = comparisonAnalysis.hasChanges || discountIssues.length > 0;
                      
                      return hasChanges ? (
                        <>
                          <p className="text-sm font-semibold text-yellow-800">Changes Detected</p>
                          <p className="text-sm text-yellow-600">
                            {comparisonAnalysis.newProducts?.length || 0} new products, 
                            {' '}{comparisonAnalysis.removedItems?.length || 0} removed items, 
                            {' '}{comparisonAnalysis.changedItems?.length || 0} changed items
                            {discountIssues.length > 0 && (
                              <>, {discountIssues.length} discount mismatches</>
                            )}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-green-800">No changes detected</p>
                      );
                    })()
                  ) : (
                    <p className="text-sm font-semibold text-red-800">
                      {comparisonAnalysis.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pipedrive Products */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Pipedrive Products ({quotationData.products.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotationData.products.map((product, index) => {
                      const discountInfo = comparisonAnalysis?.productComparison?.discountAnalysis?.find(
                        d => d.productIndex === (index + 1) || d.productName === product.name
                      );
                      // Debug: Log the matching attempt
                      if (comparisonAnalysis?.productComparison?.discountAnalysis && comparisonAnalysis.productComparison.discountAnalysis.length > 0) {
                        console.log('Pipedrive Product Matching:', {
                          productIndex: index + 1,
                          productName: product.name,
                          discountAnalysis: comparisonAnalysis.productComparison.discountAnalysis,
                          matchFound: !!discountInfo
                        });
                      }
                      return (
                        <tr key={product.id} className={getComparisonItemColor(
                          product.id, 
                          comparisonAnalysis?.newProducts, 
                          comparisonAnalysis?.changedItems
                        )}>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{product.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatCurrency(getProductUnitPrice(product), product.currency)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatCurrency(product.sum, product.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        Total
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(
                          calculateProductsTotal(quotationData.products),
                          quotationData.products[0]?.currency
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Xero Line Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Xero Line Items ({quotationData.xeroQuotation?.lineItems?.length || 0})
              </h3>
              {quotationData.xeroQuotation ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quotationData.xeroQuotation.lineItems.map((item, index) => {
                        const discountInfo = comparisonAnalysis?.productComparison?.discountAnalysis?.find(
                          d => d.productIndex === (index + 1) || d.productName === item.Description
                        );
                        // Debug: Log the matching attempt
                        if (comparisonAnalysis?.productComparison?.discountAnalysis && comparisonAnalysis.productComparison.discountAnalysis.length > 0) {
                          console.log('Xero Product Matching:', {
                            productIndex: index + 1,
                            description: item.Description,
                            discountAnalysis: comparisonAnalysis.productComparison.discountAnalysis,
                            matchFound: !!discountInfo
                          });
                        }
                        return (
                          <tr key={index} className={
                            comparisonAnalysis?.removedItems?.find(i => i.Description === item.Description) ? 'bg-red-50' : ''
                          }>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.Description}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.Quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                              {formatCurrency(item.UnitAmount)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                              {formatCurrency(item.LineAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                                          <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-700 text-right">
                            Subtotal
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatCurrency(quotationData.xeroQuotation.subTotal)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-700 text-right">
                            Tax
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {formatCurrency(quotationData.xeroQuotation.totalTax)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            Total
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(quotationData.xeroQuotation.total)}
                          </td>
                        </tr>
                      </tfoot>
                  </table>
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center text-gray-500">
                  No Xero quotation found
                </div>
              )}
            </div>
          </div>

          {/* Discount Summary */}
          {comparisonAnalysis?.productComparison?.discountAnalysis && 
           comparisonAnalysis.productComparison.discountAnalysis.some(item => !item.discountMatch) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Discount Mismatches Detected</h4>
              <div className="space-y-2">
                {comparisonAnalysis.productComparison.discountAnalysis
                  .filter(item => !item.discountMatch)
                  .map((item, index) => (
                    <div key={index} className="text-xs p-2 bg-white rounded border border-red-100">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className="text-gray-600">Pipedrive: </span>
                          <span className="text-green-700">
                            ${item.pipedrive.baseAmount.toFixed(2)} → ${item.pipedrive.expectedAmount.toFixed(2)}
                          </span>
                          <div className="text-green-600 text-xs">
                            ({item.pipedrive.discountValue}{item.pipedrive.discountType === 'percentage' ? '%' : '$'} discount)
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Xero: </span>
                          <span className="text-blue-700">${item.xero.lineAmount.toFixed(2)}</span>
                          <div className="text-gray-500 text-xs">
                            ({item.xero.discountRate > 0 ? `${item.xero.discountRate}% discount` : 'No discount'})
                          </div>
                        </div>
                      </div>
                      {item.discrepancy && item.discrepancy > 0 && (
                        <div className="mt-1 text-red-600 font-semibold text-xs">
                          Difference: ${item.discrepancy.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Show discount summary even if matches exist */}
          {comparisonAnalysis?.productComparison?.totalDiscrepancies && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">💰 Total Discount Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-gray-600">Before Discounts</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(comparisonAnalysis.productComparison.totalDiscrepancies.pipedriveTotalBeforeDiscount)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Expected After Discounts</div>
                  <div className="font-semibold text-green-700">
                    {formatCurrency(comparisonAnalysis.productComparison.totalDiscrepancies.pipedriveExpectedTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Xero Actual Total</div>
                  <div className="font-semibold text-blue-700">
                    {formatCurrency(comparisonAnalysis.productComparison.totalDiscrepancies.xeroActualTotal)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Total Difference</div>
                  <div className={`font-semibold ${
                    Math.abs(comparisonAnalysis.productComparison.totalDiscrepancies.discountDifference) > 0 
                      ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {Math.abs(comparisonAnalysis.productComparison.totalDiscrepancies.discountDifference) > 0 
                      ? `$${Math.abs(comparisonAnalysis.productComparison.totalDiscrepancies.discountDifference).toFixed(2)}`
                      : '✅ Perfect match'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          {comparisonAnalysis?.hasChanges && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span>New in Pipedrive</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span>Changed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span>Removed from Pipedrive</span>
              </div>
            </div>
          )}
        </div>

        {/* Update Button */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-center">
            <button
              onClick={handleUpdateQuote}
              disabled={updatingQuote || !comparisonAnalysis?.canUpdate}
              className={`inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-md shadow-sm transition-colors ${
                comparisonAnalysis?.canUpdate
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {updatingQuote ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating on Xero...
                </>
              ) : 'Update on Xero'}
            </button>
          </div>
          {!comparisonAnalysis?.canUpdate && comparisonAnalysis?.message && (
            <p className="mt-2 text-center text-sm text-red-600">
              {comparisonAnalysis.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return <SimpleLoader />;
}

export default function UpdateQuotationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UpdateQuotationContent />
    </Suspense>
  );
}