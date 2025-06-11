/**
 * Custom hook for managing quotation data fetching and updates
 */

import { useState, useEffect } from 'react';
import { QuotationDataResponse, ComparisonAnalysis } from '../types/quotation';
import { api } from '../utils/apiClient';
import { analyzeQuotationChanges } from '../utils/quotationUtils';

interface UseQuotationDataReturn {
  quotationData: QuotationDataResponse | null;
  comparisonAnalysis: ComparisonAnalysis | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuotationData(dealId: string | null, companyId: string | null): UseQuotationDataReturn {
  const [quotationData, setQuotationData] = useState<QuotationDataResponse | null>(null);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotationData = async () => {
    if (!dealId || !companyId) {
      setError('Missing dealId or companyId in URL parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data: QuotationDataResponse = await api.getQuotationData(dealId, companyId);
      setQuotationData(data);
      
      // Analyze changes
      const analysis = analyzeQuotationChanges(data);
      setComparisonAnalysis(analysis);
      
    } catch (err) {
      console.error('Error fetching quotation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quotation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationData();
  }, [dealId, companyId]);

  const refetch = async () => {
    await fetchQuotationData();
  };

  return {
    quotationData,
    comparisonAnalysis,
    loading,
    error,
    refetch,
  };
} 