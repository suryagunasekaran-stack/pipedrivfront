// TypeScript interfaces based on frontend-integration-guide.md

interface AuthStatusRequest {
  companyId: string;
}

interface AuthStatusResponse {
  authenticated: boolean;
  services: {
    pipedrive: boolean;
    xero: boolean;
  };
  companyId: string;
  requiresXeroConnection?: boolean;
}

interface AuthUrlResponse {
  authUrl: string;
}

interface LogoutRequest {
  companyId: string;
}

interface PipedriveDataRequest {
  companyId: string;
  dealId: string;
}

interface PipedriveDataResponse {
  success: boolean;
  deal: {
    id: number;
    title: string;
    value: number;
    currency: string;
    status: string;
    org_id: {
      name: string;
      value: number;
    };
    person_id?: {
      name: string;
      email: Array<{ value: string; primary: boolean }>;
    };
    [key: string]: any;
  };
  person?: {
    id: number;
    name: string;
    email: Array<{ value: string; primary: boolean }>;
    phone: Array<{ value: string; primary: boolean }>;
  };
  organization?: {
    id: number;
    name: string;
    address: string;
  };
  products?: Array<{
    id: number;
    name: string;
    quantity: number;
    item_price: number;
    sum: number;
  }>;
}

interface XeroStatusResponse {
  connected: boolean;
  tenantId?: string;
  tenantName?: string;
  tokenExpiresAt?: string;
}

interface CreateQuoteRequest {
  pipedriveCompanyId: string;
  pipedriveDealId: string;
}

interface CreateQuoteResponse {
  success: boolean;
  quoteNumber: string;
  quoteId: string;
  contactName: string;
  totalAmount: number;
  lineItemsCount: number;
  pipedriveDealUpdated: boolean;
}

interface CreateProjectRequest {
  pipedriveDealId: string;
  pipedriveCompanyId: string;
  existingProjectNumberToLink?: string;
}

interface CreateProjectResponse {
  success: boolean;
  projectNumber: string;
  deal: any;
  person?: any;
  organization?: any;
  products?: any[];
  xero?: {
    projectCreated: boolean;
    projectId?: string;
    projectName?: string;
    contactId?: string;
    tasksCreated?: string[];
    quoteAccepted?: boolean;
    error?: string;
  };
  metadata: {
    dealId: string;
    companyId: string;
    isNewProject: boolean;
  };
}

// API Error class
export class ApiError extends Error {
  statusCode: number;
  requestId?: string;
  details?: any;

  constructor(message: string, statusCode: number, requestId?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.details = details;
  }
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error during JSON parsing' }));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.requestId,
          errorData.details
        );
      } else {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
    }
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return undefined as T;
    }
    // Assuming all successful responses are JSON as per the guide's examples
    return response.json() as Promise<T>;
  }

  // --- Auth Endpoints ---
  /**
   * Checks the authentication status for a given company.
   * @param companyId - The ID of the company to check.
   * @returns A promise that resolves with the authentication status.
   */
  async checkAuthStatus(companyId: string): Promise<AuthStatusResponse> {
    // The guide shows `AuthStatusRequest` but the example usage is a GET with query param.
    const response = await fetch(`${this.baseUrl}/auth/status?companyId=${companyId}`);
    return this.handleResponse<AuthStatusResponse>(response);
  }

  /**
   * Fetches the Pipedrive authorization URL.
   * @returns A promise that resolves with the Pipedrive authorization URL.
   */
  async getPipedriveAuthUrl(): Promise<AuthUrlResponse> {
    const response = await fetch(`${this.baseUrl}/auth/auth-url`);
    return this.handleResponse<AuthUrlResponse>(response);
  }

  /**
   * Redirects the user to the Xero connection flow.
   * @param pipedriveCompanyId - The Pipedrive company ID to associate with the Xero connection.
   */
  connectXero(pipedriveCompanyId: string): void {
    window.location.href = `${this.baseUrl}/auth/connect-xero?pipedriveCompanyId=${pipedriveCompanyId}`;
  }

  /**
   * Logs the user out for a specific company.
   * @param request - Contains the companyId for logout.
   * @returns A promise that resolves when logout is complete.
   */
  async logout(request: LogoutRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return this.handleResponse<void>(response);
  }

  // --- Pipedrive Data Endpoints ---
  /**
   * Fetches Pipedrive deal data, including related person, organization, and products.
   * @param companyId - The Pipedrive company ID.
   * @param dealId - The Pipedrive deal ID.
   * @returns A promise that resolves with the Pipedrive deal data.
   */
  async getPipedriveData(companyId: string, dealId: string): Promise<PipedriveDataResponse> {
    // Guide shows GET /api/pipedrive-data with PipedriveDataRequest as body, which is non-standard for GET.
    // Implementing with query parameters as it's more common for GET and matches old client.
    const queryParams = new URLSearchParams({ companyId, dealId });
    const response = await fetch(`${this.baseUrl}/api/pipedrive-data?${queryParams.toString()}`, {
      method: 'GET', // Explicitly GET
      headers: { 'Content-Type': 'application/json' }, // Though GET, some APIs expect/validate this
    });
    return this.handleResponse<PipedriveDataResponse>(response);
  }

  // --- Xero Integration Endpoints ---
  /**
   * Checks the Xero connection status for a given Pipedrive company.
   * @param pipedriveCompanyId - The Pipedrive company ID.
   * @returns A promise that resolves with the Xero connection status.
   */
  async checkXeroStatus(pipedriveCompanyId: string): Promise<XeroStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/xero/status?pipedriveCompanyId=${pipedriveCompanyId}`);
    return this.handleResponse<XeroStatusResponse>(response);
  }

  /**
   * Creates a Xero quote based on a Pipedrive deal.
   * @param request - Contains pipedriveCompanyId and pipedriveDealId.
   * @returns A promise that resolves with the created quote's information.
   */
  async createQuote(request: CreateQuoteRequest): Promise<CreateQuoteResponse> {
    const response = await fetch(`${this.baseUrl}/api/xero/create-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return this.handleResponse<CreateQuoteResponse>(response);
  }

  // --- Project Management Endpoints ---
  /**
   * Creates a full project, potentially including Xero project creation and linking.
   * @param request - Contains pipedriveDealId, pipedriveCompanyId, and optionally existingProjectNumberToLink.
   * @returns A promise that resolves with the project creation response.
   */
  async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await fetch(`${this.baseUrl}/api/project/create-full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return this.handleResponse<CreateProjectResponse>(response);
  }
}

// Export a singleton instance of ApiService
export const apiService = new ApiService();
