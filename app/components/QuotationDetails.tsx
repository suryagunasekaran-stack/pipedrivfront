import { FetchedPipedriveData } from '../types/pipedrive';
import ContactInformation from './ContactInformation';

interface QuotationDetailsProps {
  data: FetchedPipedriveData;
}

/**
 * Main component for displaying quotation details
 */
export default function QuotationDetails({ data }: QuotationDetailsProps) {
  return (
    <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg overflow-hidden mb-6">
      <div className="px-4 py-4 sm:px-6 bg-purple-700">
        <h3 className="text-lg leading-6 font-medium text-white">Quotation Details</h3>
        <p className="mt-1 max-w-2xl text-sm text-purple-200">
          Review the Pipedrive data below. If incorrect, please update in Pipedrive and refresh.
        </p>
      </div>
      <div className="border-t border-gray-200 px-2 py-3 sm:p-0">
        <ContactInformation data={data} />
      </div>
    </div>
  );
}
