/**
 * Comprehensive API Service Layer for Pipedrive-Xero Integration
 * Implements all endpoints and patterns specified in the Frontend Integration Guide
 */

import {
  AuthStatusResponse,
  AuthUrlResponse,
  LogoutRequest,
  PipedriveDataRequest,
  PipedriveDataResponse,
  XeroStatusResponse,
  CreateQuoteRequest,
  CreateQuoteResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  ApiCallOptions,
  ApiResponse,
} from '../types/api';

import {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  handleApiError,
  handleNetworkError,
  logError,
  isRetryableError,
  calculateRetryDelay,
} from '../utils/errors';

// =============================================================================
// API SERVICE CLASS
// =============================================================================

class ApiService {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds
  private defaultRetries: number = 3;
  private defaultRetryDelay: number = 1000; // 1 second

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    
    // Validate base URL
    if (!this.baseUrl) {
      throw new Error('API base URL is not configured');
    }
  }

  // ===========================================================================
  // CORE HTTP METHODS
  // ===========================================================================

  /**
   * Generic HTTP request method with comprehensive error handling and retry logic
   */
  private async request<T>(
    endpoint: string,
    options: ApiCallOptions = {}
  ): Promise<T> {
    const {
      skipAuthRedirect = false,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    let lastError: ApiError;

    // Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          signal: controller.signal,
          ...fetchOptions,
        });

        clearTimeout(timeoutId);

        // Handle non-200 responses
        if (!response.ok) {
          await handleApiError(response);
        }

        // Handle authentication redirects
        if (response.status === 401 && !skipAuthRedirect) {
          const authData = await response.json().catch(() => ({}));
          
          if (authData.authUrl) {
            if (typeof window !== 'undefined') {
              window.location.href = authData.authUrl;
            }
            throw new AuthenticationError('Authentication required - redirecting...', authData);
          } else {
            // Fallback to default auth page
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/pipedrive';
            }
            throw new AuthenticationError('Authentication required - redirecting...');
          }
        }

        // Parse response
        const data: ApiResponse<T> = await response.json();
        
        // Return the actual data if it's wrapped in a data property, otherwise return the whole response
        return (data.data !== undefined ? data.data : data) as T;

      } catch (error: any) {
        lastError = error instanceof ApiError ? error : handleNetworkError(error);
        
        // Log error for debugging
        logError(lastError, `${options.method || 'GET'} ${endpoint} (attempt ${attempt + 1})`);

        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === retries || !isRetryableError(lastError)) {
          break;
        }

        // Wait before retrying
        const delay = calculateRetryDelay(attempt, retryDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * GET request helper
   */
  private get<T>(endpoint: string, options?: ApiCallOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  private post<T>(endpoint: string, data?: any, options?: ApiCallOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request helper
   */
  private put<T>(endpoint: string, data?: any, options?: ApiCallOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request helper
   */
  private delete<T>(endpoint: string, options?: ApiCallOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // ===========================================================================
  // AUTHENTICATION ENDPOINTS
  // ===========================================================================

  /**
   * Check authentication status for a company
   */
  async checkAuthStatus(companyId: string): Promise<AuthStatusResponse> {
    return this.get<AuthStatusResponse>(`/auth/status?companyId=${encodeURIComponent(companyId)}`, {
      skipAuthRedirect: true,
    });
  }

  /**
   * Check authentication status via POST method
   */
  async checkAuthStatusPost(companyId: string): Promise<AuthStatusResponse> {
    return this.post<AuthStatusResponse>('/auth/status', { companyId }, {
      skipAuthRedirect: true,
    });
  }

  /**
   * Get Pipedrive authentication URL
   */
  async getPipedriveAuthUrl(): Promise<string> {
    const response = await this.get<AuthUrlResponse>('/auth/auth-url');
    return response.authUrl;
  }

  /**
   * Initiate Xero connection (redirects to Xero OAuth)
   */
  connectXero(pipedriveCompanyId: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = `${this.baseUrl}/auth/connect-xero?pipedriveCompanyId=${encodeURIComponent(pipedriveCompanyId)}`;
    }
  }

  /**
   * Logout user
   */
  async logout(companyId: string): Promise<void> {
    await this.post<void>('/auth/logout', { companyId });
  }

  // ===========================================================================
  // PIPEDRIVE DATA ENDPOINTS
  // ===========================================================================

  /**
   * Get Pipedrive deal data
   */
  async getPipedriveData(companyId: string, dealId: string): Promise<PipedriveDataResponse> {
    const params = new URLSearchParams({
      companyId: companyId,
      dealId: dealId,
    });
    
    return this.get<PipedriveDataResponse>(`/api/pipedrive-data?${params.toString()}`);
  }

  /**
   * Alternative method using POST for getting Pipedrive data
   */
  async getPipedriveDataPost(request: PipedriveDataRequest): Promise<PipedriveDataResponse> {
    return this.post<PipedriveDataResponse>('/api/pipedrive-data', request);
  }

  // ===========================================================================
  // XERO INTEGRATION ENDPOINTS
  // ===========================================================================

  /**
   * Check Xero connection status
   */
  async checkXeroStatus(pipedriveCompanyId: string): Promise<XeroStatusResponse> {
    return this.get<XeroStatusResponse>(`/api/xero/status?pipedriveCompanyId=${encodeURIComponent(pipedriveCompanyId)}`);
  }

  /**
   * Create Xero quote
   */
  async createQuote(request: CreateQuoteRequest): Promise<CreateQuoteResponse> {
    return this.post<CreateQuoteResponse>('/api/xero/create-quote', request);
  }

  /**
   * Convenience method for creating quote with separate parameters
   */
  async createXeroQuote(companyId: string, dealId: string): Promise<CreateQuoteResponse> {
    return this.createQuote({
      pipedriveCompanyId: companyId,
      pipedriveDealId: dealId,
    });
  }

  // ===========================================================================
  // PROJECT MANAGEMENT ENDPOINTS
  // ===========================================================================

  /**
   * Create full project
   */
  async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.post<CreateProjectResponse>('/api/project/create-full', request);
  }

  /**
   * Convenience method for creating project with separate parameters
   */
  async createFullProject(
    companyId: string, 
    dealId: string, 
    existingProjectNumber?: string
  ): Promise<CreateProjectResponse> {
    return this.createProject({
      pipedriveCompanyId: companyId,
      pipedriveDealId: dealId,
      existingProjectNumberToLink: existingProjectNumber,
    });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health', {
      skipAuthRedirect: true,
      timeout: 5000, // Quick health check
      retries: 1,
    });
  }

  /**
   * Get API configuration info
   */
  getConfiguration(): {
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.defaultTimeout,
      retries: this.defaultRetries,
      retryDelay: this.defaultRetryDelay,
    };
  }

  /**
   * Update default configuration
   */
  updateConfiguration(config: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  }): void {
    if (config.timeout !== undefined) this.defaultTimeout = config.timeout;
    if (config.retries !== undefined) this.defaultRetries = config.retries;
    if (config.retryDelay !== undefined) this.defaultRetryDelay = config.retryDelay;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const apiService = new ApiService();

// =============================================================================
// LEGACY COMPATIBILITY LAYER
// =============================================================================

/**
 * Legacy API client for backward compatibility
 * @deprecated Use apiService instead
 */
export const api = {
  // Check authentication status
  checkAuth: () => apiService.checkAuthStatus(''),

  // Get Pipedrive data
  getPipedriveData: (dealId: string, companyId: string) => 
    apiService.getPipedriveData(companyId, dealId),

  // Create project
  createProject: (data: { dealId: string; companyId: string }) =>
    apiService.createFullProject(data.companyId, data.dealId),

  // Create full project
  createFullProject: (data: { 
    pipedriveDealId: number | string; 
    xeroQuoteNumber?: string | null; 
    pipedriveCompanyId: string 
  }) => 
    apiService.createProject({
      pipedriveDealId: data.pipedriveDealId.toString(),
      pipedriveCompanyId: data.pipedriveCompanyId,
      existingProjectNumberToLink: data.xeroQuoteNumber || undefined,
    }),

  // Get Xero status
  getXeroStatus: (pipedriveCompanyId: string) =>
    apiService.checkXeroStatus(pipedriveCompanyId),

  // Create Xero quote
  createXeroQuote: (data: { pipedriveDealId: string; pipedriveCompanyId: string }) =>
    apiService.createQuote(data),
};

// Export specific items to avoid conflicts
export {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  ValidationError,
  handleApiError,
  handleNetworkError,
  logError,
  isRetryableError,
  calculateRetryDelay,
  getUserFriendlyErrorMessage,
} from '../utils/errors';

export type {
  AuthStatusResponse,
  AuthUrlResponse,
  LogoutRequest,
  PipedriveDataRequest,
  PipedriveDataResponse,
  XeroStatusResponse,
  CreateQuoteRequest,
  CreateQuoteResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  ApiCallOptions,
  ApiResponse,
  ApiErrorResponse,
  ApiErrorType,
} from '../types/api';
