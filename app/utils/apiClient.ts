/**
 * Enhanced API client with automatic authentication handling
 */

interface ApiResponse<T = any> {
  data?: T;
  authenticated?: boolean;
  authRequired?: 'pipedrive' | 'xero';
  authUrl?: string;
  message?: string;
  error?: string;
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
  createXeroQuote: (data: { pipedriveDealId: string; pipedriveCompanyId: string }) =>
    apiCall('/api/xero/quote', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
