import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'; // Using react-router-dom for navigation context
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '../../store/authStore';
import { AppInitializer } from '../AppInitializer'; // To simulate initial auth check potentially

// Mock the navigation hooks from next/navigation
// We'll use react-router-dom's MemoryRouter for testing navigation flow
// but spy on next/navigation's useRouter for assertion if needed for specific next features.
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(), // Add other methods if your component uses them
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/protected-page', // Mock current pathname
  useSearchParams: () => new URLSearchParams(), // Mock search params
}));

// Helper component to display current location for testing redirects
const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
};

// Helper to set auth state for tests
const setAuthState = (authState: Partial<ReturnType<typeof useAuthStore.getState>>) => {
  useAuthStore.setState({
    ...useAuthStore.getState(),
    ...authState,
  });
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    // Reset auth store to a default non-authenticated state
    useAuthStore.setState({
      companyId: null,
      isAuthenticated: { pipedrive: false, xero: false },
      isCheckingAuth: false,
      // Keep other store methods
      setCompanyId: useAuthStore.getState().setCompanyId,
      setAuthStatus: useAuthStore.getState().setAuthStatus,
      checkAuthStatus: useAuthStore.getState().checkAuthStatus,
    });
  });

  it('should display loading indicator when isCheckingAuth is true', () => {
    setAuthState({ isCheckingAuth: true });
    render(
      <MemoryRouter initialEntries={['/protected-page']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });

  it('should display loading indicator if not checking but Pipedrive not authenticated', () => {
    // Initial state: companyId is null, pipedrive is false, not checking
    render(
      <MemoryRouter initialEntries={['/protected-page']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });


  it('should redirect to /auth/pipedrive if not authenticated with Pipedrive', async () => {
    // State: not checking, no companyId, Pipedrive not authed
    render(
      <MemoryRouter initialEntries={['/protected-page']}>
        <Routes>
          <Route path="/protected-page" element={
            <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
          } />
          <Route path="/auth/pipedrive" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );
    // ProtectedRoute's useEffect will trigger the redirect
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/auth/pipedrive?redirect=%2Fprotected-page');
    });
  });

  it('should redirect to /auth/xero if requireXero is true and Xero is not authenticated', async () => {
    setAuthState({
      companyId: 'test-company',
      isAuthenticated: { pipedrive: true, xero: false },
      isCheckingAuth: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected-xero-page']}>
        <Routes>
          <Route path="/protected-xero-page" element={
            <ProtectedRoute requireXero={true}><div>Protected Xero Content</div></ProtectedRoute>
          } />
          <Route path="/auth/xero" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/auth/xero?pipedriveCompanyId=test-company&redirect=%2Fprotected-xero-page');
    });
  });

  it('should render children if authenticated (Pipedrive only)', () => {
    setAuthState({
      companyId: 'test-company',
      isAuthenticated: { pipedrive: true, xero: false }, // Xero not required by default
      isCheckingAuth: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected-page']}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should render children if authenticated (Pipedrive and Xero required and met)', () => {
    setAuthState({
      companyId: 'test-company',
      isAuthenticated: { pipedrive: true, xero: true },
      isCheckingAuth: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected-xero-page']}>
        <ProtectedRoute requireXero={true}>
          <div data-testid="protected-xero-content">Protected Xero Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('protected-xero-content')).toBeInTheDocument();
  });

  it('should show "Connecting to Xero..." if requireXero is true, Pipedrive authed, but Xero not yet', () => {
    setAuthState({
      companyId: 'test-company',
      isAuthenticated: { pipedrive: true, xero: false },
      isCheckingAuth: false, // Not actively checking, but Xero is false
    });

    render(
      <MemoryRouter initialEntries={['/protected-xero-page']}>
        <ProtectedRoute requireXero={true}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    // This loading state is shown before the redirect useEffect kicks in
    expect(screen.getByText('Connecting to Xero...')).toBeInTheDocument();
  });

});
