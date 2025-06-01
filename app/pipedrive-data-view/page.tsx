'use client';

import { useSearchParams, useRouter } from 'next/navigation'; // Import useRouter
import { useEffect, useState } from 'react';
import Toast from '../components/Toast'; // Import the Toast component

// Interfaces for the actual fetched data structure
interface FetchedDealDetails {
  id?: number;
  title?: string;
  add_time?: string; // Issue date
  expected_close_date?: string | null; // Expiry date
  currency?: string;
}

interface FetchedProductInfo {
  product_id?: number;
  name?: string;
  quantity?: number;
  item_price?: number;
  discount?: number;
  discount_type?: string;
  tax?: number;
  tax_method?: string;
}

interface FetchedOrganizationDetails {
  id?: number;
  name?: string; // Used for org_name
}

interface EmailEntry {
  value: string;
  primary?: boolean;
  label?: string;
}

interface PhoneEntry {
  value: string;
  primary?: boolean;
  label?: string;
}

interface FetchedPersonDetails {
  id?: number;
  name?: string; // Used for person_name
  email?: EmailEntry[];
  phone?: PhoneEntry[];
}

// This is the structure of the 'data' state object
interface FetchedPipedriveData {
  dealDetails?: FetchedDealDetails;
  dealProducts?: FetchedProductInfo[];
  organizationDetails?: FetchedOrganizationDetails;
  personDetails?: FetchedPersonDetails;
}

