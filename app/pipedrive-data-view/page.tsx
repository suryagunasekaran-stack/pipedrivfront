'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  // Function to fetch Xero connection status
  const fetchXeroStatus = async () => {
    if (!companyId) {
      setXeroStatusError("Pipedrive Company ID is missing to check Xero status.");
      setXeroStatusLoading(false);
      setXeroConnected(false);
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
    } catch (e: any) {
      setXeroStatusError(e.message);
      setXeroConnected(false);
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
          console.log('Fetched Pipedrive data from API:', result); // Updated log message for clarity
          // Map API response to the expected frontend structure
          const transformedData: FetchedPipedriveData = {
            dealDetails: result.deal,
            dealProducts: result.products,
            organizationDetails: result.organization,
            personDetails: result.person,
          };
          setData(transformedData);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setError('Missing dealId or companyId in query parameters.');
      setLoading(false);
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
    if (!dealId || !companyId) { // Check dealId directly
      setQuoteError("Missing Pipedrive Deal ID or Company ID to create a Xero quote.");
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
      // Assuming the backend now returns a more specific success message or quote details
      setQuoteSuccessMessage(responseData.message || `Xero Quote ${responseData.quoteNumber || ''} created successfully!`);
      // Optionally, you might want to re-fetch Pipedrive data if the custom field update is critical to display immediately
      // fetchData(); // Assuming fetchData is the function that gets Pipedrive deal details
    } catch (e: any) {
      setQuoteError(e.message);
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

          {/* Products Information */}
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm/6 font-medium text-gray-900">Products</dt>
            <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              {data.dealProducts && data.dealProducts.length > 0 ? (
                <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
                  {data.dealProducts.map((product, index) => (
                    <li key={product.product_id || index} className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                      <div className="flex w-0 flex-1 items-center">
                        <div className="ml-4 flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">{product.name || 'N/A'}</span>
                          <span className="text-xs text-gray-500">
                            Qty: {product.quantity ?? 'N/A'} &bull; Price: {product.item_price ?? 'N/A'} {data.dealDetails?.currency || ''}
                          </span>
                          <span className="text-xs text-gray-500">
                            Discount: {product.discount ?? 'N/A'}{product.discount_type === 'percentage' ? '%' : ''} &bull; Tax: {product.tax ?? 'N/A'} ({product.tax_method || 'N/A'})
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm/6 text-gray-500">No products associated with this deal.</p>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Xero Connection Status Section */}
      <div className="px-4 py-6 sm:px-6 border-t border-gray-200">
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
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Connect to Xero
          </a>
        )}
        {!xeroStatusLoading && companyId && (
          <button
            onClick={fetchXeroStatus}
            className="mt-2 ml-0 sm:ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Xero Status
          </button>
        )}
      </div>

      {/* Create Xero Quote Section */}
      {data && xeroConnected && (
        <div className="px-4 py-6 sm:px-6 border-t border-gray-200">
          <h3 className="text-base/7 font-semibold text-gray-900 mb-2">Xero Actions</h3>
          <button
            onClick={handleCreateXeroQuote}
            disabled={quoteCreating}
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {quoteCreating ? 'Creating Xero Quote...' : 'Create Xero Quote'}
          </button>
          {quoteSuccessMessage && (
            <p className="mt-2 text-sm/6 text-green-600">{quoteSuccessMessage}</p>
          )}
          {quoteError && (
            <p className="mt-2 text-sm/6 text-red-600">Error: {quoteError}</p>
          )}
        </div>
      )}
    </div>
  );
}
