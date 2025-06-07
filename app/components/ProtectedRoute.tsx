/**
 * Protected Route Component
 * Implements route protection and authentication flow as specified in the Frontend Integration Guide
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

// =============================================================================
// TYPES
// =============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireXero?: boolean;
  companyId?: string;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireXero = false,
  companyId,
  redirectTo,
  fallback,
}) => {
  const router = useRouter();
  const authStore = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setIsChecking(true);
        setAuthError(null);

        // If companyId is provided and different from stored one, check auth status
        if (companyId && companyId !== authStore.companyId) {
          await authStore.checkAuthStatus(companyId);
        } else if (authStore.companyId) {
          // Refresh auth status if we have a company ID
          await authStore.checkAuthStatus(authStore.companyId);
        }

        const currentCompanyId = companyId || authStore.companyId;

        // Check if we have a company ID
        if (!currentCompanyId) {
          handleRedirect('/auth/pipedrive', 'No company ID found');
          return;
        }

        // Check Pipedrive authentication
        if (!authStore.isAuthenticated.pipedrive) {
          handleRedirect('/auth/pipedrive', 'Pipedrive authentication required');
          return;
        }

        // Check Xero authentication if required
        if (requireXero && !authStore.isAuthenticated.xero) {
          handleRedirect(`/auth/xero?companyId=${encodeURIComponent(currentCompanyId)}`, 'Xero authentication required');
          return;
        }

        setIsChecking(false);
      } catch (error: any) {
        console.error('Authentication check failed:', error);
        setAuthError(error.message || 'Authentication check failed');
        setIsChecking(false);
        
        // Redirect to auth on error
        handleRedirect('/auth/pipedrive', 'Authentication verification failed');
      }
    };

    checkAuthentication();
  }, [companyId, authStore.companyId, authStore.isAuthenticated, requireXero]);

  const handleRedirect = (path: string, reason: string) => {
    console.log(`Redirecting to ${path}: ${reason}`);
    
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push(path);
    }
  };

  // Show loading state while checking authentication
  if (isChecking || authStore.loading) {
    return fallback || <AuthenticationLoader />;
  }

  // Show error state if authentication check failed
  if (authError) {
    return (
      <AuthenticationError 
        error={authError} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // Check final authentication state before rendering children
  const currentCompanyId = companyId || authStore.companyId;
  
  if (!currentCompanyId || !authStore.isAuthenticated.pipedrive) {
    return fallback || <AuthenticationLoader message="Authenticating..." />;
  }

  if (requireXero && !authStore.isAuthenticated.xero) {
    return fallback || <AuthenticationLoader message="Connecting to Xero..." />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

// =============================================================================
// AUTHENTICATION LOADER COMPONENT
// =============================================================================

interface AuthenticationLoaderProps {
  message?: string;
}

const AuthenticationLoader: React.FC<AuthenticationLoaderProps> = ({ 
  message = "Checking authentication..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

// =============================================================================
// AUTHENTICATION ERROR COMPONENT
// =============================================================================

interface AuthenticationErrorProps {
  error: string;
  onRetry: () => void;
}

const AuthenticationError: React.FC<AuthenticationErrorProps> = ({ 
  error, 
  onRetry 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Required
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {error}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onRetry}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/auth/pipedrive'}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Authentication
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HIGHER-ORDER COMPONENT
// =============================================================================

/**
 * HOC to wrap pages with protected route
 */
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
  
  WrappedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// =============================================================================
// AUTHENTICATION GUARDS
// =============================================================================

/**
 * Hook to check if user is authenticated
 */
export const useAuthGuard = (companyId?: string, requireXero: boolean = false) => {
  const authStore = useAuthStore();
  const router = useRouter();

  const checkAndRedirect = React.useCallback(async () => {
    try {
      const currentCompanyId = companyId || authStore.companyId;
      
      if (currentCompanyId) {
        await authStore.checkAuthStatus(currentCompanyId);
      }

      if (!authStore.isAuthenticated.pipedrive) {
        router.push('/auth/pipedrive');
        return false;
      }

      if (requireXero && !authStore.isAuthenticated.xero) {
        router.push(`/auth/xero?companyId=${encodeURIComponent(currentCompanyId || '')}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth guard check failed:', error);
      router.push('/auth/pipedrive');
      return false;
    }
  }, [companyId, authStore, router, requireXero]);

  return {
    isAuthenticated: authStore.isAuthenticated.pipedrive && (requireXero ? authStore.isAuthenticated.xero : true),
    isLoading: authStore.loading,
    error: authStore.error,
    checkAndRedirect,
  };
};

export default ProtectedRoute;
