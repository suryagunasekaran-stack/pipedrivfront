import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import XeroSuccessPage from '../page';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api';

// Mock next/navigation
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  usePathname: () => '/auth/xero/success',
  useSearchParams: jest.fn(),
}));

jest.mock('../../../services/api'); // Mock apiService

describe('XeroSuccessPage', () => {
  const mockUseSearchParams = require('next/navigation').useSearchParams;

  beforeEach(() => {
    mockRouterPush.mockClear();
    (apiService.checkAuthStatus as jest.Mock).mockClear();
    useAuthStore.setState({
      companyId: null, // Start with a clean slate or a relevant pre-Pipedrive-auth state
      isAuthenticated: { pipedrive: true, xero: false }, // Assume Pipedrive was connected
      isCheckingAuth: false,
      setCompanyId: useAuthStore.getState().setCompanyId,
      setAuthStatus: useAuthStore.getState().setAuthStatus,
      checkAuthStatus: useAuthStore.getState().checkAuthStatus,
    });
  });

  it('should display error and redirect if "error" query param is present', async () => {
    const companyId = 'test-company-for-xero-error';
    useAuthStore.getState().setCompanyId(companyId); // Set companyId in store for retry link construction
    mockUseSearchParams.mockReturnValue(new URLSearchParams('error=xero_problem&companyId=' + companyId));

    render(
      <MemoryRouter initialEntries={[`/auth/xero/success?error=xero_problem&companyId=${companyId}`]}>
        <XeroSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Xero connection failed: xero_problem/)).toBeInTheDocument();
    });
    await waitFor(() => {
      // Check if it tries to redirect to the Xero error page
      expect(mockRouterPush).toHaveBeenCalledWith(`/auth/xero/error?message=xero_problem&companyId=${companyId}`);
    });
  });

  it('should call checkAuthStatus and redirect to dashboard if Xero successfully connected', async () => {
    const companyId = 'xero-success-company';
    // Simulate companyId being set from Pipedrive auth, or passed in URL
    useAuthStore.getState().setCompanyId(companyId);
    mockUseSearchParams.mockReturnValue(new URLSearchParams(`state=teststate&companyId=${companyId}`)); // Xero callback includes state

    (apiService.checkAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: true,
      services: { pipedrive: true, xero: true }, // Now Xero is true
      companyId: companyId,
    });

    render(
      <MemoryRouter initialEntries={[`/auth/xero/success?state=teststate&companyId=${companyId}`]}>
        <XeroSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiService.checkAuthStatus).toHaveBeenCalledWith(companyId);
    });
    await waitFor(() => {
      expect(screen.getByText(/Xero Connected Successfully!/)).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to dashboard.../)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  it('should display error if checkAuthStatus fails to confirm Xero connection', async () => {
    const companyId = 'xero-check-fail-company';
    useAuthStore.getState().setCompanyId(companyId);
    mockUseSearchParams.mockReturnValue(new URLSearchParams(`state=teststate&companyId=${companyId}`));

    (apiService.checkAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: true, // Overall auth might be true
      services: { pipedrive: true, xero: false }, // But Xero is still false
      companyId: companyId,
    });

    render(
      <MemoryRouter initialEntries={[`/auth/xero/success?state=teststate&companyId=${companyId}`]}>
        <XeroSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(apiService.checkAuthStatus).toHaveBeenCalledWith(companyId));
    await waitFor(() => {
      // The component should transition to an error state
      expect(screen.getByText(/Xero connection seemed successful, but status couldn't be confirmed/)).toBeInTheDocument();
    });
  });

  it('should display error if companyId is missing for checkAuthStatus', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('state=teststate')); // No companyId
    // Ensure store also has no companyId for this specific test case
    useAuthStore.setState({ ...useAuthStore.getState(), companyId: null });

    render(
      <MemoryRouter initialEntries={['/auth/xero/success?state=teststate']}>
        <XeroSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Xero connected, but company ID is missing. Cannot verify status./)).toBeInTheDocument();
    });
    expect(apiService.checkAuthStatus).not.toHaveBeenCalled();
  });
});
