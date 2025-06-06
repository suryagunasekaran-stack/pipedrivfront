import { useState, useEffect, useCallback } from 'react';
// Assuming PipedriveDataResponse is the correct type for the transformed data.
// The old FetchedPipedriveData might need to be adjusted or PipedriveDataResponse used directly.
import { PipedriveDataResponse, ApiError } from '../services/api';
import { apiService } from '../services/api';
// API_ENDPOINTS is no longer needed if using apiService directly
// import { API_ENDPOINTS } from '../constants';
// apiCall is no longer needed
// import { apiCall } from '../utils/apiClient';

// Define a more specific type for the data structure this hook returns, if necessary,
// or use PipedriveDataResponse directly if it matches the desired structure.
// For now, let's assume PipedriveDataResponse from apiService is what we want.
export type FetchedPipedriveData = PipedriveDataResponse; // Or a transformed version

/**
 * Custom hook for fetching Pipedrive data using apiService
 */
export function usePipedriveData(dealId: string | null, companyId: string | null) {
  const [data, setData] = useState<FetchedPipedriveData | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dealId || !companyId) {
      // setError('Missing dealId or companyId'); // This case should ideally be handled by caller
      setLoading(false); // Stop loading if params are missing
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // apiService.getPipedriveData expects companyId then dealId
      const result = await apiService.getPipedriveData(companyId, dealId);
      // The PipedriveDataResponse structure from apiService is:
      // { success: boolean, deal, person, organization, products }
      // This seems to align well with what might be expected.
      setData(result);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred while fetching Pipedrive data.');
      }
      setData(null); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [dealId, companyId]);

  useEffect(() => {
    // Only fetch if both dealId and companyId are present
    if (dealId && companyId) {
      fetchData();
    } else {
      // If params are not available, don't start loading, or set error.
      // For now, just ensure loading is false if they are missing.
      setLoading(false);
      // Optionally, set an error or clear data if params become null after being set.
      // setData(null);
      // setError("Deal ID or Company ID is not available.");
    }
  }, [fetchData, dealId, companyId]); // Include fetchData in dependency array

  return { data, loading, error, refetch: fetchData }; // Expose fetchData as refetch
}
