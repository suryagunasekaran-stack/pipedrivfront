'use client';

import { useState, useCallback } from 'react';
import { useToast } from './useToast';

interface ApiError {
  message: string;
  statusCode?: number;
  details?: string;
}

export function useApiError() {
  const [error, setError] = useState<ApiError | null>(null);
  const { error: showToast } = useToast();

  const handleApiError = useCallback((error: any, showErrorToast = true) => {
    console.error('API Error:', error);

    let errorInfo: ApiError = {
      message: 'An unexpected error occurred',
      statusCode: 500,
    };

    if (error.response) {
      // Axios-style error response
      errorInfo = {
        message: error.response.data?.error || error.response.data?.message || error.message,
        statusCode: error.response.status,
        details: error.response.data?.details,
      };
    } else if (error.status) {
      // Fetch-style error response
      errorInfo = {
        message: error.error || error.message || 'Request failed',
        statusCode: error.status,
        details: error.details,
      };
    } else if (error.message) {
      // Generic error with message
      errorInfo = {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      };
    }

    setError(errorInfo);

    if (showErrorToast) {
      showToast(errorInfo.message);
    }

    return errorInfo;
  }, [showToast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleApiError,
    clearError,
  };
}