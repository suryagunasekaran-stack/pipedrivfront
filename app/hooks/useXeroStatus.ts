import { useState, useEffect } from 'react';
import { XeroStatus } from '../types/pipedrive';
import { API_ENDPOINTS } from '../constants';

/**
 * Custom hook for managing Xero connection status
 */
export function useXeroStatus(companyId: string | null) {
  const [xeroConnected, setXeroConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchXeroStatus = async () => {
    if (!companyId) {
      setError('Pipedrive Company ID is missing');
      setLoading(false);
      setXeroConnected(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.XERO_STATUS}?pipedriveCompanyId=${companyId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const xeroData: XeroStatus = await response.json();
      setXeroConnected(xeroData.isConnected);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check Xero status');
      setXeroConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchXeroStatus();
    }
  }, [companyId]);

  return {
    xeroConnected,
    loading,
    error,
    refetchStatus: fetchXeroStatus
  };
}
