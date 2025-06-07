/**
 * Enhanced API client with automatic authentication handling
 * @deprecated - Use the new apiService from '../services/api' for better error handling and type safety
 * This file is maintained for backward compatibility
 */

import { apiService } from '../services/api';
import { ApiResponse } from '../types/api';

// Legacy interface for backward compatibility
interface ApiCallOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

/**
 * Legacy API call function - use apiService for new code
 * @deprecated Use apiService instead
 */
export async function apiCall<T = any>(
  url: string, 
  options: ApiCallOptions = {}
): Promise<T> {
  console.warn('⚠️ Using deprecated apiCall function. Please migrate to apiService from ../services/api');
  
  const { skipAuthRedirect = false, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    const data: ApiResponse<T> = await response.json().catch(() => ({
      error: `HTTP error! status: ${response.status}`
    }));

    // Handle authentication errors
    if (response.status === 401 && !skipAuthRedirect) {
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return Promise.reject(new Error('Authentication required - redirecting...'));
      } else {
        // Fallback to default auth page
        window.location.href = '/auth/pipedrive';
        return Promise.reject(new Error('Authentication required - redirecting...'));
      }
    }

        if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    // Return the actual data if it's wrapped in a data property, otherwise return the whole response
    return (data.data !== undefined ? data.data : data) as T;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Legacy API object - use apiService for new code
 * @deprecated Use apiService from '../services/api' instead
 */
export const api = {
  // Check authentication status
  checkAuth: () => {
    console.warn('⚠️ Using deprecated api.checkAuth. Use apiService.checkAuthStatus instead');
    return apiService.checkAuthStatus('');
  },

  // Get Pipedrive data
  getPipedriveData: (dealId: string, companyId: string) => {
    console.warn('⚠️ Using deprecated api.getPipedriveData. Use apiService.getPipedriveData instead');
    return apiService.getPipedriveData(companyId, dealId);
  },

  // Create project
  createProject: (data: { dealId: string; companyId: string }) => {
    console.warn('⚠️ Using deprecated api.createProject. Use apiService.createFullProject instead');
    return apiService.createFullProject(data.companyId, data.dealId);
  },

  // Create full project
  createFullProject: (data: { 
    pipedriveDealId: number | string; 
    xeroQuoteNumber?: string | null; 
    pipedriveCompanyId: string 
  }) => {
    console.warn('⚠️ Using deprecated api.createFullProject. Use apiService.createProject instead');
    return apiService.createProject({
      pipedriveDealId: data.pipedriveDealId.toString(),
      pipedriveCompanyId: data.pipedriveCompanyId,
      existingProjectNumberToLink: data.xeroQuoteNumber || undefined,
    });
  },

  // Get Xero status
  getXeroStatus: (pipedriveCompanyId: string) => {
    console.warn('⚠️ Using deprecated api.getXeroStatus. Use apiService.checkXeroStatus instead');
    return apiService.checkXeroStatus(pipedriveCompanyId);
  },

  // Create Xero quote
  createXeroQuote: (data: { pipedriveDealId: string; pipedriveCompanyId: string }) => {
    console.warn('⚠️ Using deprecated api.createXeroQuote. Use apiService.createQuote instead');
    return apiService.createQuote(data);
  },
};
