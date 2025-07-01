/**
 * Hook for managing user authentication state
 */
import { useState, useEffect } from 'react';
import { getUserAuth, UserAuthData, captureUserAuthFromURL } from '../utils/userAuth';

interface UseUserAuthReturn {
  userAuth: UserAuthData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => void;
}

export function useUserAuth(): UseUserAuthReturn {
  const [userAuth, setUserAuth] = useState<UserAuthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserAuth = () => {
    // First try to capture from URL (in case of fresh redirect)
    const urlAuth = captureUserAuthFromURL();
    if (urlAuth) {
      setUserAuth(urlAuth);
    } else {
      // Otherwise get from localStorage
      const storedAuth = getUserAuth();
      setUserAuth(storedAuth);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUserAuth();
  }, []);

  return {
    userAuth,
    isAuthenticated: !!userAuth?.userId,
    isLoading,
    refreshAuth: loadUserAuth
  };
} 