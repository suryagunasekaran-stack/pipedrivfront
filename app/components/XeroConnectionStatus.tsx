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
      return <p className="mt-1 text-sm text-gray-500">Loading Xero connection status...</p>;
    }

    if (error) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      );
    }

    if (xeroConnected) {
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">Xero Connected</p>
        </div>
      );
    }

    return (
      <p className="mt-1 text-sm text-yellow-700 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
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
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Connect to Xero
        </a>
      )}
      {!loading && companyId && (
        <button
          onClick={onRefreshStatus}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Xero Status'}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h4>
      {renderConnectionStatus()}
      {renderActionButtons()}
    </div>
  );
}