// Toast state type
interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export default function PipedriveDataView() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');

  const [data, setData] = useState<FetchedPipedriveData | null>(null);
  const [loading, setLoading] = useState(true); // This will be for data loading
  const [error, setError] = useState<string | null>(null);

  // State for Xero connection
  const [xeroConnected, setXeroConnected] = useState(false);
  const [xeroStatusLoading, setXeroStatusLoading] = useState(true);
  const [xeroStatusError, setXeroStatusError] = useState<string | null>(null);

  // State for Xero Quote Creation
  const [quoteCreating, setQuoteCreating] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null); // Kept for potential direct error display if needed
  const [quoteSuccessMessage, setQuoteSuccessMessage] = useState<string | null>(null); // Kept for potential direct success display

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Helper function to show toast
  const showToast = (type: ToastState['type'], title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 5000); // Auto-hide after 5 seconds
  };

  // Function to fetch Xero connection status
  const fetchXeroStatus = async () => {
    if (!companyId) {
      setXeroStatusError("Pipedrive Company ID is missing to check Xero status.");
      setXeroStatusLoading(false);
      setXeroConnected(false);
      showToast('error', 'Xero Status Error', 'Pipedrive Company ID is missing.');
      return;
    }
    setXeroStatusLoading(true);
    setXeroStatusError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/xero/status?pipedriveCompanyId=${companyId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const xeroData = await response.json();
      setXeroConnected(xeroData.isConnected);
      if (xeroData.isConnected) {
        // showToast('success', 'Xero Status', 'Successfully connected to Xero.'); // Toast can be optional here if status is clearly visible
      } else {
        // showToast('info', 'Xero Status', 'Not connected to Xero.'); // Toast can be optional
      }
    } catch (e: any) {
      setXeroStatusError(e.message);
      setXeroConnected(false);
      showToast('error', 'Xero Status Error', e.message);
    } finally {
      setXeroStatusLoading(false);
    }
  };

  useEffect(() => {
    if (dealId && companyId) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://localhost:3000/api/pipedrive-data?dealId=${dealId}&companyId=${companyId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();
          const transformedData: FetchedPipedriveData = {
            dealDetails: result.deal,
            dealProducts: result.products,
            organizationDetails: result.organization,
            personDetails: result.person,
          };
          setData(transformedData);
          // showToast('success', 'Data Loaded', 'Pipedrive data loaded successfully.'); // Optional, page content will show data
        } catch (e: any) {
          setError(e.message);
          showToast('error', 'Data Load Error', e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      const errorMsg = 'Missing dealId or companyId in query parameters.';
      setError(errorMsg);
      setLoading(false);
      showToast('error', 'Initialization Error', errorMsg);
    }
  }, [dealId, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchXeroStatus();
    }
  }, [companyId]);

  const handleCreateXeroQuote = async () => {
    if (!dealId || !companyId) {
      const errorMsg = "Missing Pipedrive Deal ID or Company ID to create a Xero quote.";
      showToast('error', 'Quote Creation Error', errorMsg);
      return;
    }
    setQuoteCreating(true);
    setQuoteError(null);
    setQuoteSuccessMessage(null);
    try {
      const response = await fetch('http://localhost:3000/api/xero/create-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipedriveDealId: dealId, pipedriveCompanyId: companyId }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      const successMsg = responseData.message || `Xero Quote ${responseData.quoteNumber || ''} created successfully!`;
      setQuoteSuccessMessage(successMsg); // For potential direct display
      showToast('success', 'Quote Created', successMsg);

      // Redirect after a short delay to allow toast to be seen
      setTimeout(() => {
        const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || "app.pipedrive.com"; // Fallback to a default if not set
        if (data?.dealDetails?.id) {
          router.push(`https://${pipedriveDomain}/deal/${data.dealDetails.id}`);
        }
      }, 2000); // 2-second delay

    } catch (e: any) {
      setQuoteError(e.message); // For potential direct display
      showToast('error', 'Quote Creation Error', e.message);
    } finally {
      setQuoteCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="p-6 text-gray-700">Loading Pipedrive data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="p-6 text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="p-6 text-gray-700">No data found.</div>
      </div>
    );
  }

  const primaryEmail = data.personDetails?.email?.find(e => e.primary)?.value || data.personDetails?.email?.[0]?.value || 'N/A';
  const primaryPhone = data.personDetails?.phone?.find(p => p.primary)?.value || data.personDetails?.phone?.[0]?.value || 'N/A';

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-2 sm:px-4 flex flex-col items-center">
      {/* Removed the wrapping div, Toast component will use its own fixed positioning */}
      {toast.show && (
        <Toast
          show={toast.show}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      {/* Main Data Card */}
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-4 sm:px-6 bg-purple-700">
          <h3 className="text-lg leading-6 font-medium text-white">Quotation Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-purple-200">
            Review the Pipedrive data below. If incorrect, please update in Pipedrive and refresh.
          </p>
        </div>
        <div className="border-t border-gray-200 px-2 py-3 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Contact Information */}
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Organization Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.organizationDetails?.name || 'N/A'}</dd>
            </div>
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Contact Person</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.personDetails?.name || 'N/A'}</dd>
            </div>
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{primaryEmail}</dd>
            </div>
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{primaryPhone}</dd>
            </div>

            {/* Deal Information */}
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Deal Title</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.dealDetails?.title || 'N/A'}</dd>
            </div>
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Issue Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.dealDetails?.add_time ? new Date(data.dealDetails.add_time).toLocaleDateString() : 'N/A'}</dd>
            </div>
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Expected Close Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.dealDetails?.expected_close_date ? new Date(data.dealDetails.expected_close_date).toLocaleDateString() : 'N/A'}</dd>
            </div>
            <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-600">Currency</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.dealDetails?.currency || 'N/A'}</dd>
            </div>

            {/* Products Information - Table Display */}
            <div className="py-3 sm:py-4 px-2 sm:px-6">
              <dt className="text-sm font-medium text-gray-600 mb-2">Products</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {data.dealProducts && data.dealProducts.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.dealProducts.map((product, index) => {
                          const quantity = product.quantity ?? 0;
                          const itemPrice = product.item_price ?? 0;
                          let discountAmount = 0;
                          if (product.discount_type === 'percentage') {
                            discountAmount = (itemPrice * quantity) * ( (product.discount ?? 0) / 100);
                          } else {
                            discountAmount = product.discount ?? 0;
                          }
                          const priceAfterDiscount = (itemPrice * quantity) - discountAmount;
                          const taxAmount = priceAfterDiscount * ((product.tax ?? 0) / 100);
                          const lineTotal = priceAfterDiscount + taxAmount;

                          return (
                            <tr key={product.product_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.name || 'N/A'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{quantity}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{itemPrice.toFixed(2)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                                {product.discount ?? 0}{product.discount_type === 'percentage' ? '%' : (data.dealDetails?.currency || '')}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{product.tax ?? 0}%</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{lineTotal.toFixed(2)} {data.dealDetails?.currency || ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                       <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700 uppercase">Subtotal</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                            {data.dealProducts.reduce((acc, product) => {
                              const quantity = product.quantity ?? 0;
                              const itemPrice = product.item_price ?? 0;
                              let discountAmount = 0;
                              if (product.discount_type === 'percentage') {
                                discountAmount = (itemPrice * quantity) * ( (product.discount ?? 0) / 100);
                              } else {
                                discountAmount = product.discount ?? 0;
                              }
                              return acc + (itemPrice * quantity) - discountAmount;
                            }, 0).toFixed(2)} {data.dealDetails?.currency || ''}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700 uppercase">Total Tax</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                            {data.dealProducts.reduce((acc, product) => {
                              const quantity = product.quantity ?? 0;
                              const itemPrice = product.item_price ?? 0;
                              let discountAmount = 0;
                              if (product.discount_type === 'percentage') {
                                discountAmount = (itemPrice * quantity) * ( (product.discount ?? 0) / 100);
                              } else {
                                discountAmount = product.discount ?? 0;
                              }
                              const priceAfterDiscount = (itemPrice * quantity) - discountAmount;
                              const taxAmount = priceAfterDiscount * ((product.tax ?? 0) / 100);
                              return acc + taxAmount;
                            }, 0).toFixed(2)} {data.dealDetails?.currency || ''}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right text-base font-semibold text-gray-900 uppercase">Total</td>
                          <td className="px-4 py-2 text-right text-base font-semibold text-gray-900">
                            {data.dealProducts.reduce((acc, product) => {
                              const quantity = product.quantity ?? 0;
                              const itemPrice = product.item_price ?? 0;
                              let discountAmount = 0;
                              if (product.discount_type === 'percentage') {
                                discountAmount = (itemPrice * quantity) * ( (product.discount ?? 0) / 100);
                              } else {
                                discountAmount = product.discount ?? 0;
                              }
                              const priceAfterDiscount = (itemPrice * quantity) - discountAmount;
                              const taxAmount = priceAfterDiscount * ((product.tax ?? 0) / 100);
                              return acc + priceAfterDiscount + taxAmount;
                            }, 0).toFixed(2)} {data.dealDetails?.currency || ''}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No products associated with this deal.</p>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Xero Actions and Status Section */}
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg overflow-hidden p-4 sm:p-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Xero Integration & Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Column 1: Xero Connection Status & Connect/Refresh Buttons */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h4>
            {xeroStatusLoading ? (
              <p className="mt-1 text-sm text-gray-500">Loading Xero connection status...</p>
            ) : xeroStatusError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">Error: {xeroStatusError}</p>
              </div>
            ) : xeroConnected ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">Xero Connected</p>
              </div>
            ) : (
               <p className="mt-1 text-sm text-yellow-700 p-3 bg-yellow-50 border border-yellow-200 rounded-md">Not connected to Xero.</p>
            )}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              {!xeroConnected && !xeroStatusLoading && (
                <a
                  href={`http://localhost:3000/connect-xero?pipedriveCompanyId=${companyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Connect to Xero
                </a>
              )}
              {!xeroStatusLoading && companyId && (
                <button
                  onClick={fetchXeroStatus}
                  disabled={xeroStatusLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {xeroStatusLoading ? 'Refreshing...' : 'Refresh Xero Status'}
                </button>
              )}
            </div>
          </div>

          {/* Column 2: Create Xero Quote Button (only if connected) */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Actions</h4>
            {data && xeroConnected ? (
              <button
                onClick={handleCreateXeroQuote}
                disabled={quoteCreating || !xeroConnected}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-400"
              >
                {quoteCreating ? 'Creating Xero Quote...' : 'Create Xero Quote'}
              </button>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                {xeroStatusLoading ? 'Checking Xero connection...' : 'Connect to Xero to enable quote creation.'}
              </p>
            )}
            {/* Display quote creation success/error messages directly if needed, though toast is primary */}
            {/* {quoteSuccessMessage && <p className="mt-2 text-sm text-green-600">{quoteSuccessMessage}</p>} */}
            {/* {quoteError && <p className="mt-2 text-sm text-red-600">{quoteError}</p>} */}
          </div>
        </div>
      </div>
    </div>
  );
}
