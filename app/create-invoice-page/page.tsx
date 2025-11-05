'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '../components/ErrorDisplay';
import SimpleLoader from '../components/SimpleLoader';
import { useToast } from '../hooks/useToastNew';
import { useProjectInvoiceData } from '../hooks/useProjectData';
import { BACKEND_API_BASE_URL } from '../constants';
import { getUserAuthData, appendUserAuthToUrl, addUserAuthHeaders } from '../utils/userAuth';

// Type definitions
interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  stage: number;
  status: string;
  customFields: {
    abc123_project_number: string;
  };
  org_name: string;
  person_name: string;
}

interface LineItem {
  LineItemID: string;
  Description: string;
  UnitAmount: number;
  Quantity: number;
  LineAmount: number;
  TaxAmount: number;
  ItemCode: string;
}

interface Quote {
  QuoteID: string;
  QuoteNumber: string;
  Status: string;
  Total: number;
  Contact: {
    Name: string;
    EmailAddress: string;
  };
  LineItems: LineItem[];
}

interface ProjectData {
  projectNumber: string;
  deals: Deal[];
  quotes: Quote[];
  summary: {
    totalDeals: number;
    totalDealsValue: number;
    totalQuotes: number;
    totalQuotesValue: number;
    currency: string;
  };
}

interface SelectedLineItem {
  lineItem: LineItem;
  quoteId: string;
  quoteNumber: string;
  quoteStatus: string;
  dealId: number;
  dealTitle: string;
}

interface UploadedFile {
  file: File;
  uploadStatus: 'pending' | 'success' | 'error';
  uploadMessage?: string;
}

