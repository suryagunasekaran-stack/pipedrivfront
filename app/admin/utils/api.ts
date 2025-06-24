// Admin API utilities with session management

interface AdminRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class AdminAPIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'AdminAPIError';
  }
}

/**
 * Base function for making authenticated admin requests
 * Automatically includes credentials and handles 401 redirects
 */
// Import backend URL from constants for consistency
import { BACKEND_API_BASE_URL } from '../../constants';
const BACKEND_URL = BACKEND_API_BASE_URL;

export async function adminRequest<T = any>(
  endpoint: string,
  options: AdminRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  try {
    const response = await fetch(`${BACKEND_URL}/api/admin${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    });

    console.log(`API ${options.method || 'GET'} ${BACKEND_URL}/api/admin${endpoint} - Status: ${response.status}`);
    
    // Handle unauthorized responses
    if (response.status === 401 && !skipAuth) {
      console.log('401 Unauthorized response, redirecting to login');
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      throw new AdminAPIError(401, 'Unauthorized');
    }

    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Error ${response.status}:`, errorData);
      throw new AdminAPIError(
        response.status,
        errorData.message || `HTTP ${response.status}`,
        errorData
      );
    }

    // Return parsed JSON response
    const responseData = await response.json();
    console.log('API Response data:', responseData);
    
    // Handle backend response structure {success: true, data: actualData}
    // For non-auth endpoints, extract data if it exists
    if (responseData.success && responseData.data && !endpoint.includes('/auth/')) {
      return responseData.data;
    }
    
    return responseData;
  } catch (error) {
    if (error instanceof AdminAPIError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Authentication functions
export const auth = {
  async login(password: string) {
    const result = await adminRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
      skipAuth: true,
    });
    console.log('Login response:', result);
    return result;
  },

  async logout() {
    return adminRequest('/auth/logout', {
      method: 'POST',
    });
  },

  async checkSession() {
    try {
      const result = await adminRequest('/auth/verify', {
        skipAuth: true,
      });
      console.log('Raw verify response:', result);
      return result;
    } catch (error) {
      console.error('Verify request failed:', error);
      return { authenticated: false };
    }
  },
};

// Dashboard API
export const dashboard = {
  async getDashboardData() {
    return adminRequest('/dashboard');
  },
};

// Companies API
export const companies = {
  async getCompanies(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);

    return adminRequest(`/companies?${queryParams.toString()}`);
  },

  async getCompany(companyId: string) {
    return adminRequest(`/companies/${companyId}`);
  },

  async createCompany(data: {
    companyId: string;
    configData: {
      customFields: Record<string, string>;
      xeroSettings?: {
        defaultAccountCode?: string;
        defaultTaxType?: string;
        defaultCurrency?: string;
      };
    };
  }) {
    console.log('=== API LAYER - CREATE COMPANY ===');
    console.log('Data being sent to adminRequest:', JSON.stringify(data, null, 2));
    console.log('Request method: POST');
    console.log('Request endpoint: /companies');
    console.log('Request body (stringified):', JSON.stringify(data));
    console.log('==================================');
    
    try {
      const response = await adminRequest('/companies', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('=== API RESPONSE SUCCESS ===');
      console.log('Response:', response);
      console.log('============================');
      
      return response;
    } catch (error) {
      console.log('=== API RESPONSE ERROR ===');
      console.error('API Error:', error);
      console.log('==========================');
      throw error;
    }
  },

  async updateCompany(companyId: string, data: {
    customFields?: Record<string, string>;
    xeroSettings?: {
      defaultAccountCode?: string;
      defaultTaxType?: string;
      defaultCurrency?: string;
    };
  }) {
    return adminRequest(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async bulkUpdateCompanies(companyIds: string[], data: any) {
    return adminRequest('/companies/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ companyIds, updates: data }),
    });
  },
};

// Sequences API
export const sequences = {
  async getSequences() {
    return adminRequest('/sequences');
  },

  async updateSequence(department: string, year: string, newStartingPoint: number) {
    // Return the full response without extracting data since we need validation info
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/sequences/${department}/${year}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newStartingPoint }),
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        throw new AdminAPIError(401, 'Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AdminAPIError(
          response.status,
          errorData.error || `HTTP ${response.status}`,
          errorData
        );
      }

      const responseData = await response.json();
      
      // For update sequence, we need the full response including validation
      if (responseData.success && responseData.data) {
        return responseData.data;
      }
      
      return responseData;
    } catch (error) {
      if (error instanceof AdminAPIError) {
        throw error;
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async resetSequence(department: string, year: string, resetValue: number = 0) {
    // Return the full response for reset sequence
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/sequences/${department}/${year}/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetValue }),
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        throw new AdminAPIError(401, 'Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AdminAPIError(
          response.status,
          errorData.error || `HTTP ${response.status}`,
          errorData
        );
      }

      const responseData = await response.json();
      
      // Return the full response structure
      return responseData;
    } catch (error) {
      if (error instanceof AdminAPIError) {
        throw error;
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

// Activity API
export const activity = {
  async getActivityLog(params?: {
    limit?: number;
    offset?: number;
    actionType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.actionType) queryParams.append('actionType', params.actionType);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    return adminRequest(`/activity?${queryParams.toString()}`);
  },
};

// Health API
export const health = {
  async getSystemHealth() {
    return adminRequest('/health');
  },

  async getDetailedHealth() {
    return adminRequest('/health/detailed');
  },
}; 