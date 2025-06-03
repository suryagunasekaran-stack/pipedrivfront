import XeroConnectionStatus from './XeroConnectionStatus';
import XeroQuoteCreator from './XeroQuoteCreator';
import { FetchedPipedriveData } from '../types/pipedrive';

interface XeroIntegrationProps {
  dealId: string | null;
  companyId: string | null;
  data: FetchedPipedriveData | null;
  xeroConnected: boolean;
  xeroStatusLoading: boolean;
  xeroStatusError: string | null;
  onRefreshStatus: () => void;
  toast: {
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
  };
}

/**
 * Component for managing Xero integration features
 */
export default function XeroIntegration({
  dealId,
  companyId,
  data,
  xeroConnected,
  xeroStatusLoading,
  xeroStatusError,
  onRefreshStatus,
  toast
}: XeroIntegrationProps) {
  return (
    <div className="w-full max-w-5xl bg-white shadow-xl rounded-lg overflow-hidden p-4 sm:p-6">
      <h3 className="text-md font-semibold text-gray-800 mb-4">Xero Integration & Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Column 1: Xero Connection Status & Connect/Refresh Buttons */}
        <XeroConnectionStatus
          companyId={companyId}
          xeroConnected={xeroConnected}
          loading={xeroStatusLoading}
          error={xeroStatusError}
          onRefreshStatus={onRefreshStatus}
        />

        {/* Column 2: Create Xero Quote Button (only if connected) */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Available Actions</h4>
          {data ? (
            <XeroQuoteCreator
              dealId={dealId}
              companyId={companyId}
              xeroConnected={xeroConnected}
              toast={toast}
            />
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              {xeroStatusLoading ? 'Checking Xero connection...' : 'Loading deal data...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
