'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { ApiError } from '../../../services/api';

// Content component to use Suspense
function XeroSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuthStatus, isAuthenticated, companyId: storedCompanyId, isCheckingAuth, setCompanyId } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    // companyId should be passed back by the backend after successful Xero OAuth
    const companyIdParam = searchParams.get('companyId');
    const stateParam = searchParams.get('state'); // Xero also uses state

    if (errorParam) {
      setErrorMessage(`Xero connection failed: ${errorParam}. Please try again.`);
      setStatus('error');
      setTimeout(() => router.push(`/auth/xero/error?message=${encodeURIComponent(errorParam)}&companyId=${companyIdParam || storedCompanyId || ''}`), 3000);
      return;
    }

    // If no error, and we have state (code is handled by backend), it's a nominal success.
    // Verify and update frontend state.
    if (stateParam) { // Xero callback includes state. Code is handled by backend.
        const companyIdToUse = companyIdParam || storedCompanyId;

        if (companyIdToUse) {
            if (companyIdParam && companyIdParam !== storedCompanyId) {
                setCompanyId(companyIdParam); // Update store if URL has a more direct companyId
            }
            setStatus('loading');
            setRedirectMessage('Verifying Xero connection status...');
            checkAuthStatus(companyIdToUse)
                .then(() => {
                    // State updated by checkAuthStatus. React to isAuthenticated.xero in the next effect.
                     setStatus('success');
                })
                .catch((err) => {
                    if (err instanceof ApiError) {
                        setErrorMessage(err.message);
                    } else if (err instanceof Error) {
                        setErrorMessage(err.message);
                    } else {
                        setErrorMessage('An unknown error occurred while verifying Xero connection.');
                    }
                    setStatus('error');
                });
        } else {
            // This is a fallback, ideally companyIdParam or storedCompanyId is available
            setErrorMessage('Xero connected, but company ID is missing. Cannot verify status.');
            setStatus('error');
             setTimeout(() => router.push('/auth/pipedrive'), 3000); // Go back to Pipedrive auth
        }
    } else if (!errorParam) {
      // Handles cases where user might land here without full OAuth flow
      setRedirectMessage('Checking existing authentication status...');
      if (storedCompanyId) {
        checkAuthStatus(storedCompanyId).catch(err => {
          setStatus('error');
          setErrorMessage('Failed to re-verify authentication: ' + err.message);
        });
      } else {
        setStatus('error');
        setErrorMessage('Not enough information to verify Xero connection. Please try connecting Pipedrive first.');
        setTimeout(() => router.push('/auth/pipedrive'), 3000);
      }
    }

  }, [searchParams, checkAuthStatus, router, storedCompanyId, setCompanyId]);

  useEffect(() => {
    // This effect handles redirection after status is 'success' and auth state is updated
    if (status === 'success' && isAuthenticated.xero) {
      setRedirectMessage('Xero connection successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000); // Or '/' or other main app page
    } else if (status === 'success' && !isAuthenticated.xero && !isCheckingAuth) {
      // If checkAuthStatus ran, succeeded, but Xero is still not marked as authenticated
      setStatus('error');
      setErrorMessage("Xero connection seemed successful, but status couldn't be confirmed. Please try again or contact support.");
    }
  }, [status, isAuthenticated.xero, router, isCheckingAuth]);


  let displayContent;
  if (status === 'loading' || isCheckingAuth) {
    displayContent = (
      <>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{redirectMessage || 'Processing Xero connection...'}</p>
      </>
    );
  } else if (status === 'error') {
    displayContent = (
      <>
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Xero Connection Failed</h1>
        <p className="text-red-600 mb-6">{errorMessage || 'An unexpected error occurred.'}</p>
        <button
            onClick={() => router.push(storedCompanyId ? `/auth/xero?pipedriveCompanyId=${storedCompanyId}` : '/auth/pipedrive')}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Connecting Xero Again
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
          Xero Connected Successfully!
        </h1>
        <p className="text-gray-600 mb-6">{redirectMessage}</p>
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

// Wrap with Suspense
export default function XeroSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <XeroSuccessContent />
    </Suspense>
  );
}
