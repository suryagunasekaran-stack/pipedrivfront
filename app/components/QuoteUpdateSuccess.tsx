/**
 * Success component shown after quote update completion
 */

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils/quotationUtils';

interface QuoteUpdateSuccessProps {
  updateData: {
    dealId: string;
    quoteId?: string;
    originalQuoteNumber?: string;
    updatedQuoteNumber?: string;
    newVersion?: string;
    previousVersion?: string;
    status?: string;
    lineItemsUpdated?: number;
    totalAmount?: number;
    currency?: string;
    lastUpdated?: string;
    // Add quote object structure to match API response
    quote?: {
      QuoteID: string;
      QuoteNumber: string;
      Status: string;
      Total: number;
      CurrencyCode: string;
      UpdatedDateUTC: string;
      LineItems: any[];
      Title?: string;
    };
  };
  dealTitle?: string;
  onClose?: () => void;
}

export default function QuoteUpdateSuccess({ 
  updateData, 
  dealTitle,
  onClose 
}: QuoteUpdateSuccessProps) {
  const handleCloseWindow = () => {
    if (typeof window !== 'undefined') {
      window.close();
    }
  };

  const handleGoToPipedrive = () => {
    // Since Pipedrive domains are custom, show a message instead of redirecting
    alert('Quote updated successfully! Please return to your Pipedrive account to view the updated deal.');
  };

  // Extract values from the API response structure
  const quote = updateData.quote;
  const totalAmount = quote?.Total ?? updateData.totalAmount ?? 0;
  const currency = quote?.CurrencyCode ?? updateData.currency ?? 'USD';
  const status = quote?.Status ?? updateData.status ?? 'UNKNOWN';
  const lineItemsCount = quote?.LineItems?.length ?? updateData.lineItemsUpdated ?? 0;
  const quoteId = quote?.QuoteID ?? updateData.quoteId ?? '';
  
  // Handle Xero date format "/Date(1750131022057)/" or fallback to updateData.lastUpdated
  const getFormattedDate = () => {
    const xeroDate = quote?.UpdatedDateUTC;
    if (xeroDate && typeof xeroDate === 'string' && xeroDate.startsWith('/Date(')) {
      // Extract timestamp from "/Date(1750131022057)/"
      const timestamp = parseInt(xeroDate.replace(/\/Date\((\d+)\)\//, '$1'));
      if (!isNaN(timestamp)) {
        return new Date(timestamp).toLocaleString();
      }
    }
    
    // Fallback to updateData.lastUpdated
    if (updateData.lastUpdated) {
      return new Date(updateData.lastUpdated).toLocaleString();
    }
    
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  Quote Updated Successfully!
                </h2>
                <p className="text-sm text-green-700">
                  Your Xero quotation has been updated
                </p>
              </div>
            </div>
          </div>

          {/* Update Details */}
          <div className="px-6 py-4">
            <dl className="space-y-3">
              {(dealTitle || quote?.Title) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Deal</dt>
                  <dd className="text-sm text-gray-900">{dealTitle || quote?.Title}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Quote Version</dt>
                <dd className="text-sm text-gray-900">
                  {updateData.previousVersion && (
                    <>
                      <span className="text-gray-600">{updateData.previousVersion}</span>
                      <span className="mx-2 text-gray-400">→</span>
                    </>
                  )}
                  <span className="font-semibold text-green-600">
                    {updateData.newVersion || quote?.QuoteNumber || updateData.updatedQuoteNumber || 'Updated'}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Items Updated</dt>
                <dd className="text-sm text-gray-900">{lineItemsCount} line items</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="text-sm text-gray-900 font-semibold">
                  {formatCurrency(totalAmount, currency)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">
                  {getFormattedDate()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 space-y-3">
            <button
              onClick={handleGoToPipedrive}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Task Complete
            </button>
            
            <button
              onClick={handleCloseWindow}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Close Window
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Quote ID: <span className="font-mono text-xs">{quoteId}</span>
          </p>
        </div>
      </div>
    </div>
  );
} 