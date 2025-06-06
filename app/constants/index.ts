/**
 * Application constants and configuration
 */

export const TOAST_AUTO_HIDE_DELAY = 2000; // 5 seconds

export const REDIRECT_DELAY = 2000; // 2 seconds

export const DEFAULT_PIPEDRIVE_DOMAIN = "app.pipedrive.com";

// External API base URL - should be moved to environment variables in production
export const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://localhost:3000';

// API_ENDPOINTS and EXTERNAL_API_ENDPOINTS are largely deprecated as apiService.ts hardcodes paths.
// Keeping them for now in case any minor utility still refers to them, but they should be phased out.
// For example, apiService.getPipedriveData uses `${this.baseUrl}/api/pipedrive-data` directly.

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
