'use client';

import { useSearchParams } from 'next/navigation';
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
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');

  const [data, setData] = useState<FetchedPipedriveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Xero connection
  const [xeroConnected, setXeroConnected] = useState(false);
  const [xeroStatusLoading, setXeroStatusLoading] = useState(true);
  const [xeroStatusError, setXeroStatusError] = useState<string | null>(null);

  // State for Xero Quote Creation
  const [quoteCreating, setQuoteCreating] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSuccessMessage, setQuoteSuccessMessage] = useState<string | null>(null);

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
        showToast('success', 'Xero Status', 'Successfully connected to Xero.');
      } else {
        showToast('info', 'Xero Status', 'Not connected to Xero.');
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
          console.log('Fetched Pipedrive data from API:', result);
          // Map API response to the expected frontend structure
          const transformedData: FetchedPipedriveData = {
            dealDetails: result.deal,
            dealProducts: result.products,
            organizationDetails: result.organization,
            personDetails: result.person,
          };
          setData(transformedData);
          showToast('success', 'Data Loaded', 'Pipedrive data loaded successfully.');
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

  // Fetch Xero status when companyId is available
  useEffect(() => {
    if (companyId) {
      fetchXeroStatus();
    }
  }, [companyId]);

  // Function to handle Xero Quote Creation
  const handleCreateXeroQuote = async () => {
    if (!dealId || !companyId) { 
      const errorMsg = "Missing Pipedrive Deal ID or Company ID to create a Xero quote.";
      setQuoteError(errorMsg);
      showToast('error', 'Quote Creation Error', errorMsg);
      return;
    }
    setQuoteCreating(true);
    setQuoteError(null);
    setQuoteSuccessMessage(null);
    try {
      const response = await fetch('http://localhost:3000/api/xero/create-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pipedriveDealId: dealId, // Send pipedriveDealId
          pipedriveCompanyId: companyId,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      const successMsg = responseData.message || `Xero Quote ${responseData.quoteNumber || ''} created successfully!`;
      setQuoteSuccessMessage(successMsg);
      showToast('success', 'Quote Created', successMsg);
      // Optionally, you might want to re-fetch Pipedrive data if the custom field update is critical to display immediately
      // fetchData(); // Assuming fetchData is the function that gets Pipedrive deal details
    } catch (e: any) {
      setQuoteError(e.message);
      showToast('error', 'Quote Creation Error', e.message);
    } finally {
      setQuoteCreating(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading Pipedrive data...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-6">No data found.</div>;
  }

  const primaryEmail = data.personDetails?.email?.find(e => e.primary)?.value || data.personDetails?.email?.[0]?.value || 'N/A';
  const primaryPhone = data.personDetails?.phone?.find(p => p.primary)?.value || data.personDetails?.phone?.[0]?.value || 'N/A';

  // New Tailwind CSS template structure
  return (
    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg m-4">
      {toast.show && (
        <Toast
          show={toast.show} // Ensure the show prop is correctly passed
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
      <div className="px-4 py-6 sm:px-6">
        <h3 className="text-base/7 font-semibold text-gray-900">Create Quotation in Xero</h3>
        <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
          If the details are incorrect, please close this window and make changes in Pipedrive.
        </p>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          {/* Contact Information */}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Organization Name</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.organizationDetails?.name || 'N/A'}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Contact Person</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.personDetails?.name || 'N/A'}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Email</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{primaryEmail}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Phone</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{primaryPhone}</dd>
          </div>

          {/* Deal Information */}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Deal Title</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.dealDetails?.title || 'N/A'}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Issue Date</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.dealDetails?.add_time || 'N/A'}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Expected Close Date</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.dealDetails?.expected_close_date || 'N/A'}</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Currency</dt>
            <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{data.dealDetails?.currency || 'N/A'}</dd>
          </div>

          {/* Products Information - Table Display */}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm/6 font-medium text-gray-900">Products</dt>
            <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {data.dealProducts && data.dealProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
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
                          discountAmount = product.discount ?? 0; // Assuming fixed amount if not percentage
                        }
                        const priceAfterDiscount = (itemPrice * quantity) - discountAmount;
                        // Assuming tax is a percentage applied to the price after discount
                        const taxAmount = priceAfterDiscount * ((product.tax ?? 0) / 100);
                        const lineTotal = priceAfterDiscount + taxAmount;

                        return (
                          <tr key={product.product_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{itemPrice.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {product.discount ?? 0}{product.discount_type === 'percentage' ? '%' : (data.dealDetails?.currency || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{product.tax ?? 0}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{lineTotal.toFixed(2)} {data.dealDetails?.currency || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                     <tfoot>
                      <tr>
                        <td colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">Subtotal</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-700">
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
                        <td colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">Total Tax</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-700">
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
                        <td colSpan={5} className="px-6 py-3 text-right text-base font-semibold text-gray-900 uppercase">Total</td>
                        <td className="px-6 py-3 text-right text-base font-semibold text-gray-900">
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
                <p className="text-sm/6 text-gray-500">No products associated with this deal.</p>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Xero Integration Section - Combined Status and Actions */}
      <div className="px-4 py-6 sm:px-6 border-t border-gray-200">
        <div className="flex justify-between items-start">
          {/* Xero Connection Status Section (Left Aligned) */}
          <div className="flex-1">
            <h3 className="text-base/7 font-semibold text-gray-900 mb-2">Xero Integration Status</h3>
            {xeroStatusLoading ? (
              <p className="mt-1 text-sm/6 text-gray-500">Loading Xero connection status...</p>
            ) : xeroStatusError ? (
              <p className="mt-1 text-sm/6 text-red-600">Error: {xeroStatusError}</p>
            ) : xeroConnected ? (
              <p className="mt-1 text-sm/6 text-green-600">Xero Connected</p>
            ) : (
              <a
                href={`http://localhost:3000/connect-xero?pipedriveCompanyId=${companyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Connect to Xero
              </a>
            )}
            {!xeroStatusLoading && companyId && (
              <button
                onClick={fetchXeroStatus}
                className="mt-2 ml-0 sm:ml-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Refresh Xero Status
              </button>
            )}
          </div>

          {/* Xero Actions Section (Right Aligned) */}
          {data && xeroConnected && (
            <div className="ml-4"> {/* Added margin for spacing */}
              <h3 className="text-base/7 font-semibold text-gray-900 mb-2 text-right">Xero Actions</h3>
              <div className="flex justify-end">
                <button
                  onClick={handleCreateXeroQuote}
                  disabled={quoteCreating || !data || !xeroConnected}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-400"
                >
                  {quoteCreating ? 'Creating Xero Quote...' : 'Create Xero Quote'}
                </button>
              </div>
              {/* Messages for quote creation can remain here or be handled by global toast */}
              {/* {quoteSuccessMessage && (
                <p className="mt-2 text-sm/6 text-green-600 text-right">{quoteSuccessMessage}</p>
              )}
              {quoteError && (
                <p className="mt-2 text-sm/6 text-red-600 text-right">{quoteError}</p>
              )} */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
