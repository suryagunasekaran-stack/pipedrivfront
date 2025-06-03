import { FetchedPipedriveData } from '../types/pipedrive';
import { extractPrimaryContact } from '../utils/calculations';
import ProductTable from './ProductTable';

interface ContactInformationProps {
  data: FetchedPipedriveData;
}

/**
 * Component for displaying contact and organization information
 */
export default function ContactInformation({ data }: ContactInformationProps) {
  const { primaryEmail, primaryPhone } = extractPrimaryContact(data.personDetails);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <dl className="sm:divide-y sm:divide-gray-200">
      {/* Contact Information */}
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Organization Name</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {data.organizationDetails?.name || 'N/A'}
        </dd>
      </div>
      
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Contact Person</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {data.personDetails?.name || 'N/A'}
        </dd>
      </div>
      
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Email</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {primaryEmail}
        </dd>
      </div>
      
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Phone</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {primaryPhone}
        </dd>
      </div>

      {/* Deal Information */}
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Deal Title</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {data.dealDetails?.title || 'N/A'}
        </dd>
      </div>
      
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Issue Date</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {formatDate(data.dealDetails?.add_time)}
        </dd>
      </div>
      
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Expected Close Date</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {formatDate(data.dealDetails?.expected_close_date)}
        </dd>
      </div>
      
      <div className="py-3 sm:py-4 px-2 sm:px-6 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-600">Currency</dt>
        <dd className="mt-1 text-sm text-black sm:col-span-2 sm:mt-0">
          {data.dealDetails?.currency || 'N/A'}
        </dd>
      </div>

      {/* Products Information */}
      <div className="py-3 sm:py-4 px-2 sm:px-6">
        <dt className="text-sm font-medium text-gray-600 mb-2">Products</dt>
        <dd className="mt-1 text-sm text-black">
          <ProductTable 
            products={data.dealProducts || []} 
            currency={data.dealDetails?.currency}
          />
        </dd>
      </div>
    </dl>
  );
}
