import { Suspense, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface LazyRouteProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for lazy-loaded routes with error boundaries and loading states
 */
export default function LazyRoute({ 
  component: Component, 
  fallback
}: LazyRouteProps) {
  const defaultFallback = (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <LoadingSpinner message="Loading page..." size="lg" />
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
} 