interface InvoiceCreationResponse {
  success: boolean;
  projectNumber: string;
  companyId: string;
  invoices: any[];
  quotes: any[];
  attachments: any[];
  summary: {
    totalQuotes: number;
    totalItems: number;
    invoicesCreated: number;
    quotesUpdatedSuccessfully: number;
    quotesUpdateFailed: number;
    filesAttached: number;
    filesAttachmentFailed: number;
    isConsolidated: boolean;
    hasErrors: boolean;
    hasPartialQuotes: boolean;
  };
  details: {
    quotesMetadata: any[];
    partialQuotesCreated: any[];
  };
  warnings: any[];
  errors: any[];
}

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const projectNumber = searchParams.get('projectNumber');
  const router = useRouter();

  // Use the custom hook for data fetching
  const { projectData, loading, error, refetch } = useProjectInvoiceData(projectNumber, companyId);

  const [selectedItems, setSelectedItems] = useState<SelectedLineItem[]>([]);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [invoiceCreationResult, setInvoiceCreationResult] = useState<InvoiceCreationResponse | null>(null);
  const [comments, setComments] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Check if deal totals match quote totals
  const totalsMatch = projectData ?
    Math.abs(projectData.summary.totalDealsValue - projectData.summary.totalQuotesValue) < 0.01 :
    true;

  // Debug logging to see what values we're getting from backend
  useEffect(() => {
    if (projectData) {
      console.log('Project Data Summary:', {
        totalDealsValue: projectData.summary.totalDealsValue,
        totalQuotesValue: projectData.summary.totalQuotesValue,
        currency: projectData.summary.currency,
        totalsMatch: totalsMatch,
        difference: projectData.summary.totalQuotesValue - projectData.summary.totalDealsValue
      });
      console.log('Individual Deals:', projectData.deals.map((d: Deal) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        currency: d.currency
      })));
      console.log('Individual Quotes:', projectData.quotes.map((q: Quote) => ({
        QuoteID: q.QuoteID,
        QuoteNumber: q.QuoteNumber,
        Total: q.Total,
        LineItems: q.LineItems.map((li: LineItem) => ({
          Description: li.Description,
          LineAmount: li.LineAmount,
          TaxAmount: li.TaxAmount
        }))
      })));
    }
  }, [projectData, totalsMatch]);

  // Auto-expand all quotes when project data is loaded
  useEffect(() => {
    if (projectData?.quotes) {
      setExpandedQuotes(new Set(projectData.quotes.map((q: any) => q.QuoteID)));
    }
  }, [projectData]);

  // Toggle quote expansion
  const toggleQuoteExpansion = (quoteId: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedQuotes(newExpanded);
  };

  // Toggle line item selection
  const toggleLineItemSelection = (lineItem: LineItem, quote: Quote, deal: Deal) => {
    const isSelected = selectedItems.some(
      item => item.lineItem.LineItemID === lineItem.LineItemID && item.quoteId === quote.QuoteID
    );

    //fake
    if (isSelected) {
      setSelectedItems(selectedItems.filter(
        item => !(item.lineItem.LineItemID === lineItem.LineItemID && item.quoteId === quote.QuoteID)
      ));
    } else {
      setSelectedItems([...selectedItems, {
        lineItem,
        quoteId: quote.QuoteID,
        quoteNumber: quote.QuoteNumber,
        quoteStatus: quote.Status,
        dealId: deal.id,
        dealTitle: deal.title
      }]);
    }
  };

  // Check if line item is selected
  const isLineItemSelected = (lineItem: LineItem, quoteId: string) => {
    return selectedItems.some(
      item => item.lineItem.LineItemID === lineItem.LineItemID && item.quoteId === quoteId
    );
  };

  // Remove selected item
  const removeSelectedItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Handle file selection
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
      } else {
        // Check if file already exists
        const exists = uploadedFiles.some(uf => uf.file.name === file.name);
        if (exists) {
          errors.push(`${file.name}: File already uploaded`);
        } else {
          newFiles.push({
            file,
            uploadStatus: 'pending'
          });
        }
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    // Add valid files and mark as successful immediately
    if (newFiles.length > 0) {
      const successfulFiles = newFiles.map(file => ({
        ...file,
        uploadStatus: 'success' as const,
        uploadMessage: 'Upload successful'
      }));
      
      setUploadedFiles(prev => [...prev, ...successfulFiles]);
      
      // Show success messages
      successfulFiles.forEach((uploadedFile) => {
        toast.success(`${uploadedFile.file.name} uploaded successfully`);
      });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const removeUploadedFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    toast.info(`${fileToRemove.file.name} removed`);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate invoice payload
  const generateInvoicePayload = async () => {
    // Check if totals match before allowing invoice generation
    if (!totalsMatch) {
      toast.error('Cannot generate invoice: Deal and quote totals must match. Please update quote before invoicing.');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please select at least one line item');
      return;
    }

    setIsGenerating(true);
    
    const selectedItemsData = selectedItems.map(item => ({
      lineItemId: item.lineItem.LineItemID,
      description: item.lineItem.Description,
      quoteId: item.quoteId,
      quoteNumber: item.quoteNumber,
      quoteStatus: item.quoteStatus,
      dealId: item.dealId,
      unitAmount: item.lineItem.UnitAmount,
      quantity: item.lineItem.Quantity,
      lineAmount: item.lineItem.LineAmount
    }));

    try {
      // Get user auth data
      const userAuth = getUserAuthData();
      
      // Always use FormData for consistency
      const formData = new FormData();
      formData.append('projectNumber', projectData?.projectNumber || '');
      formData.append('companyId', companyId || '');
      formData.append('selectedItems', JSON.stringify(selectedItemsData));
      formData.append('comments', comments); // Append comments
      
      // Add user auth data to FormData
      if (userAuth) {
        if (userAuth.userId) {
          formData.append('userId', userAuth.userId);
        }
        if (userAuth.userEmail) {
          formData.append('userEmail', userAuth.userEmail);
        }
        if (userAuth.userName) {
          formData.append('userName', userAuth.userName);
        }
      }
      
      // Filter for successfully uploaded files and append them
      const successfullyUploadedFiles = uploadedFiles.filter(uf => uf.uploadStatus === 'success');
      if (successfullyUploadedFiles.length > 0) {
        successfullyUploadedFiles.forEach((uploadedFile) => {
          formData.append('documents', uploadedFile.file);
        });
      }

      console.log('Sending invoice creation request:', {
        projectNumber: projectData?.projectNumber,
        companyId: companyId,
        selectedItems: selectedItemsData,
        comments: comments,
        fileCount: successfullyUploadedFiles.length,
        fileNames: successfullyUploadedFiles.map(f => f.file.name),
        userId: userAuth?.userId
      });

      // Add user auth to URL and headers
      const urlWithAuth = appendUserAuthToUrl(`${BACKEND_API_BASE_URL}/api/xero/create-project-invoice`);
      const headersWithAuth = addUserAuthHeaders({});

      const response = await fetch(urlWithAuth, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: headersWithAuth
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create invoice: ${response.status} ${errorText}`);
      }

      const result: InvoiceCreationResponse = await response.json();
      console.log('Invoice creation response:', result);
      
      // Set the success result to display success UI
      setInvoiceCreationResult(result);
      
      toast.success('Invoice created successfully!');
      
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Loading state
  if (loading) {
    return <SimpleLoader />;
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => refetch()} 
      />
    );
  }

  // No data state
  if (!projectData) {
    return (
      <ErrorDisplay 
        error="No project data available"
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Success state
  if (invoiceCreationResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Invoice Created Successfully</h1>
                  <p className="mt-1 text-sm text-gray-500">Your invoice has been generated and is ready for review</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Invoices Created</p>
                  <p className="text-2xl font-semibold text-green-600">{invoiceCreationResult.summary.invoicesCreated}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Total Quotes</p>
                  <p className="text-2xl font-semibold text-blue-600">{invoiceCreationResult.summary.totalQuotes}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Quotes Updated</p>
                  <p className="text-2xl font-semibold text-blue-600">{invoiceCreationResult.summary.quotesUpdatedSuccessfully}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-semibold text-red-600">{invoiceCreationResult.summary.quotesUpdateFailed}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h2>
                <div className="space-y-4">
                  {invoiceCreationResult.invoices.map((invoice, index) => (
                    <div key={`invoice-${invoice.invoiceId}-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Invoice Number</p>
                          <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(invoice.total, projectData?.summary.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            invoice.status === 'DRAFT' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : invoice.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Created from Quote</p>
                        <p className="text-sm font-medium text-gray-900">{invoice.fromQuote}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote Updates */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Updates</h2>
                <div className="space-y-4">
                  {invoiceCreationResult.quotes.map((update: any, index: number) => (
                    <div key={`quote-update-${update.quoteId}-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{update.quoteNumber}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Update Type: {update.updateType} • Fully Invoiced: {update.fullyInvoiced ? 'Yes' : 'No'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Invoice: {update.invoiceNumber}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {update.success ? (
                            <div className="flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm font-medium">Success</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="text-sm font-medium">Failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Project Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Project Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Project Number</p>
                    <p className="text-lg font-semibold text-gray-900">{invoiceCreationResult.projectNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company ID</p>
                    <p className="text-sm font-medium text-gray-900">{companyId}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setInvoiceCreationResult(null);
                      setComments('');
                      setSelectedItems([]);
                      setUploadedFiles([]);
                    }}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create Another Invoice
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Create Invoice</h1>
            <p className="mt-1 text-sm text-gray-500">Select line items to include in the invoice</p>
          </div>
        </div>
      </div>

      {/* Prominent Warning Banner for Total Mismatch */}
      {projectData && !totalsMatch && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {/* Warning Icon with animation */}
                <svg className="h-8 w-8 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-bold text-red-800">
                  Total Mismatch: Please update quote before invoicing
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-medium">
                    Deals Total: {formatCurrency(projectData.summary.totalDealsValue, projectData.summary.currency)} |
                    Quotes Total: {formatCurrency(projectData.summary.totalQuotesValue, projectData.summary.currency)}
                  </p>
                  <p className="mt-1">
                    The deal and quote totals must match before you can generate an invoice. Please update the quote to match the deal value.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <div className={`bg-white rounded-lg shadow-sm border ${!totalsMatch ? 'border-red-400 border-2' : 'border-gray-200'} p-6`}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Project Overview
                {!totalsMatch && (
                  <span className="ml-2 text-sm font-normal text-red-600">
                    (Totals Mismatch)
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Project Number</p>
                  <p className="text-lg font-semibold text-gray-900">{projectData.projectNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deals</p>
                  <p className="text-lg font-semibold text-gray-900">{projectData.summary.totalDeals}</p>
                </div>
                <div className={!totalsMatch ? 'p-2 bg-red-50 rounded-md border border-red-200' : ''}>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500">Deals Value</p>
                    {!totalsMatch && (
                      <svg className="w-4 h-4 text-red-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-lg font-semibold ${!totalsMatch ? 'text-red-700' : 'text-gray-900'}`}>
                    {formatCurrency(projectData.summary.totalDealsValue, projectData.summary.currency)}
                  </p>
                </div>
                <div className={!totalsMatch ? 'p-2 bg-red-50 rounded-md border border-red-200' : ''}>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500">Quotes Value</p>
                    {!totalsMatch && (
                      <svg className="w-4 h-4 text-red-500 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-lg font-semibold ${!totalsMatch ? 'text-red-700' : 'text-gray-900'}`}>
                    {formatCurrency(projectData.summary.totalQuotesValue, projectData.summary.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Deals Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Deals</h2>
              <div className="space-y-3">
                {projectData.deals.map((deal: Deal) => (
                  <div key={deal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{deal.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {deal.org_name} • {deal.person_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(deal.value, deal.currency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Deal #{deal.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quotes Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quotes & Line Items</h2>
              <div className="space-y-4">
                {projectData.quotes
                  .filter((quote: Quote) => quote.Status === 'DRAFT' || quote.Status === 'ACCEPTED')
                  .map((quote: Quote, quoteIndex: number) => (
                  <div key={quote.QuoteID} className="border border-gray-200 rounded-lg">
                    {/* Quote Header */}
                    <button
                      onClick={() => toggleQuoteExpansion(quote.QuoteID)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedQuotes.has(quote.QuoteID) ? 'rotate-90' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{quote.QuoteNumber}</p>
                          <p className="text-xs text-gray-500">{quote.Contact.Name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(quote.Total, projectData.summary.currency)}
                        </p>
                        <p className="text-xs text-gray-500">{quote.Status}</p>
                      </div>
                    </button>

                    {/* Line Items */}
                    {expandedQuotes.has(quote.QuoteID) && (
                      <div className="border-t border-gray-200">
                        {quote.LineItems.map((lineItem: LineItem, itemIndex: number) => {
                          // For demo purposes, associate with the first deal
                          const associatedDeal = projectData.deals[0];
                          const isSelected = isLineItemSelected(lineItem, quote.QuoteID);
                          
                          return (
                            <div
                              key={`${quote.QuoteID}-${itemIndex}`}
                              className={`px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleLineItemSelection(lineItem, quote, associatedDeal)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{lineItem.Description}</p>
                                <p className="text-xs text-gray-500">
                                  {lineItem.Quantity} × {formatCurrency(lineItem.UnitAmount)} = {formatCurrency(lineItem.LineAmount)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Code: {lineItem.ItemCode}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Job Reports and Other Relevant Documents</h2>
              
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileSelection}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Choose Files
                </label>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  PDF, DOC, DOCX, XLS, XLSX, Images (Max 10MB per file)
                </p>
              </div>

              {uploadedFiles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No files uploaded</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div key={`${uploadedFile.file.name}-${uploadedFile.file.size}-${uploadedFile.file.lastModified}`} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 break-words">{uploadedFile.file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Size: {formatFileSize(uploadedFile.file.size)}
                          </p>
                          <div className="mt-1">
                            {uploadedFile.uploadStatus === 'pending' && (
                              <p className="text-xs text-yellow-600 flex items-center">
                                <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </p>
                            )}
                            {uploadedFile.uploadStatus === 'success' && (
                              <p className="text-xs text-green-600 flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Upload successful
                              </p>
                            )}
                            {uploadedFile.uploadStatus === 'error' && (
                              <p className="text-xs text-red-600">{uploadedFile.uploadMessage || 'Upload failed'}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeUploadedFile(index)}
                          className="ml-2 text-gray-400 hover:text-gray-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* File count */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Instructions</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                    Comments or Special Instructions
                  </label>
                  <textarea
                    id="comments"
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Enter any special instructions, payment terms, or additional notes for this invoice..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    These instructions will be included with the invoice for backend processing
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Items Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Items</h2>
              
              {selectedItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No items selected</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={`${item.quoteId}-${item.lineItem.LineItemID}`} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.lineItem.Description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Quote: {item.quoteNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            Deal: {item.dealTitle}
                          </p>
                          <p className="text-xs font-medium text-gray-900 mt-1">
                            {formatCurrency(item.lineItem.LineAmount)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeSelectedItem(index)}
                          className="ml-2 text-gray-400 hover:text-gray-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              {selectedItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-900">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(
                        selectedItems.reduce((sum, item) => sum + item.lineItem.LineAmount, 0),
                        projectData.summary.currency
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {/* Show error message if totals don't match */}
                {!totalsMatch && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Invoice generation disabled: Totals must match</span>
                    </div>
                  </div>
                )}
                <button
                  onClick={generateInvoicePayload}
                  disabled={selectedItems.length === 0 || isGenerating || !totalsMatch}
                  title={!totalsMatch ? 'Invoice generation disabled: Deal and quote totals must match' : ''}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedItems.length === 0 || isGenerating || !totalsMatch
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isGenerating ? 'Generating...' : 'Generate Invoice'}
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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