/**
 * Success component shown after quote update completion
 */

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '../utils/quotationUtils';

interface QuoteUpdateSuccessProps {
  updateData: {
    dealId: string;
    quoteId: string;
    originalQuoteNumber: string;
    updatedQuoteNumber: string;
    status: string;
    lineItemsUpdated: number;
    totalAmount: number;
    currency: string;
    lastUpdated: string;
    versionHistory: {
      previousVersion: string;
      currentVersion: string;
      versionIncrement: number;
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
    const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || 'app.pipedrive.com';
    window.open(`https://${pipedriveDomain}/deal/${updateData.dealId}`, '_blank');
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
              {dealTitle && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Deal</dt>
                  <dd className="text-sm text-gray-900">{dealTitle}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Quote Version</dt>
                <dd className="text-sm text-gray-900">
                  <span className="text-gray-600">{updateData.versionHistory.previousVersion}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-semibold text-green-600">{updateData.versionHistory.currentVersion}</span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Items Updated</dt>
                <dd className="text-sm text-gray-900">{updateData.lineItemsUpdated} line items</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="text-sm text-gray-900 font-semibold">
                  {formatCurrency(updateData.totalAmount, updateData.currency)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    updateData.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    updateData.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {updateData.status}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(updateData.lastUpdated).toLocaleString()}
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
              View Deal in Pipedrive
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
            Quote ID: <span className="font-mono text-xs">{updateData.quoteId}</span>
          </p>
        </div>
      </div>
    </div>
  );
} 