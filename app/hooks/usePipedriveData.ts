import { useState, useEffect } from 'react';
import { FetchedPipedriveData } from '../types/pipedrive';
import { API_ENDPOINTS } from '../constants';
import { apiCall } from '../utils/apiClient';

/**
 * Custom hook for fetching Pipedrive data with authentication handling
 */
export function usePipedriveData(dealId: string | null, companyId: string | null) {
  const [data, setData] = useState<FetchedPipedriveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealId || !companyId) {
      setError('Missing dealId or companyId');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCall(`${API_ENDPOINTS.PIPEDRIVE_DATA}?dealId=${dealId}&companyId=${companyId}`);
        const transformedData: FetchedPipedriveData = {
          dealDetails: result.deal,
          dealProducts: result.products,
          organizationDetails: result.organization,
          personDetails: result.person,
        };
        
        setData(transformedData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealId, companyId]);

  return { data, loading, error, refetch: () => {
    if (dealId && companyId) {
      setLoading(true);
      setError(null);
    }
  }};
}
