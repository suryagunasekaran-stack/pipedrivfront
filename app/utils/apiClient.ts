/**
 * Enhanced API client with automatic authentication handling
 */

import { BACKEND_API_BASE_URL } from '../constants';
import { appendUserAuthToUrl, addUserAuthHeaders, getUserAuth, addUserAuthToBody } from './userAuth';
import { storePendingAction } from './authRetry';

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
  
  // Add userId to URL for GET requests or as query parameter
  const urlWithAuth = appendUserAuthToUrl(url);
  
  // Add user auth headers
  const headersWithAuth = addUserAuthHeaders({
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  });
  
  try {
    const response = await fetch(urlWithAuth, {
      headers: headersWithAuth,
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
        // Store the pending action before redirecting
        storePendingAction({
          action: 'api_call',
          url: urlWithAuth,
          method: fetchOptions.method || 'GET',
          body: fetchOptions.body ? JSON.parse(fetchOptions.body as string) : undefined,
          headers: headersWithAuth,
          timestamp: Date.now()
        });
        
        // For frontend pages, redirect to our success page, not directly to API endpoints
        const authUrl = new URL(data.authUrl);
        const returnUrl = '/auth/pipedrive/success';
        authUrl.searchParams.set('returnUrl', returnUrl);
        
        window.location.href = authUrl.toString();
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
      body: JSON.stringify(addUserAuthToBody(data)),
    }),

  // Create full project
  createFullProject: (data: { 
    pipedriveDealId: number | string; 
    xeroQuoteNumber?: string | null; 
    pipedriveCompanyId: string 
  }) => 
    apiCall('/api/project/create-full', {
      method: 'POST',
      body: JSON.stringify(addUserAuthToBody(data)),
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
      body: JSON.stringify(addUserAuthToBody(data)),
    }),

  // Get quotation data for updating
  getQuotationData: async (dealId: string, companyId: string) => {
    const urlWithAuth = appendUserAuthToUrl(`${BACKEND_API_BASE_URL}/api/pipedrive/get-quotation-data`);
    const headersWithAuth = addUserAuthHeaders({ 'Content-Type': 'application/json' });
    const bodyWithAuth = addUserAuthToBody({ dealId, companyId });
    
    const response = await fetch(urlWithAuth, {
      method: 'POST',
      headers: headersWithAuth,
      body: JSON.stringify(bodyWithAuth)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update Xero quote
  updateXeroQuote: async (data: { dealId: string; companyId: string; quoteId?: string }) => {
    const urlWithAuth = appendUserAuthToUrl(`${BACKEND_API_BASE_URL}/api/xero/update-quote`);
    const headersWithAuth = addUserAuthHeaders({ 'Content-Type': 'application/json' });
    const bodyWithAuth = addUserAuthToBody(data);
    
    const response = await fetch(urlWithAuth, {
      method: 'PUT',
      headers: headersWithAuth,
      body: JSON.stringify(bodyWithAuth)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
};
