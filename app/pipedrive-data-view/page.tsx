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
          console.log('Fetched data:', result); // Keep console.log for debugging
          setData(result);
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
    </div>
  );
}
