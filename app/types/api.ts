/**
 * API Response Type Definitions for Pipedrive-Xero Integration
 * Based on the Frontend Integration Guide specifications
 */

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface AuthStatusResponse {
  authenticated: boolean;
  services: {
    pipedrive: boolean;
    xero: boolean;
  };
  companyId: string;
  requiresXeroConnection?: boolean;
}

export interface AuthUrlResponse {
  authUrl: string;
}

export interface LogoutRequest {
  companyId: string;
}

// =============================================================================
// PIPEDRIVE DATA TYPES
// =============================================================================

export interface PipedriveDataRequest {
  companyId: string;
  dealId: string;
}

export interface EmailEntry {
  value: string;
  primary: boolean;
  label?: string;
}

export interface PhoneEntry {
  value: string;
  primary: boolean;
  label?: string;
}

export interface PipedrivePerson {
  id: number;
  name: string;
  email: EmailEntry[];
  phone: PhoneEntry[];
}

export interface PipedriveOrganization {
  id: number;
  name: string;
  address: string;
}

export interface PipedriveProduct {
  id: number;
  name: string;
  quantity: number;
  item_price: number;
  sum: number;
  discount?: number;
  discount_type?: string;
  tax?: number;
  tax_method?: string;
}

export interface PipedriveDeal {
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
    email: EmailEntry[];
  };
  add_time?: string;
  expected_close_date?: string | null;
  // Custom fields based on environment config
  [key: string]: any;
}

export interface PipedriveDataResponse {
  success: boolean;
  deal: PipedriveDeal;
  person?: PipedrivePerson;
  organization?: PipedriveOrganization;
  products?: PipedriveProduct[];
}

// =============================================================================
// XERO INTEGRATION TYPES
// =============================================================================

export interface XeroStatusResponse {
  connected: boolean;
  tenantId?: string;
  tenantName?: string;
  tokenExpiresAt?: string;
}

export interface CreateQuoteRequest {
  pipedriveCompanyId: string;
  pipedriveDealId: string;
}

export interface CreateQuoteResponse {
  success: boolean;
  quoteNumber: string;
  quoteId: string;
  contactName: string;
  totalAmount: number;
  lineItemsCount: number;
  pipedriveDealUpdated: boolean;
}

// =============================================================================
// PROJECT MANAGEMENT TYPES
// =============================================================================

export interface CreateProjectRequest {
  pipedriveDealId: string;
  pipedriveCompanyId: string;
  existingProjectNumberToLink?: string; // Optional: link to existing project
}

export interface XeroProjectDetails {
  projectCreated: boolean;
  projectId?: string;
  projectName?: string;
  contactId?: string;
  tasksCreated?: string[];
  quoteAccepted?: boolean;
  error?: string;
}

export interface CreateProjectResponse {
  success: boolean;
  projectNumber: string; // e.g., "NY25001"
  deal: any; // Full deal object
  person?: any; // Contact details
  organization?: any; // Company details
  products?: any[]; // Deal products
  xero?: XeroProjectDetails;
  metadata: {
    dealId: string;
    companyId: string;
    isNewProject: boolean;
  };
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export interface ApiError {
  error: string;
  requestId?: string;
  statusCode?: number;
  missingField?: string;
  details?: any;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  requestId?: string;
  details?: any;
}

// =============================================================================
// GENERIC API RESPONSE WRAPPER
// =============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  authenticated?: boolean;
  authRequired?: 'pipedrive' | 'xero';
  authUrl?: string;
  message?: string;
  error?: string;
  success?: boolean;
}

// =============================================================================
// API CLIENT OPTIONS
// =============================================================================

export interface ApiCallOptions extends RequestInit {
  skipAuthRedirect?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// =============================================================================
// EXPORTED CONSTANTS
// =============================================================================

export const API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ApiErrorType = typeof API_ERRORS[keyof typeof API_ERRORS];
