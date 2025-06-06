// Keep FetchedPipedriveData if XeroQuoteCreator or other parts still need it.
// However, XeroQuoteCreator will primarily need dealId and companyId.
import type { PipedriveDataResponse } from '../services/api'; // Assuming this is the type for pipedriveDealData
import XeroConnectionStatus from './XeroConnectionStatus';
import XeroQuoteCreator from './XeroQuoteCreator';

interface XeroIntegrationProps {
  companyId: string | null; // Still needed for XeroConnectionStatus and XeroQuoteCreator
  dealId: string | null;    // Needed for XeroQuoteCreator
  pipedriveDealData: PipedriveDataResponse | null; // Pass the whole deal data if needed by XeroQuoteCreator for context

  // Props for XeroConnectionStatus are now largely handled by useAuthStore within the component itself.
  // onRefreshXeroStatus is now handled by XeroConnectionStatus internally using useAuthStore.

  // Props for XeroQuoteCreator:
  isXeroConnected: boolean; // This should come from useAuthStore, passed from parent page
  isCreatingQuote: boolean;
  onCreateXeroQuote: () => Promise<void>; // The actual function to call apiService.createQuote

  toast: { // Toast is still useful for feedback
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    // Add other toast types if used by XeroQuoteCreator
  };
}

/**
 * Component for managing Xero integration features.
 * It now relies more on parent page (PipedriveDataViewContent) for state like isXeroConnected
 * and for the actual quote creation function.
 */
export default function XeroIntegration({
  companyId,
  dealId,
  pipedriveDealData,
  isXeroConnected, // True status from useAuthStore, passed by PipedriveDataViewContent
  isCreatingQuote,
  onCreateXeroQuote,
  toast
}: XeroIntegrationProps) {
  return (
    <div className="w-full mt-8 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Xero Integration & Actions</h3>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

          <XeroConnectionStatus companyId={companyId} />

          <div>
            <h4 className="text-md font-medium text-gray-700 mb-2">Quote Actions</h4>
            {pipedriveDealData ? ( // Ensure data is present before allowing quote creation attempt
              <XeroQuoteCreator
                dealId={dealId}
                companyId={companyId}
                isXeroConnected={isXeroConnected} // Pass the reliable connected status
                onCreateQuote={onCreateXeroQuote} // Pass the actual creation function
                isCreatingQuote={isCreatingQuote} // Pass loading state for the button
                toast={toast}
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                Deal data must be loaded to perform Xero actions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
