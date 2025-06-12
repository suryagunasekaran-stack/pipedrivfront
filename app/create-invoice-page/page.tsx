'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '../components/ErrorDisplay';
import SimpleLoader from '../components/SimpleLoader';
import InvoiceCreationSuccess from '../components/InvoiceCreationSuccess';
import { useToast } from '../hooks/useToastNew';
import { useAuth } from '../hooks/useAuth';
import { BACKEND_API_BASE_URL } from '../constants';

interface DealInfo {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  existing_invoice_number?: string;
}

interface InvoicePreparationResponse {
  canCreateInvoice: boolean;
  hasExistingInvoice: boolean;
  error?: string;
  deal: DealInfo;
  xeroQuoteNumber: string;
  xeroQuoteId: string;
}

interface InvoiceCreationResponse {
  success: boolean;
  invoiceId: string;
  invoiceNumber: string;
  uploadResults?: {
    fileName: string;
    success: boolean;
    attachmentId?: string;
    error?: string;
  }[];
  error?: string;
}

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');
  const uiAction = searchParams.get('uiAction');
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preparationData, setPreparationData] = useState<InvoicePreparationResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState<InvoiceCreationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { checkAuth, handleAuthRedirect, isCheckingAuth } = useAuth();
  const toast = useToast();

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

  // Validate and prepare invoice creation
  useEffect(() => {
    if (!authAttempted || isCheckingAuth) return;
    
    const prepareInvoiceCreation = async () => {
      try {
        // Validate required parameters
        if (!dealId || !companyId) {
          setError('Missing required parameters. Please try again from Pipedrive.');
          setLoading(false);
          return;
        }

        const response = await fetch(`${BACKEND_API_BASE_URL}/api/pipedrive/create-invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dealId: dealId,
            companyId: companyId
          })
        });

        const data: InvoicePreparationResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to validate deal');
        }

        setPreparationData(data);
      } catch (error) {
        console.error('Preparation failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to prepare invoice creation');
      } finally {
        setLoading(false);
      }
    };

    prepareInvoiceCreation();
  }, [dealId, companyId, authAttempted, isCheckingAuth]);

  // Handle file selection
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        errors.push(`${file.name}: File too large (max 10MB)`);
      } else if (files.length > 5) {
        errors.push('Maximum 5 files allowed');
      } else {
        validFiles.push(file);
      }
    });

    // Show errors
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear selection
      }
      return;
    }

    setSelectedFiles(validFiles);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Create invoice
  const createInvoice = async () => {
    if (!dealId || !companyId) return;
    
    try {
      setCreating(true);
      const loadingToast = toast.loading('Creating invoice and uploading documents...');

      // Prepare form data
      const formData = new FormData();
      formData.append('dealId', dealId);
      formData.append('pipedriveCompanyId', companyId);

      // Add files if selected
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      // Call the API
      const response = await fetch(`${BACKEND_API_BASE_URL}/api/xero/create-invoice-with-documents`, {
        method: 'POST',
        body: formData,
      });

      const result: InvoiceCreationResponse = await response.json();

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create invoice');
      }

      // Success!
      handleSuccess(result);

    } catch (error) {
      console.error('Invoice creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  // Handle successful invoice creation
  const handleSuccess = (result: InvoiceCreationResponse) => {
    setCreationSuccess(result);
  };

  // Show success component if invoice was created
  if (creationSuccess) {
    return (
      <InvoiceCreationSuccess 
        invoiceNumber={creationSuccess.invoiceNumber}
        invoiceId={creationSuccess.invoiceId}
        dealTitle={preparationData?.deal.title}
        dealId={dealId || undefined}
        uploadResults={creationSuccess.uploadResults}
        onClose={() => setCreationSuccess(null)}
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
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // Handle invalid preparation data
  if (!preparationData) {
    return (
      <ErrorDisplay 
        error="Failed to load invoice preparation data"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Check if invoice creation is possible
  if (!preparationData.canCreateInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Cannot Create Invoice</h2>
            <p className="text-red-600">{preparationData.error || 'Unknown reason'}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if invoice already exists
  if (preparationData.hasExistingInvoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Invoice Already Exists</h2>
            <p className="text-yellow-600">
              This deal already has an invoice: <strong>{preparationData.deal.existing_invoice_number}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg p-6 animate-fadeInUp">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🧾 Create Invoice</h1>
          <p className="text-gray-600">Create an invoice for this deal in Xero</p>
        </div>

        {/* Deal and Quote Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Deal Information */}
          <div className="bg-white shadow-lg rounded-lg p-6 animate-fadeInLeftToRight">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span> Deal Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Title</dt>
                <dd className="text-sm text-gray-900 mt-1">{preparationData.deal.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Value</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {formatCurrency(preparationData.deal.value, preparationData.deal.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Deal ID</dt>
                <dd className="text-sm text-gray-900 mt-1">{preparationData.deal.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {preparationData.deal.status || 'Active'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Quote Information */}
          <div className="bg-white shadow-lg rounded-lg p-6 animate-fadeInLeftToRight" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📄</span> Quote Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Quote Number</dt>
                <dd className="text-sm text-gray-900 mt-1">{preparationData.xeroQuoteNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Quote ID</dt>
                <dd className="text-sm text-gray-900 mt-1 font-mono text-xs">{preparationData.xeroQuoteId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Ready for Invoice Creation
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Invoice Creation Form */}
        <div className="bg-white shadow-lg rounded-lg p-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🧾</span> Create Invoice
          </h3>
          
          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label htmlFor="documents" className="block text-sm font-medium text-gray-700 mb-2">
                📎 Attach Documents (Optional)
              </label>
              <input 
                ref={fileInputRef}
                type="file" 
                id="documents" 
                name="documents" 
                multiple 
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelection}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Max 5 files, 10MB each. Supported: PDF, DOC, XLS, Images, etc.
              </p>
              
              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📁 Selected Files:</h4>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{file.name}</span>
                        <span className="text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={creating}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ❌ Cancel
              </button>
              <button
                type="button"
                onClick={createInvoice}
                disabled={creating}
                className={`px-6 py-3 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  creating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {creating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Invoice...
                  </>
                ) : (
                  '🚀 Create Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format currency
function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

function LoadingFallback() {
  return <SimpleLoader />;
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateInvoiceContent />
    </Suspense>
  );
}