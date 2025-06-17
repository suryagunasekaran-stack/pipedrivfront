'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '../components/ErrorDisplay';
import SimpleLoader from '../components/SimpleLoader';
import { useToast } from '../hooks/useToastNew';
import { useAuth } from '../hooks/useAuth';
import { BACKEND_API_BASE_URL } from '../constants';

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

function CreateInvoiceContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const projectNumber = searchParams.get('projectNumber');
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedLineItem[]>([]);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [authAttempted, setAuthAttempted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkAuth, handleAuthRedirect, isCheckingAuth } = useAuth();
  const toast = useToast();

  // Validate required parameters
  useEffect(() => {
    const isProjectBased = searchParams.get('isProjectBased');
    const requiredProjectNumber = searchParams.get('projectNumber');
    const requiredCompanyId = searchParams.get('companyId');
    
    if (isProjectBased !== 'true') {
      setError('This page is only available for project-based invoice creation');
      return;
    }
    
    if (!requiredProjectNumber) {
      setError('Project number is required for invoice creation');
      return;
    }
    
    if (!requiredCompanyId) {
      setError('Company ID is required');
      return;
    }
  }, [searchParams]);

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

  // Fetch project data
  useEffect(() => {
    if (!authAttempted || isCheckingAuth) return;
    
    const fetchProjectData = async () => {
      try {

        if (!projectNumber || !companyId) {
          throw new Error('Project number and company ID are required');
        }

        console.log('Fetching project data for:', { projectNumber, companyId });

        // Fetch real project data from backend
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/api/pipedrive/project-invoice-data?projectNumber=${encodeURIComponent(projectNumber)}&companyId=${encodeURIComponent(companyId)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch project data: ${response.status} ${errorText}`);
        }

        const projectData: ProjectData = await response.json();

        // Log incoming payload from backend
        console.log('Real Project Data Payload from Backend:', projectData);

        // Validate the data structure
        if (!projectData.projectNumber || !projectData.deals || !projectData.quotes) {
          throw new Error('Invalid project data structure received from backend');
        }

        setProjectData(projectData);
        
        // Auto-expand all quotes for better UX
        setExpandedQuotes(new Set(projectData.quotes.map(q => q.QuoteID)));
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [authAttempted, isCheckingAuth, projectNumber, companyId, searchParams]);

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
      item => item.lineItem.ItemCode === lineItem.ItemCode && item.quoteId === quote.QuoteID
    );

    if (isSelected) {
      setSelectedItems(selectedItems.filter(
        item => !(item.lineItem.ItemCode === lineItem.ItemCode && item.quoteId === quote.QuoteID)
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
      item => item.lineItem.ItemCode === lineItem.ItemCode && item.quoteId === quoteId
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

    // Add valid files and simulate upload
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Simulate file upload success after a short delay
      newFiles.forEach((uploadedFile, index) => {
        setTimeout(() => {
          setUploadedFiles(prev => 
            prev.map(uf => 
              uf.file.name === uploadedFile.file.name 
                ? { ...uf, uploadStatus: 'success', uploadMessage: 'Upload successful' }
                : uf
            )
          );
          toast.success(`${uploadedFile.file.name} uploaded successfully`);
        }, 1000 + (index * 500)); // Stagger uploads for realistic feel
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
      let response;

      // Check if there are uploaded files
      if (uploadedFiles.length > 0) {
        // Use multipart/form-data for requests with PDF attachments
        const formData = new FormData();
        formData.append('projectNumber', projectData?.projectNumber || '');
        formData.append('selectedItems', JSON.stringify(selectedItemsData));
        
        // Append all uploaded files
        uploadedFiles.forEach((uploadedFile) => {
          formData.append('files', uploadedFile.file);
        });

        console.log('Sending multipart request with files:', {
          projectNumber: projectData?.projectNumber,
          selectedItems: selectedItemsData,
          fileCount: uploadedFiles.length
        });

        response = await fetch('http://localhost:3000/api/xero/create-project-invoice', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
      } else {
        // Use JSON for requests without files
        const payload = {
          projectNumber: projectData?.projectNumber,
          selectedItems: selectedItemsData,
          uploadedFiles: []
        };

        console.log('Sending JSON request:', payload);

        response = await fetch('http://localhost:3000/api/xero/create-project-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create invoice: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Invoice creation response:', result);
      
      toast.success('Invoice created successfully!');
      
      // You can add additional success handling here, such as:
      // - Redirecting to a success page
      // - Showing invoice details
      // - Clearing selections
      
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
  if (loading || isCheckingAuth || !authAttempted) {
    return <SimpleLoader />;
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={() => window.location.reload()} 
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Project Number</p>
                  <p className="text-lg font-semibold text-gray-900">{projectData.projectNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Deals</p>
                  <p className="text-lg font-semibold text-gray-900">{projectData.summary.totalDeals}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deals Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(projectData.summary.totalDealsValue, projectData.summary.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quotes Value</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(projectData.summary.totalQuotesValue, projectData.summary.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Deals Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Deals</h2>
              <div className="space-y-3">
                {projectData.deals.map((deal) => (
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
                {projectData.quotes.map((quote, quoteIndex) => (
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
                        {quote.LineItems.map((lineItem, itemIndex) => {
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
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
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

            {/* Selected Items Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Items</h2>
              
              {selectedItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No items selected</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
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