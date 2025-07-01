'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { captureUserAuthFromURL } from '../../../utils/userAuth';
import { executePendingAction, getPendingAction } from '../../../utils/authRetry';

function PipedriveSuccessContent() {
  const router = useRouter();
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  useEffect(() => {
    const handlePostAuth = async () => {
      // Capture user authentication data from URL on page load
      const authData = captureUserAuthFromURL();
      if (authData) {
        console.log('User authentication data captured:', authData);
        
        // Check if there's a pending action to execute
        const pendingAction = getPendingAction();
        if (pendingAction) {
          setIsExecutingAction(true);
          console.log('Executing pending action:', pendingAction);
          
          // Give a moment for the auth data to be properly stored
          setTimeout(async () => {
            const success = await executePendingAction();
            if (success) {
              // If it was a quote creation, redirect to the appropriate page
              if (pendingAction.url.includes('/api/xero/quote')) {
                router.push('/pipedrive-data-view');
              } else {
                // For other actions, just show success
                setIsExecutingAction(false);
              }
            } else {
              setIsExecutingAction(false);
            }
          }, 1000);
        }
      }
    };
    
    handlePostAuth();
  }, [router]);

  const handleGoToPipedrive = () => {
    window.open('https://app.pipedrive.com/', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          {/* Success checkmark */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isExecutingAction ? 'Processing...' : 'Success!'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {isExecutingAction 
              ? 'Completing your request...' 
              : 'Operation completed successfully.'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoToPipedrive}
            className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Go to Pipedrive
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Click the button above to access your Pipedrive account
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function PipedriveSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PipedriveSuccessContent />
    </Suspense>
  );
}
