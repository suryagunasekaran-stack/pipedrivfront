/**
 * Enhanced API client with automatic authentication handling
 */

import { BACKEND_API_BASE_URL } from '../constants';

interface ApiResponse<T = any> {
  data?: T;
  authenticated?: boolean;
  authRequired?: 'pipedrive' | 'xero';
  authUrl?: string;
  message?: string;
  error?: string | boolean;
}

interface ApiCallOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

/**
 * Make an API call with automatic authentication handling
 */
export async function apiCall<T = any>(
  url: string, 
  options: ApiCallOptions = {}
): Promise<T> {
  const { skipAuthRedirect = false, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    const data: ApiResponse<T> = await response.json().catch((jsonError) => {
      console.error('JSON parse error:', jsonError);
      return {
        error: `HTTP error! status: ${response.status}`
      };
    });

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
      // Handle cases where data might not be an object with error/message properties
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      if (data && typeof data === 'object') {
        // Handle string error messages
        if (typeof data.error === 'string' && data.error.trim()) {
          errorMessage = data.error;
        } else if (typeof data.message === 'string' && data.message.trim()) {
          errorMessage = data.message;
        } else if (data.error === true) {
          // Handle boolean error flag - use default message
          errorMessage = `API request failed with status: ${response.status}`;
        }
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
      
      throw new Error(errorMessage);
    }

    // Return the actual data if it's wrapped in a data property, otherwise return the whole response
    return (data.data !== undefined ? data.data : data) as T;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Specific API calls for common operations
 */
export const api = {
  // Check authentication status
  checkAuth: () => apiCall<{
    authenticated: boolean;
    authRequired?: 'pipedrive' | 'xero';
    authUrl?: string;
    message?: string;
  }>('/api/auth/check-auth', { skipAuthRedirect: true }),

  // Get Pipedrive data
  getPipedriveData: (dealId: string, companyId: string) => 
    apiCall(`/api/pipedrive/data?dealId=${dealId}&companyId=${companyId}`),

  // Create project
  createProject: (data: { dealId: string; companyId: string }) =>
    apiCall('/api/pipedrive/create-project', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Create full project
  createFullProject: (data: { 
    pipedriveDealId: number | string; 
    xeroQuoteNumber?: string | null; 
    pipedriveCompanyId: string 
  }) => 
    apiCall('/api/project/create-full', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get Xero status
  getXeroStatus: (pipedriveCompanyId: string) =>
    apiCall(`/api/xero/status?pipedriveCompanyId=${pipedriveCompanyId}`),

  // Create Xero quote
  createXeroQuote: (data: { 
    pipedriveDealId: string; 
    pipedriveCompanyId: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    tenantId?: string;
    xeroConnected?: boolean;
    xeroJustConnected?: boolean;
  }) =>
    apiCall('/api/xero/quote', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get quotation data for updating
  getQuotationData: async (dealId: string, companyId: string) => {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/pipedrive/get-quotation-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, companyId })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update Xero quote
  updateXeroQuote: async (data: { dealId: string; companyId: string; quoteId?: string }) => {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/xero/update-quote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
};
