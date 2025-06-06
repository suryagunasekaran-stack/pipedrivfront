'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Corrected import for useRouter
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireXero?: boolean;
}

export function ProtectedRoute({ children, requireXero = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { companyId, isAuthenticated, isCheckingAuth } = useAuthStore();

  // Attempt to get companyId from URL if not in store (e.g. xero_company_id from Pipedrive app)
  // This is part of the "initial auth check" consideration.
  // For ProtectedRoute itself, it primarily relies on the store's state.
  // An initial check in layout.tsx or a root client component is better for populating the store.

  useEffect(() => {
    // If auth state is still being checked, don't redirect yet.
    // This prevents redirecting before the store has a chance to load persisted state or complete an initial check.
    if (isCheckingAuth) {
      return;
    }

    if (!companyId || !isAuthenticated.pipedrive) {
      // Preserve the intended path to redirect back after login
      const redirectTo = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.push(`/auth/pipedrive${redirectTo}`);
      return;
    }

    if (requireXero && !isAuthenticated.xero) {
      // Preserve the intended path
      const redirectTo = pathname ? `&redirect=${encodeURIComponent(pathname)}` : '';
      router.push(`/auth/xero?pipedriveCompanyId=${companyId}${redirectTo}`);
      return;
    }
  }, [companyId, isAuthenticated, isCheckingAuth, requireXero, router, pathname]);

  // Render loading state
  // isCheckingAuth is from the store, indicating an ongoing checkAuthStatus call.
  // We also need to consider if the store is hydrating initially (Zustand typically handles this quickly).
  // A simple check could be if isCheckingAuth is true OR if Pipedrive auth is not yet confirmed (to avoid flicker).
  if (isCheckingAuth || (!companyId || !isAuthenticated.pipedrive)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-gray-700">Authenticating...</p>
      </div>
    );
  }

  // If Xero is required but not authenticated, show a specific loading/redirecting message
  if (requireXero && !isAuthenticated.xero) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-gray-700">Connecting to Xero...</p>
      </div>
    );
  }

  return <>{children}</>;
}
