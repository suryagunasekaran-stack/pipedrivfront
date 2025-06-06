import React, { Suspense } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../../../__tests__/mocks/server';
import { http, HttpResponse } from 'msw';
import CreateProjectPage from '../page'; // Default export
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Mock next/navigation
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/create-project-page',
  useSearchParams: () => new URLSearchParams('dealId=valid-deal-for-project&companyId=cp-company-authed'),
}));

// Mock child components
jest.mock('../../components/ProjectPreflightCheck', () => ({ projectData, isCreating, onCreateProject }: any) => (
  <div data-testid="project-preflight-check-mock">
    <span>Deal ID for Preflight: {projectData?.deal?.id}</span>
    <button onClick={() => onCreateProject({ existingProjectNumberToLink: 'P00X' })} disabled={isCreating}>
      {isCreating ? 'Creating Project...' : 'Mock Create Project'}
    </button>
  </div>
));
jest.mock('../../components/LoadingSpinner', () => ({message}: {message: string}) => <div data-testid="loading-spinner-mock">{message}</div>);
jest.mock('../../components/ErrorDisplay', () => ({error, onRetry}: {error: string, onRetry: () => void}) => (
    <div data-testid="error-display-mock">Error: {error} <button onClick={onRetry}>Retry</button></div>
));
jest.mock('../../hooks/useProjectRedirect', () => ({
    useProjectRedirect: jest.fn(), // Mock the hook itself
}));


const renderPage = (initialEntries = ['/create-project-page?dealId=valid-deal-for-project&companyId=cp-company-authed']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Suspense fallback={<div>Suspense Fallback...</div>}>
        <CreateProjectPage />
      </Suspense>
    </MemoryRouter>
  );
};

describe('CreateProjectPage', () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
    // Set default authenticated state (Pipedrive and Xero, as requireXero=true for this page)
    useAuthStore.setState({
      companyId: 'cp-company-authed',
      isAuthenticated: { pipedrive: true, xero: true },
      isCheckingAuth: false,
      setCompanyId: useAuthStore.getState().setCompanyId,
      setAuthStatus: useAuthStore.getState().setAuthStatus,
      checkAuthStatus: useAuthStore.getState().checkAuthStatus,
    });
    jest.clearAllMocks(); // Clear all mocks including useProjectRedirect
  });

  it('should render ProjectPreflightCheck on successful initial data load', async () => {
    // MSW handler for GET /api/pipedrive-data (used by useProjectData hook)
    // with dealId 'valid-deal-for-project'
    server.use(
      http.get(`${API_BASE_URL}/api/pipedrive-data`, ({request}) => {
        const url = new URL(request.url);
        if (url.searchParams.get('dealId') === 'valid-deal-for-project') {
            return HttpResponse.json({
                success: true,
                deal: { id: 123, title: 'Project Context Deal', value: 2000, currency: 'EUR', status: 'won', org_id: {name: 'Client Corp', value: 2} },
              });
        }
      })
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('project-preflight-check-mock')).toBeInTheDocument();
    });
    expect(screen.getByText('Deal ID for Preflight: 123')).toBeInTheDocument();
  });

  it('should display loading state from useProjectData', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/pipedrive-data`, async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
            success: true,
            deal: { id: 123, title: 'Delayed Project Context Deal' }
        });
      })
    );
    renderPage();
    expect(screen.getByTestId('loading-spinner-mock')).toHaveTextContent('Loading project data...');
    await waitFor(() => {
      expect(screen.getByTestId('project-preflight-check-mock')).toBeInTheDocument();
    });
  });

  it('should display error state if initial data fetching fails', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/pipedrive-data`, () => {
        return HttpResponse.json({ error: 'Project Data Fetch Error' }, { status: 500 });
      })
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('error-display-mock')).toBeInTheDocument();
    });
    expect(screen.getByText(/Project Data Fetch Error/)).toBeInTheDocument();
  });

  it('should call apiService.createProject when "Mock Create Project" is clicked', async () => {
    // Initial data for useProjectData
    server.use(
        http.get(`${API_BASE_URL}/api/pipedrive-data`, ({request}) => {
          return HttpResponse.json({
              success: true,
              deal: { id: 789, title: 'Deal for Project Creation Test', value: 3000, currency: 'GBP', status: 'won', org_id: {name: 'TestCo', value: 3}}
            });
        })
      );

    const createProjectSpy = jest.spyOn(apiService, 'createProject');
    // MSW handler for POST /api/project/create-full is in global handlers.ts
    // It expects pipedriveDealId: 'valid-deal-for-project' for success.
    // Our searchParams provide this dealId.

    renderPage(); // URL has dealId=valid-deal-for-project

    await waitFor(() => {
      expect(screen.getByTestId('project-preflight-check-mock')).toBeInTheDocument();
    });
     // Ensure the dealId from the mock response of getPipedriveData is used in createProject call.
     // The mocked ProjectPreflightCheck calls onCreateProject with { existingProjectNumberToLink: 'P00X' }

    const createButton = screen.getByText('Mock Create Project');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createProjectSpy).toHaveBeenCalledWith({
        pipedriveCompanyId: 'cp-company-authed', // From authStore
        pipedriveDealId: '789', // From the mocked projectData.deal.id
        existingProjectNumberToLink: 'P00X', // From the mocked ProjectPreflightCheck interaction
      });
    });
    createProjectSpy.mockRestore();
    // Test for useProjectRedirect being called could be added if its effects are observable
  });
});
