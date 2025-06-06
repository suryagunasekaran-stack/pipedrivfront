'use client'; // Ensure it's a client component to use hooks

import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/api';
import SimpleLoader from './SimpleLoader'; // For a compact loading indicator

interface XeroConnectionStatusProps {
  // companyId is crucial. It can be passed as a prop,
  // or if this component is always used where companyId is stable in store,
  // it could solely rely on the store. Passing as prop is safer for now.
  companyId: string | null;
}

/**
 * Component for displaying and managing Xero connection status.
 * Relies on useAuthStore for status and apiService for actions.
 */
export default function XeroConnectionStatus({ companyId }: XeroConnectionStatusProps) {
  const {
    isAuthenticated,
    isCheckingAuth,
    checkAuthStatus,
    // companyId: storeCompanyId // Alternative to prop: const effectiveCompanyId = companyId || storeCompanyId;
  } = useAuthStore();

  const effectiveCompanyId = companyId; // Use the passed companyId

  const handleConnectToXero = () => {
    if (effectiveCompanyId) {
      apiService.connectXero(effectiveCompanyId);
    } else {
      // This should ideally not happen if UI controls flow correctly (e.g., Pipedrive must be connected first)
      alert("Error: Company ID is missing. Cannot connect to Xero.");
    }
  };

  const handleRefreshStatus = () => {
    if (effectiveCompanyId) {
      checkAuthStatus(effectiveCompanyId); // This will update isAuthenticated.xero from the store
    } else {
      alert("Error: Company ID is missing. Cannot refresh Xero status.");
    }
  };

  const renderConnectionStatus = () => {
    // isCheckingAuth is global; consider if a more specific loading for Xero status is needed
    // For now, global isCheckingAuth indicates background activity.
    // The primary status comes from isAuthenticated.xero
    if (isCheckingAuth && !isAuthenticated.xero) { // Show loading if checking and not yet confirmed connected
        return <p className="mt-1 text-sm text-gray-600">Loading Xero connection status...</p>;
    }

    if (isAuthenticated.xero) {
      return (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
          <p className="text-sm text-green-700 font-medium">✓ Xero Connected</p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-center">
        <p className="mt-1 text-sm text-gray-700">
          Not connected to Xero.
        </p>
      </div>
    );
  };

  const renderActionButtons = () => (
    <div className="mt-3 flex flex-col sm:flex-row gap-2">
      {!isAuthenticated.xero && !isCheckingAuth && effectiveCompanyId && (
        <button
          onClick={handleConnectToXero}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          Connect to Xero
        </button>
      )}
      {effectiveCompanyId && ( // Always show refresh if companyId is known
        <button
          onClick={handleRefreshStatus}
          disabled={isCheckingAuth}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
        >
          {isCheckingAuth ? 'Refreshing...' : 'Refresh Xero Status'}
        </button>
      )}
    </div>
  );

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">Xero Connection</h4>
      {renderConnectionStatus()}
      {renderActionButtons()}
    </div>
  );
}
