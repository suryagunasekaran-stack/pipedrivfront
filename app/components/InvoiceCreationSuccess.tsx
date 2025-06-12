'use client';

import { useEffect, useState } from 'react';

interface InvoiceCreationSuccessProps {
  invoiceNumber: string;
  invoiceId: string;
  dealTitle?: string;
  dealId?: string;
  uploadResults?: {
    fileName: string;
    success: boolean;
    attachmentId?: string;
    error?: string;
  }[];
  onClose?: () => void;
}

export default function InvoiceCreationSuccess({
  invoiceNumber,
  invoiceId,
  dealTitle,
  dealId,
  uploadResults,
  onClose
}: InvoiceCreationSuccessProps) {
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to Pipedrive deal
          if (dealId) {
            window.location.href = `https://app.pipedrive.com/deal/${dealId}`;
          } else if (onClose) {
            onClose();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dealId, onClose]);

  const successfulUploads = uploadResults?.filter(r => r.success) || [];
  const failedUploads = uploadResults?.filter(r => !r.success) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full animate-fadeInUp">
        <div className="bg-white shadow-2xl rounded-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Created Successfully!</h2>
          
          <div className="space-y-3 mb-6">
            <p className="text-gray-600">
              Invoice <span className="font-semibold text-gray-900">{invoiceNumber}</span> has been created in Xero.
            </p>
            
            {dealTitle && (
              <p className="text-sm text-gray-500">
                Deal: {dealTitle}
              </p>
            )}

            {/* Upload Results */}
            {uploadResults && uploadResults.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">📎 Document Upload Results:</h3>
                
                {successfulUploads.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-green-600 font-medium mb-1">✅ Successfully uploaded:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {successfulUploads.map((upload, idx) => (
                        <li key={idx} className="pl-4">• {upload.fileName}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {failedUploads.length > 0 && (
                  <div>
                    <p className="text-xs text-red-600 font-medium mb-1">❌ Failed to upload:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {failedUploads.map((upload, idx) => (
                        <li key={idx} className="pl-4">
                          • {upload.fileName}
                          {upload.error && <span className="text-red-500 ml-1">({upload.error})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Redirect Countdown */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Redirecting to Pipedrive in <span className="font-bold">{redirectCountdown}</span> seconds...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                if (dealId) {
                  window.location.href = `https://app.pipedrive.com/deal/${dealId}`;
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go to Pipedrive Now
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 