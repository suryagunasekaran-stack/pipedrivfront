import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { AuthStatusResponse } from '../types/api';

interface UseAuthReturn {
  checkAuth: (companyId?: string) => Promise<AuthStatusResponse>;
  handleAuthRedirect: (authResponse: AuthStatusResponse) => void;
  isCheckingAuth: boolean;
}

/**
 * Custom hook for handling authentication flow
 */
export function useAuth(): UseAuthReturn {
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const checkAuth = useCallback(async (companyId?: string): Promise<AuthStatusResponse> => {
    if (!companyId) {
      return {
        authenticated: false,
        services: { pipedrive: false, xero: false },
        companyId: '',
        requiresXeroConnection: false
      };
    }

    setIsCheckingAuth(true);
    try {
      // Use the new API service to check authentication status
      const authStatus = await apiService.checkAuthStatus(companyId);
      return authStatus;
    } catch (error) {
      console.error('Auth check failed:', error);
      return {
        authenticated: false,
        services: { pipedrive: false, xero: false },
        companyId: companyId || '',
        requiresXeroConnection: false
      };
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleAuthRedirect = useCallback((authResponse: AuthStatusResponse) => {
    if (!authResponse.authenticated) {
      if (!authResponse.services.pipedrive) {
        // Redirect to Pipedrive auth
        window.location.href = '/auth/pipedrive';
      } else if (authResponse.requiresXeroConnection && !authResponse.services.xero) {
        // Redirect to Xero auth with company ID
        window.location.href = `/auth/xero?companyId=${authResponse.companyId}`;
      }
    }
  }, []);

  return {
    checkAuth,
    handleAuthRedirect,
    isCheckingAuth
  };
}
