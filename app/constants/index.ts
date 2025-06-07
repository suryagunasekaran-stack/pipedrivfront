/**
 * Application constants and configuration
 */

export const TOAST_AUTO_HIDE_DELAY = 2000; // 2 seconds

export const REDIRECT_DELAY = 2000; // 2 seconds

export const DEFAULT_PIPEDRIVE_DOMAIN = "app.pipedrive.com";

// Backend API base URL - configured from environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Correct API endpoints matching the backend specification
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH_STATUS: '/auth/status',
  AUTH_URL: '/auth/auth-url',
  XERO_AUTH_URL: '/auth/xero-auth-url',
  LOGOUT: '/auth/logout',
  
  // Pipedrive data endpoints
  PIPEDRIVE_DATA: '/api/pipedrive-data',
  
  
  XERO_STATUS: '/api/xero/status',
  XERO_CREATE_QUOTE: '/api/xero/create-quote',
  
  // Project management endpoints
  PROJECT_CREATE_FULL: '/api/project/create-full',
} as const;

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;

export const ERROR_MESSAGES = {
  MISSING_DEAL_ID: 'Missing dealId or companyId in query parameters',
  XERO_CONNECTION_ERROR: 'Failed to check Xero connection status',
  QUOTE_CREATION_ERROR: 'Failed to create Xero quote',
  DATA_FETCH_ERROR: 'Failed to fetch Pipedrive data',
  PROJECT_CREATION_ERROR: 'Failed to create project',
  MISSING_PROJECT_PARAMS: 'Deal ID or Company ID is missing from URL parameters',
  AUTHENTICATION_ERROR: 'Authentication failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

// Project creation constants
export const PROJECT_REDIRECT_DELAY = 3000; // 3 seconds

export const PROJECT_CHECK_ITEMS = [
  { id: 'deal-title', label: 'Pipedrive Deal Title', required: true },
  { id: 'org-name', label: 'Organization Name', required: true },
  { id: 'contact-person', label: 'Contact Person', required: true },
  { id: 'xero-quote', label: 'Xero Quote Number', required: true },
  { id: 'department', label: 'Department', required: true },
  { id: 'vessel-name', label: 'Vessel Name', required: true },
  { id: 'location', label: 'Location', required: true },
  { id: 'sales-in-charge', label: 'Sales In Charge', required: true },
] as const;
