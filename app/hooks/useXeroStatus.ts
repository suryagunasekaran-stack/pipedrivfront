import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

/**
 * Custom hook for managing Xero connection status with authentication handling
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
      // Use the new API service with proper error handling
      const xeroStatus = await apiService.checkXeroStatus(companyId);
      setXeroConnected(xeroStatus.connected);
    } catch (e) {
      console.error('Failed to check Xero status:', e);
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
