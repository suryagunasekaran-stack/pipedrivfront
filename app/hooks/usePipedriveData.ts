import { useState, useEffect } from 'react';
import { FetchedPipedriveData } from '../types/pipedrive';
import { apiService } from '../services/api';

/**
 * Custom hook for fetching Pipedrive data with authentication handling
 */
export function usePipedriveData(dealId: string | null, companyId: string | null) {
  const [data, setData] = useState<FetchedPipedriveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!dealId || !companyId) {
      setError('Missing dealId or companyId');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use the new API service with proper error handling
      const result = await apiService.getPipedriveData(companyId, dealId);
      
      const transformedData: FetchedPipedriveData = {
        dealDetails: result.deal,
        dealProducts: result.products || [],
        organizationDetails: result.organization,
        personDetails: result.person,
      };
      
      setData(transformedData);
    } catch (e) {
      console.error('Failed to fetch Pipedrive data:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dealId, companyId]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData
  };
}
