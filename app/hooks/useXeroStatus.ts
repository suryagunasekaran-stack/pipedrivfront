import { useState, useEffect, useCallback } from 'react';
// Assuming XeroStatusResponse is the type returned by apiService.checkXeroStatus
// The old XeroStatus might need to be adjusted or XeroStatusResponse used directly.
import { XeroStatusResponse, ApiError } from '../services/api';
import { apiService } from '../services/api';
// API_ENDPOINTS and apiCall are no longer needed
// import { API_ENDPOINTS } from '../constants';
// import { apiCall } from '../utils/apiClient';


/**
 * Custom hook for managing Xero connection status using apiService
 */
export function useXeroStatus(companyId: string | null) {
  // NOTE: useAuthStore.isAuthenticated.xero (updated by useAuthStore.checkAuthStatus)
  // is the primary source for Xero connection status in most parts of the application.
  // This hook might make a redundant API call if checkAuthStatus has already run recently.
  // It can be useful if a component needs to independently re-verify Xero status
  // or fetch more detailed information not stored in useAuthStore (e.g., tenantName).
  // Consider refactoring pages to rely solely on useAuthStore if this detailed info isn't always needed,
  // or enhance useAuthStore to hold more details from XeroStatusResponse.

  // xeroConnected from useAuthStore.isAuthenticated.xero should be the primary source of truth
  // This hook can be simplified or deprecated if useAuthStore.checkAuthStatus is called appropriately
  // andisAuthenticated.xero is reliable.
  // However, if this hook is meant to fetch more detailed status or re-verify independently:
  const [xeroStatus, setXeroStatus] = useState<XeroStatusResponse | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!companyId) {
      // setError('Pipedrive Company ID is missing for Xero status check.');
      setLoading(false); // Stop loading if param is missing
      setXeroStatus(null); // Clear status
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const statusData = await apiService.checkXeroStatus(companyId);
      setXeroStatus(statusData);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred while checking Xero status.');
      }
      setXeroStatus(null); // Clear status on error
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchStatus();
    } else {
      setLoading(false); // Ensure loading is false if companyId is not available
      // Optionally set an error or clear data
      // setXeroStatus(null);
      // setError("Company ID is not available for Xero status check.");
    }
  }, [fetchStatus, companyId]); // Include fetchStatus

  return {
    // Derived state: connected based on the fetched status.
    // This might differ from useAuthStore.isAuthenticated.xero if this hook fetches more details.
    xeroConnected: xeroStatus?.connected || false,
    xeroTenantName: xeroStatus?.tenantName, // Example of more detailed info
    loading,
    error,
    refetchStatus: fetchStatus
  };
}
