'use client';

import { useEffect } from 'react';
import ApiErrorPage from './components/ApiErrorPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const errorInfo = {
    message: error.message || 'An unexpected error occurred',
    statusCode: error.statusCode,
    details: error.digest ? `Reference: ${error.digest}` : undefined,
  };

  return <ApiErrorPage error={errorInfo} onRetry={reset} />;
}