import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS } from '../constants';

interface XeroConnectionStatusProps {
  companyId: string | null;
  xeroConnected: boolean;
  loading: boolean;
  error: string | null;
  onRefreshStatus: () => void;
}

/**
 * Component for displaying and managing Xero connection status
 */
export default function XeroConnectionStatus({
  companyId,
  xeroConnected,
  loading,
  error,
  onRefreshStatus
}: XeroConnectionStatusProps) {
  const renderConnectionStatus = () => {
    if (loading) {
      return <p className="mt-1 text-sm text-gray-600">Loading Xero connection status...</p>;
    }

    if (error) {
      return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-black">Error: {error}</p>
        </div>
      );
    }

    if (xeroConnected) {
      return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-black">✓ Xero Connected</p>
        </div>
      );
    }

    return (
      <p className="mt-1 text-sm text-black p-3 bg-gray-50 border border-gray-200 rounded-md">
        Not connected to Xero.
      </p>
    );
  };

  const renderActionButtons = () => (
    <div className="mt-3 flex flex-col sm:flex-row gap-2">
      {!xeroConnected && !loading && companyId && (
        <a
          href={`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.XERO_CONNECT}?pipedriveCompanyId=${companyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          Connect to Xero
        </a>
      )}
      {!loading && companyId && (
        <button
          onClick={onRefreshStatus}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh Xero Status'}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <h4 className="text-sm font-medium text-black mb-2">Connection Status</h4>
      {renderConnectionStatus()}
      {renderActionButtons()}
    </div>
  );
}
