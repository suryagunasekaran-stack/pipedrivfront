'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSearchParams } from 'next/navigation'; // To read initial companyId from URL

// Suspense wrapper will be needed in layout.tsx if AppInitializer uses useSearchParams
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuthStatus, companyId: storedCompanyId, isCheckingAuth, setCompanyId } = useAuthStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to get companyId from URL (e.g., xero_company_id, companyId)
    // This logic might need to be adjusted based on the exact URL params your app uses at launch
    const companyIdFromUrl = searchParams.get('xero_company_id') || searchParams.get('companyId');

    if (companyIdFromUrl && companyIdFromUrl !== storedCompanyId) {
      // If found in URL and not matching store, or store is null, update store and check status.
      // This helps initialize the store if the app is loaded with a companyId in URL.
      console.log(`AppInitializer: Found companyId ${companyIdFromUrl} in URL. Updating store and checking auth status.`);
      setCompanyId(companyIdFromUrl); // Set it in the store first
      checkAuthStatus(companyIdFromUrl).catch(error => {
        console.error("AppInitializer: Error during initial checkAuthStatus:", error);
        // Error is logged, store's isCheckingAuth will be set to false.
        // ProtectedRoute will then handle redirection if auth is still not valid.
      });
    } else if (storedCompanyId && !isCheckingAuth) {
      // If there's a companyId in the store (e.g. from previous session via Zustand persist middleware - not implemented here yet)
      // and not currently checking, it might be stale. Optionally, re-verify.
      // For now, we assume if it's in store, it was likely set by a recent auth flow or the URL check above.
      // If persistence is added to useAuthStore, a re-check here might be good.
      // console.log("AppInitializer: CompanyId found in store. Consider re-validating if needed.");
    } else if (!storedCompanyId && !companyIdFromUrl && !isCheckingAuth) {
        // No companyId anywhere, nothing to check initially.
        // ProtectedRoute will redirect to /auth/pipedrive if a protected page is accessed.
        console.log("AppInitializer: No companyId found in URL or store. Initial auth check skipped.");
    }
    // The isCheckingAuth flag in the store will prevent multiple concurrent checks.
  }, [checkAuthStatus, storedCompanyId, searchParams, setCompanyId, isCheckingAuth]);

  return <>{children}</>;
}
