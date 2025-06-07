/**
 * Auto-authentication flow utilities
 * Handles automatic routing to auth pages and back to origin
 */

import { apiService } from '../services/api';

export interface AuthFlowContext {
  returnUrl: string;
  action: 'create-quote' | 'create-project' | 'view-data';
  params?: Record<string, string>;
}

/**
 * Storage keys for auth flow context
 */
const STORAGE_KEY = 'authFlowContext';

/**
 * Save the current context before redirecting to auth
 */
export function saveAuthFlowContext(context: AuthFlowContext): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  }
}

/**
 * Retrieve and clear the auth flow context
 */
export function getAndClearAuthFlowContext(): AuthFlowContext | null {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const context = JSON.parse(stored) as AuthFlowContext;
    sessionStorage.removeItem(STORAGE_KEY);
    return context;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Check authentication status and handle auto-redirect if needed
 */
export async function checkAndHandleAuth(
  companyId: string,
  requiredServices: ('pipedrive' | 'xero')[],
  context: AuthFlowContext
): Promise<boolean> {
  try {
    const authStatus = await apiService.checkAuthStatus(companyId);
    
    // Check Pipedrive auth first
    if (!authStatus.services.pipedrive && requiredServices.includes('pipedrive')) {
      saveAuthFlowContext(context);
      window.location.href = '/auth/pipedrive';
      return false;
    }
    
    // Check Xero auth if required
    if (!authStatus.services.xero && requiredServices.includes('xero')) {
      saveAuthFlowContext(context);
      // Use the apiService to redirect to Xero auth
      apiService.connectXero(companyId);
      return false;
    }
    
    return true; // All required services are authenticated
  } catch (error) {
    console.error('Auth check failed:', error);
    // Fallback to Pipedrive auth if status check fails
    saveAuthFlowContext(context);
    window.location.href = '/auth/pipedrive';
    return false;
  }
}

/**
 * Handle post-auth redirect back to the original action
 */
export function handlePostAuthRedirect(): void {
  const context = getAndClearAuthFlowContext();
  if (!context) return;
  
  // Add a small delay to ensure auth state is properly updated
  setTimeout(() => {
    window.location.href = context.returnUrl;
  }, 1000);
}

/**
 * Create quote with automatic auth handling
 */
export async function createQuoteWithAuth(
  companyId: string,
  dealId: string,
  currentUrl: string
): Promise<void> {
  const context: AuthFlowContext = {
    returnUrl: currentUrl,
    action: 'create-quote',
    params: { companyId, dealId }
  };
  
  const isAuthenticated = await checkAndHandleAuth(
    companyId,
    ['pipedrive', 'xero'],
    context
  );
  
  if (isAuthenticated) {
    // Proceed with quote creation
    try {
      const result = await apiService.createQuote({
        pipedriveCompanyId: companyId,
        pipedriveDealId: dealId
      });
      
      // Show success and redirect
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('quoteCreated', { 
          detail: { quoteNumber: result.quoteNumber } 
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Quote creation failed:', error);
      throw error;
    }
  }
}

/**
 * Create project with automatic auth handling
 */
export async function createProjectWithAuth(
  companyId: string,
  dealId: string,
  currentUrl: string
): Promise<void> {
  const context: AuthFlowContext = {
    returnUrl: currentUrl,
    action: 'create-project',
    params: { companyId, dealId }
  };
  
  const isAuthenticated = await checkAndHandleAuth(
    companyId,
    ['pipedrive'], // Xero is optional for projects
    context
  );
  
  if (isAuthenticated) {
    // Redirect to project creation page
    window.location.href = `/create-project-page?dealId=${dealId}&companyId=${companyId}`;
  }
}

/**
 * Build current URL with parameters for return navigation
 */
export function getCurrentUrlWithParams(): string {
  if (typeof window === 'undefined') return '/';
  
  return window.location.pathname + window.location.search;
}

/**
 * Initialize auth flow handler for success pages
 */
export function initializeAuthFlowHandler(): void {
  if (typeof window === 'undefined') return;
  
  // Check if we're on a success page and handle redirect
  const isSuccessPage = window.location.pathname.includes('/success');
  if (isSuccessPage) {
    handlePostAuthRedirect();
  }
} 