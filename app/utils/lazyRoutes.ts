import { lazy } from 'react';

/**
 * Lazy-loaded route components for code splitting
 */

// Authentication routes
export const LazyPipedriveAuth = lazy(() => import('../auth/pipedrive/page'));
export const LazyPipedriveSuccess = lazy(() => import('../auth/pipedrive/success/page'));
export const LazyPipedriveError = lazy(() => import('../auth/pipedrive/error/page'));

export const LazyXeroAuth = lazy(() => import('../auth/xero/page'));
export const LazyXeroSuccess = lazy(() => import('../auth/xero/success/page'));
export const LazyXeroError = lazy(() => import('../auth/xero/error/page'));

// Main application routes
export const LazyPipedriveDataView = lazy(() => import('../pipedrive-data-view/page'));
export const LazyCreateProjectPage = lazy(() => import('../create-project-page/page'));

// Home page
export const LazyHomePage = lazy(() => import('../page'));

/**
 * Route configuration with lazy loading
 */
export const routes = {
  // Authentication
  '/auth/pipedrive': LazyPipedriveAuth,
  '/auth/pipedrive/success': LazyPipedriveSuccess,
  '/auth/pipedrive/error': LazyPipedriveError,
  '/auth/xero': LazyXeroAuth,
  '/auth/xero/success': LazyXeroSuccess,
  '/auth/xero/error': LazyXeroError,
  
  // Main pages
  '/': LazyHomePage,
  '/pipedrive-data-view': LazyPipedriveDataView,
  '/create-project-page': LazyCreateProjectPage,
} as const;

export type RouteKey = keyof typeof routes; 