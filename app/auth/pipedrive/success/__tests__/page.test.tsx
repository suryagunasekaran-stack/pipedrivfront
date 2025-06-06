import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PipedriveSuccessPage from '../page';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../services/api'; // To spy/mock if needed, though MSW preferred

// Mock next/navigation
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  usePathname: () => '/auth/pipedrive/success', // Mock current pathname
  useSearchParams: jest.fn(), // Will be mocked per test case
}));

// Mock apiService.checkAuthStatus directly for these tests for simplicity
// as MSW is already set up for this endpoint but direct mock is easier for store interactions here.
jest.mock('../../../services/api');

describe('PipedriveSuccessPage', () => {
  const mockUseSearchParams = require('next/navigation').useSearchParams;

  beforeEach(() => {
    mockRouterPush.mockClear();
    (apiService.checkAuthStatus as jest.Mock).mockClear();
    // Reset auth store
    useAuthStore.setState({
      companyId: null,
      isAuthenticated: { pipedrive: false, xero: false },
      isCheckingAuth: false,
      setCompanyId: useAuthStore.getState().setCompanyId,
      setAuthStatus: useAuthStore.getState().setAuthStatus,
      checkAuthStatus: useAuthStore.getState().checkAuthStatus, // use the real one that calls apiService
    });
  });

  it('should display error message if "error" query param is present', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('error=access_denied'));
    render(
      <MemoryRouter initialEntries={['/auth/pipedrive/success?error=access_denied']}>
        <PipedriveSuccessPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Authentication failed: access_denied/)).toBeInTheDocument();
    });
    await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/auth/pipedrive/error?message=access_denied');
    });
  });

  it('should call checkAuthStatus and redirect to Xero if Pipedrive authed, Xero not, companyId provided', async () => {
    const companyId = 'pd-success-company';
    mockUseSearchParams.mockReturnValue(new URLSearchParams(`code=testcode&state=teststate&companyId=${companyId}`));

    (apiService.checkAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: true,
      services: { pipedrive: true, xero: false },
      companyId: companyId,
      requiresXeroConnection: true,
    });

    render(
      <MemoryRouter initialEntries={[`/auth/pipedrive/success?code=testcode&state=teststate&companyId=${companyId}`]}>
        <PipedriveSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiService.checkAuthStatus).toHaveBeenCalledWith(companyId);
    });
    await waitFor(() => {
      expect(screen.getByText(/Pipedrive Connected Successfully!/)).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to Xero connection.../)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(`/auth/xero?pipedriveCompanyId=${companyId}`);
    }, { timeout: 3000 }); // Wait for setTimeout
  });

  it('should call checkAuthStatus and redirect to dashboard if both Pipedrive and Xero authed', async () => {
    const companyId = 'pd-xero-authed-company';
    mockUseSearchParams.mockReturnValue(new URLSearchParams(`code=testcode&state=teststate&companyId=${companyId}`));

    (apiService.checkAuthStatus as jest.Mock).mockResolvedValueOnce({
      authenticated: true,
      services: { pipedrive: true, xero: true },
      companyId: companyId,
    });

    render(
      <MemoryRouter initialEntries={[`/auth/pipedrive/success?code=testcode&state=teststate&companyId=${companyId}`]}>
        <PipedriveSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(apiService.checkAuthStatus).toHaveBeenCalledWith(companyId));
    await waitFor(() => {
        expect(screen.getByText(/Pipedrive Connected Successfully!/)).toBeInTheDocument();
        expect(screen.getByText(/Redirecting to dashboard.../)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

   it('should display error if companyId is missing from query params after successful OAuth (code and state present)', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('code=testcode&state=teststate')); // No companyId

    render(
      <MemoryRouter initialEntries={['/auth/pipedrive/success?code=testcode&state=teststate']}>
        <PipedriveSuccessPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pipedrive connected, but company ID was not provided/)).toBeInTheDocument();
    });
    expect(apiService.checkAuthStatus).not.toHaveBeenCalled();
  });

});
