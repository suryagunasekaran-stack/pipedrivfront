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
interface Product {
  id: number;
  product_id: number;
  name: string;
  item_price: number;
  quantity: number;
  sum: number;
  currency?: string;
  [key: string]: any; // Allow for additional fields
}

interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  stage: number;
  status: string;
  customFields: {
    abc123_project_number: string;
    [key: string]: string; // Allow for dynamic custom field keys
  };
  org_name: string;
  person_name: string;
  products?: Product[]; // Products from Pipedrive
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
  CurrencyCode?: string;
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
  const [expandedDeals, setExpandedDeals] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [invoiceCreationResult, setInvoiceCreationResult] = useState<InvoiceCreationResponse | null>(null);
  const [comments, setComments] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Auto-expand all quotes when project data is loaded
  useEffect(() => {
    if (projectData?.quotes) {
      setExpandedQuotes(new Set(projectData.quotes.map((q: any) => q.QuoteID)));
    }
  }, [projectData]);

  // Auto-expand all deals when project data is loaded
  useEffect(() => {
    if (projectData?.deals) {
      setExpandedDeals(new Set(projectData.deals.map((d: Deal) => d.id)));
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

  // Toggle deal expansion
  const toggleDealExpansion = (dealId: number) => {
    const newExpanded = new Set(expandedDeals);
    if (newExpanded.has(dealId)) {
      newExpanded.delete(dealId);
    } else {
      newExpanded.add(dealId);
    }
    setExpandedDeals(newExpanded);
  };

  // Toggle line item selection
  const toggleLineItemSelection = (lineItem: LineItem, quote: Quote, deal: Deal) => {
    // Defensive check: ensure deal exists and has required properties
    if (!deal || !deal.id || !deal.title) {
      console.error('Cannot toggle line item selection: deal is missing or invalid', { deal, lineItem, quote });
      toast.error('Unable to select item: deal information is missing');
      return;
    }

    const isSelected = selectedItems.some(
      item => item.lineItem.LineItemID === lineItem.LineItemID && item.quoteId === quote.QuoteID
    );

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

  // Toggle select all line items across all quotes
  const toggleSelectAll = () => {
    const availableDeal = projectData?.deals && projectData.deals.length > 0 ? projectData.deals[0] : null;
    if (!availableDeal) return;

    const allSelectableItems: SelectedLineItem[] = [];
    const filteredQuotes = projectData?.quotes?.filter((q: Quote) => q.Status === 'DRAFT' || q.Status === 'ACCEPTED') || [];
    filteredQuotes.forEach((quote: Quote) => {
      quote.LineItems.forEach((lineItem: LineItem) => {
        allSelectableItems.push({
          lineItem,
          quoteId: quote.QuoteID,
          quoteNumber: quote.QuoteNumber,
          quoteStatus: quote.Status,
          dealId: availableDeal.id,
          dealTitle: availableDeal.title,
        });
      });
    });

    const allSelected = allSelectableItems.length > 0 && allSelectableItems.every(item =>
      selectedItems.some(s => s.lineItem.LineItemID === item.lineItem.LineItemID && s.quoteId === item.quoteId)
    );

    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allSelectableItems);
    }
  };

  // Check if all line items are selected
  const areAllItemsSelected = (): boolean => {
    const availableDeal = projectData?.deals && projectData.deals.length > 0 ? projectData.deals[0] : null;
    if (!availableDeal) return false;

    const filteredQuotes = projectData?.quotes?.filter((q: Quote) => q.Status === 'DRAFT' || q.Status === 'ACCEPTED') || [];
    let totalItems = 0;
    for (const quote of filteredQuotes) {
      totalItems += quote.LineItems.length;
    }
    return totalItems > 0 && selectedItems.length === totalItems;
  };

  // Remove selected item
  const removeSelectedItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Process files (shared logic for both drag-drop and file input)
  const processFiles = (files: File[]) => {
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
  };

  // Handle file selection
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Project Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Project Number</p>
                  <p className="text-lg font-semibold text-gray-900">{projectData.projectNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Deals</p>
                  <p className="text-lg font-semibold text-gray-900">{projectData.summary.totalDeals}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Deals Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(projectData.summary.totalDealsValue, projectData.summary.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quotes Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(projectData.summary.totalQuotesValue, projectData.summary.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Deals Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Deals & Products</h2>
              <div className="space-y-4">
                {projectData.deals.map((deal: Deal) => (
                  <div key={deal.id} className="border border-gray-200 rounded-lg">
                    {/* Deal Header */}
                    <button
                      onClick={() => toggleDealExpansion(deal.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedDeals.has(deal.id) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                          <p className="text-xs text-gray-500">{deal.org_name} • {deal.person_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(deal.value, deal.currency)}
                        </p>
                        <div className="flex items-center justify-end space-x-2 mt-1">
                          <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {deal.currency}
                          </span>
                          <p className="text-xs text-gray-500">Deal #{deal.id}</p>
                        </div>
                      </div>
                    </button>

                    {/* Products */}
                    {expandedDeals.has(deal.id) && deal.products && deal.products.length > 0 && (
                      <div className="border-t border-gray-200">
                        {deal.products.map((product: Product, productIndex: number) => (
                          <div
                            key={`product-${product.id}-${productIndex}`}
                            className="px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">
                                {product.quantity} × {formatCurrency(product.item_price, deal.currency || projectData.summary.currency)} = {formatCurrency(product.sum || (product.item_price * product.quantity), deal.currency || projectData.summary.currency)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Product ID: {product.product_id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quotes Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Quotes & Line Items</h2>
                {projectData.deals && projectData.deals.length > 0 && (
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={areAllItemsSelected()}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                )}
              </div>
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
                          {formatCurrency(quote.Total, quote.CurrencyCode || projectData.summary.currency)}
                        </p>
                        <div className="flex items-center justify-end space-x-2 mt-1">
                          <span className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {quote.CurrencyCode || projectData.summary.currency}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            quote.Status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : quote.Status === 'ACCEPTED'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {quote.Status}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Line Items */}
                    {expandedQuotes.has(quote.QuoteID) && (
                      <div className="border-t border-gray-200">
                        {(!projectData.deals || projectData.deals.length === 0) && (
                          <div className="px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400">
                            <p className="text-sm text-yellow-800">
                              <strong>Warning:</strong> No deals available. Line items cannot be selected until deals are associated with this project.
                            </p>
                          </div>
                        )}
                        {quote.LineItems.map((lineItem: LineItem, itemIndex: number) => {
                          // Associate with the first deal, or use a fallback if no deals exist
                          const associatedDeal = projectData.deals && projectData.deals.length > 0 
                            ? projectData.deals[0] 
                            : null;
                          const isSelected = isLineItemSelected(lineItem, quote.QuoteID);
                          const canSelect = associatedDeal !== null;

                          return (
                            <div
                              key={`${quote.QuoteID}-${itemIndex}`}
                              className={`px-4 py-3 flex items-center space-x-3 transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                                  : canSelect 
                                  ? 'hover:bg-gray-50 hover:shadow-sm' 
                                  : 'opacity-60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={() => {
                                  if (associatedDeal) {
                                    toggleLineItemSelection(lineItem, quote, associatedDeal);
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{lineItem.Description}</p>
                                <p className="text-xs text-gray-500">
                                  {lineItem.Quantity} × {formatCurrency(lineItem.UnitAmount)} = {formatCurrency(lineItem.LineAmount)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">{lineItem.ItemCode}</p>
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
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <label
                    htmlFor="file-upload"
                    className="mt-2 block text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <span className="text-blue-600 hover:text-blue-700">Click to upload</span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, Images (Max 10MB per file)
                  </p>
                </div>
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

              {/* Sticky Summary Bar */}
              {selectedItems.length > 0 && (
                <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 rounded-full px-2.5 py-1 text-xs font-bold">
                        {selectedItems.length}
                      </div>
                      <span className="text-sm font-medium">Items Selected</span>
                    </div>
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        selectedItems.reduce((sum, item) => sum + item.lineItem.LineAmount, 0),
                        projectData.summary.currency
                      )}
                    </span>
                  </div>
                </div>
              )}

              {selectedItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No items selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select line items from quotes to create an invoice</p>
                </div>
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
                <button
                  onClick={generateInvoicePayload}
                  disabled={selectedItems.length === 0 || isGenerating}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    selectedItems.length === 0 || isGenerating
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

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="font-medium text-gray-900">Generating Invoice</p>
                <p className="text-sm text-gray-500">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}
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
