import { useState, useCallback } from 'react';

interface AuthResponse {
  authenticated: boolean;
  authRequired?: 'pipedrive' | 'xero';
  authUrl?: string;
  message?: string;
}

interface UseAuthReturn {
  checkAuth: (companyId?: string) => Promise<AuthResponse>;
  handleAuthRedirect: (authResponse: AuthResponse) => void;
  isCheckingAuth: boolean;
}

/**
 * Custom hook for handling authentication flow
 */
export function useAuth(): UseAuthReturn {
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const checkAuth = useCallback(async (companyId?: string): Promise<AuthResponse> => {
    setIsCheckingAuth(true);
    try {
      let authCheckUrl = '/api/auth/check-auth';
      if (companyId) {
        authCheckUrl += `?companyId=${encodeURIComponent(companyId)}`;
      }
      
      const response = await fetch(authCheckUrl);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check authentication');
      }
      
      return data;
    } catch (error) {
      console.error('Auth check failed:', error);
      return {
        authenticated: false,
        authRequired: 'pipedrive',
        authUrl: '/auth/pipedrive',
        message: 'Authentication check failed'
      };
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleAuthRedirect = useCallback((authResponse: AuthResponse) => {
    if (!authResponse.authenticated && authResponse.authUrl) {
      window.location.href = authResponse.authUrl;
    }
  }, []);

  return {
    checkAuth,
    handleAuthRedirect,
    isCheckingAuth
  };
}
