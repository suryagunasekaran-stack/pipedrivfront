'use client';

import { useEffect, useState, Suspense } from 'react'; // Added Suspense
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { ApiError } from '../../../services/api'; // Assuming ApiError is exported from services/api

// A wrapper component to use useSearchParams
function PipedriveSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuthStatus, isAuthenticated, companyId: storedCompanyId, isCheckingAuth, setCompanyId } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const companyIdParam = searchParams.get('companyId'); // Assuming backend redirects with companyId
    const stateParam = searchParams.get('state'); // OAuth state parameter for validation (optional here)
    const codeParam = searchParams.get('code'); // OAuth code (backend handles this)

    if (errorParam) {
      setErrorMessage(`Authentication failed: ${errorParam}. Please try again.`);
      setStatus('error');
      // Redirect to a dedicated error page or allow retry
      setTimeout(() => router.push('/auth/pipedrive/error?message=' + encodeURIComponent(errorParam)), 3000);
      return;
    }

    // If there's no error, and we have code/state, it's a nominal success from OAuth provider
    // The backend should have processed the token. Now, verify and update frontend state.
    if (codeParam && stateParam) {
        if (companyIdParam) {
            // If companyId is in URL, set it in store first
            // This is important if checkAuthStatus relies on companyId being in store
            // or if the user landed here directly.
            if (companyIdParam !== storedCompanyId) {
                setCompanyId(companyIdParam);
            }

            setStatus('loading'); // Show loading while checking auth status
            setRedirectMessage('Verifying authentication status...');
            checkAuthStatus(companyIdParam)
                .then(() => {
                    // State will be updated by checkAuthStatus
                    // Now use a separate effect to react to isAuthenticated changes for redirection
                    setStatus('success'); // Keep success message until redirect
                })
                .catch((err) => {
                    if (err instanceof ApiError) {
                        setErrorMessage(err.message);
                    } else if (err instanceof Error) {
                        setErrorMessage(err.message);
                    } else {
                        setErrorMessage('An unknown error occurred while verifying authentication.');
                    }
                    setStatus('error');
                });
        } else {
            // This case should ideally not happen if backend redirects correctly with companyId
            setErrorMessage('Pipedrive connected, but company ID was not provided in the callback.');
            setStatus('error');
        }
    } else if (!errorParam) {
      // Handles cases where user might land here without full OAuth flow (e.g. manual navigation)
      // Or if backend didn't pass expected params
      setRedirectMessage('Checking existing authentication status...');
      if (storedCompanyId) {
        checkAuthStatus(storedCompanyId).catch(err => {
          setStatus('error');
          setErrorMessage('Failed to re-verify authentication: ' + err.message);
        });
      } else {
        setStatus('error');
        setErrorMessage('Not enough information to verify Pipedrive connection. Please try connecting again.');
        setTimeout(() => router.push('/auth/pipedrive'), 3000);
      }
    }
  }, [searchParams, checkAuthStatus, router, storedCompanyId, setCompanyId]);


  useEffect(() => {
    // This effect handles redirection after status is 'success' and auth state is updated
    if (status === 'success' && isAuthenticated.pipedrive) {
      setRedirectMessage('Pipedrive connection successful!');
      if (!isAuthenticated.xero) { // Assuming we want to chain to Xero auth
        setRedirectMessage(prev => prev + ' Redirecting to Xero connection...');
        setTimeout(() => {
          // Pass companyId to Xero auth page, ensure it's the one from the store (updated by checkAuthStatus)
          router.push(`/auth/xero?pipedriveCompanyId=${storedCompanyId || searchParams.get('companyId')}`);
        }, 2000);
      } else {
        setRedirectMessage(prev => prev + ' Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000); // Or '/' or other main app page
      }
    }
  }, [status, isAuthenticated, router, storedCompanyId, searchParams]);


  let displayContent;
  if (status === 'loading' || isCheckingAuth) {
    displayContent = (
      <>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{redirectMessage || 'Processing authentication...'}</p>
      </>
    );
  } else if (status === 'error') {
    displayContent = (
      <>
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Connection Failed</h1>
        <p className="text-red-600 mb-6">{errorMessage || 'An unexpected error occurred.'}</p>
        <button
            onClick={() => router.push('/auth/pipedrive')}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Connecting Pipedrive Again
          </button>
      </>
    );
  } else if (status === 'success') {
    displayContent = (
      <>
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pipedrive Connected Successfully!
        </h1>
        <p className="text-gray-600 mb-6">{redirectMessage}</p>
        {/* Button could be to "Go to Xero Setup" or "Go to Dashboard" if redirect fails */}
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-6 p-8 text-center">
        {displayContent}
      </div>
    </div>
  );
}

// Wrap with Suspense because useSearchParams requires it
export default function PipedriveSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <PipedriveSuccessContent />
    </Suspense>
  );
}
