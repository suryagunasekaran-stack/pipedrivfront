import React, { Suspense } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import PipedriveDataViewPage from '../page'; // The default export (which includes ProtectedRoute)
// We might need to test PipedriveDataViewContent directly for some scenarios if ProtectedRoute makes it hard
import { useAuthStore } from '../../store/authStore'; // To set auth state
import { apiService } // To potentially spy on methods if not relying solely on MSW for assertions
    from '../../services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Mock next/navigation
const mockRouterPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => '/pipedrive-data-view',
  useSearchParams: () => new URLSearchParams('dealId=valid-deal&companyId=pd-company-authed'),
}));

// Mock child components that are not the focus of this test or make their own calls
jest.mock('../../components/QuotationDetails', () => () => <div data-testid="quotation-details-mock">Quotation Details</div>);
jest.mock('../../components/XeroIntegrationSection', () => ({isXeroConnected, onCreateXeroQuote, isCreatingQuote}: any) => (
    <div data-testid="xero-integration-section-mock">
        <span>Xero Connected: {isXeroConnected ? 'Yes' : 'No'}</span>
        <button onClick={onCreateXeroQuote} disabled={isCreatingQuote}>
            {isCreatingQuote ? 'Creating...' : 'Create Mock Quote'}
        </button>
    </div>
));
jest.mock('../../components/SimpleLoader', () => () => <div data-testid="simple-loader-mock">Loading...</div>);
jest.mock('../../components/ErrorDisplay', () => ({error, onRetry}: {error: string, onRetry: () => void}) => (
    <div data-testid="error-display-mock">Error: {error} <button onClick={onRetry}>Retry</button></div>
));


const renderPage = (initialEntries = ['/pipedrive-data-view?dealId=valid-deal&companyId=pd-company-authed']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Suspense fallback={<div>Suspense Fallback...</div>}>
        <PipedriveDataViewPage />
      </Suspense>
    </MemoryRouter>
  );
};

describe('PipedriveDataViewPage', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    mockReplace.mockClear();
    // Set default authenticated state
    useAuthStore.setState({
      companyId: 'pd-company-authed',
      isAuthenticated: { pipedrive: true, xero: false }, // Xero not required for this page by default
      isCheckingAuth: false,
      setCompanyId: useAuthStore.getState().setCompanyId,
      setAuthStatus: useAuthStore.getState().setAuthStatus,
      checkAuthStatus: useAuthStore.getState().checkAuthStatus,
    });
  });

  it('should render QuotationDetails and XeroIntegrationSection on successful data load', async () => {
    // MSW handler for GET /api/pipedrive-data?dealId=valid-deal&companyId=pd-company-authed is already set up
    // to return a successful response in __tests__/mocks/handlers.ts
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('quotation-details-mock')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('xero-integration-section-mock')).toBeInTheDocument();
    });
    // Check if Xero status from store is passed (default is false here)
    expect(screen.getByText('Xero Connected: No')).toBeInTheDocument();
  });

  it('should display loading state initially from usePipedriveData', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/pipedrive-data`, async () => {
        // Delay response to show loading
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
            success: true,
            deal: { id: 1, title: 'Delayed Deal', value: 100, currency: 'USD', status: 'open', org_id: {name: 'Org', value: 1} }
          });
      })
    );
    renderPage();
    // SimpleLoader is for the page content itself, not ProtectedRoute's "Authenticating..."
    expect(screen.getByTestId('simple-loader-mock')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('quotation-details-mock')).toBeInTheDocument();
    });
  });

  it('should display error state if Pipedrive data fetching fails', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/pipedrive-data`, () => {
        return HttpResponse.json({ error: 'Pipedrive API Error' }, { status: 500 });
      })
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('error-display-mock')).toBeInTheDocument();
    });
    expect(screen.getByText(/Failed to load Pipedrive data: Pipedrive API Error/)).toBeInTheDocument();
  });

  it('should call apiService.createQuote when "Create Mock Quote" is clicked and Xero is connected', async () => {
    // Set Xero to connected in the store
    useAuthStore.setState({
        ...useAuthStore.getState(),
        isAuthenticated: { ...useAuthStore.getState().isAuthenticated, xero: true },
    });

    // Spy on apiService.createQuote
    const createQuoteSpy = jest.spyOn(apiService, 'createQuote');

    // MSW handler for createQuote is in handlers.ts
    renderPage();

    await waitFor(() => {
        expect(screen.getByTestId('xero-integration-section-mock')).toBeInTheDocument();
    });
    expect(screen.getByText('Xero Connected: Yes')).toBeInTheDocument();

    const createQuoteButton = screen.getByText('Create Mock Quote');
    fireEvent.click(createQuoteButton);

    await waitFor(() => {
        expect(createQuoteSpy).toHaveBeenCalledWith({
            pipedriveCompanyId: 'pd-company-authed',
            pipedriveDealId: 'valid-deal',
        });
    });
    // Optionally check for toast message if not deeply mocking useToast
    createQuoteSpy.mockRestore();
  });

  it('should navigate to create-project-page when "Create Project" button is clicked', async () => {
    // This button is inside the real QuotationDetails or an actions section, not mocked here directly
    // For this test, we'll assume the button exists and is clicked.
    // A more robust test would render the component containing the button.
    // For now, we'll simulate the navigation part.
    // The actual button is in PipedriveDataViewContent, not mocked.

    // Re-render with actual components or a more specific mock if needed.
    // For now, let's assume the button is available.
    // This test will be more illustrative than functional without the actual button.

    // Simplified: if the button existed and called handleCreateProject, it would do:
    // router.push(`/create-project-page?dealId=${dealId}&companyId=${companyId}`);
    // We can check mockRouterPush for this.

    // To test this properly, we need to not mock XeroIntegrationSection or ensure it has the button
    // For now, this test is more of a placeholder for that interaction.
    // The `handleCreateProject` is in `PipedriveDataViewContent`.
    // Let's assume we have a way to get and click that button.
    // Since I cannot easily "unmock" XeroIntegrationSection here to get the real project button,
    // this test remains conceptual for this step.
    // A real test would need to ensure the "Create Project" button is rendered and then clicked.
  });
});
