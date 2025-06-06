import { useAuthStore } from '../authStore';
import { apiService } from '../../services/api'; // To potentially mock its methods
import { server } from '../../../__tests__/mocks/server'; // MSW server for actual API calls
import { http, HttpResponse } from 'msw';
import { act } from '@testing-library/react'; // For Zustand state updates outside React components

// Mock apiService for some tests, or rely on MSW for others
jest.mock('../../services/api'); // Auto-mock apiService

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Helper to get initial state for each test, as Zustand store is global
const getInitialState = () => ({
  companyId: null,
  isAuthenticated: {
    pipedrive: false,
    xero: false,
  },
  isCheckingAuth: false,
});

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState(getInitialState());
    // Reset mocks if any direct mocks on apiService are used
    jest.clearAllMocks();
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.companyId).toBeNull();
    expect(state.isAuthenticated.pipedrive).toBe(false);
    expect(state.isAuthenticated.xero).toBe(false);
    expect(state.isCheckingAuth).toBe(false);
  });

  it('setCompanyId should update companyId', () => {
    act(() => {
        useAuthStore.getState().setCompanyId('test-company-123');
    });
    expect(useAuthStore.getState().companyId).toBe('test-company-123');
  });

  it('setAuthStatus should update specific service authentication status', () => {
    act(() => {
        useAuthStore.getState().setAuthStatus('pipedrive', true);
    });
    expect(useAuthStore.getState().isAuthenticated.pipedrive).toBe(true);
    expect(useAuthStore.getState().isAuthenticated.xero).toBe(false);

    act(() => {
        useAuthStore.getState().setAuthStatus('xero', true);
    });
    expect(useAuthStore.getState().isAuthenticated.xero).toBe(true);
  });

  describe('checkAuthStatus action', () => {
    it('should update state correctly on successful API call', async () => {
      const companyId = 'authed-fully';
      const mockApiResponse = {
        authenticated: true,
        services: { pipedrive: true, xero: true },
        companyId,
      };

      // Option 1: Mocking apiService directly (if not relying on MSW for this specific test)
      (apiService.checkAuthStatus as jest.Mock).mockResolvedValueOnce(mockApiResponse);

      // Call the action
      await act(async () => {
        await useAuthStore.getState().checkAuthStatus(companyId);
      });

      const state = useAuthStore.getState();
      expect(apiService.checkAuthStatus).toHaveBeenCalledWith(companyId);
      expect(state.isCheckingAuth).toBe(false);
      expect(state.companyId).toBe(companyId);
      expect(state.isAuthenticated.pipedrive).toBe(true);
      expect(state.isAuthenticated.xero).toBe(true);
    });

    it('should set isCheckingAuth during API call and handle API error', async () => {
      const companyId = 'error-case';

      // Option 1: Mocking apiService for error
      const apiError = new Error('API failed');
      (apiService.checkAuthStatus as jest.Mock).mockRejectedValueOnce(apiError);

      // Check initial isCheckingAuth state if needed, though it's usually false
      expect(useAuthStore.getState().isCheckingAuth).toBe(false);

      // Call the action - need to wrap in a way that allows checking intermediate state
      // or trust the implementation sets isCheckingAuth true then false.
      // `act` helps manage updates.
      let promise;
      act(() => {
        promise = useAuthStore.getState().checkAuthStatus(companyId);
      });

      // Immediately after calling (before promise resolves/rejects), isCheckingAuth should be true
      expect(useAuthStore.getState().isCheckingAuth).toBe(true);

      // Wait for the promise to settle
      await act(async () => {
        await promise;
      });

      const state = useAuthStore.getState();
      expect(apiService.checkAuthStatus).toHaveBeenCalledWith(companyId);
      expect(state.isCheckingAuth).toBe(false); // Should be false after error
      // State should ideally remain unchanged or be reset on error, as per store's logic
      expect(state.companyId).toBeNull(); // Or companyId if it was set before error
      expect(state.isAuthenticated.pipedrive).toBe(false);
    });

    it('should use MSW to mock API and update store (alternative to jest.mock for apiService)', async () => {
        const companyId = 'authed-pipedrive-only'; // This ID is handled by MSW handlers

        // Ensure jest.mock for apiService is not interfering, or unmock it for this test block
        // For this test, we want MSW to handle the call that apiService.checkAuthStatus makes.
        // If apiService is auto-mocked, its methods are jest.fn(). We need the real method to run.
        jest.unmock('../../services/api'); // Use the actual apiService implementation
        // Note: This might require re-importing or careful setup if other tests rely on the mock.
        // A cleaner way is to not auto-mock globally if some tests need real instances.

        // Re-import the actual apiService if unmocked (Vitest might handle this differently)
        const actualApiService = (await import('../../services/api')).apiService;

        // MSW handler is already set up in jest.setup.js and handlers.ts
        // for 'authed-pipedrive-only'

        await act(async () => {
            // Call using the actual apiService via the store
            await useAuthStore.getState().checkAuthStatus(companyId);
        });

        const state = useAuthStore.getState();
        expect(state.isCheckingAuth).toBe(false);
        expect(state.companyId).toBe(companyId);
        expect(state.isAuthenticated.pipedrive).toBe(true);
        expect(state.isAuthenticated.xero).toBe(false);

        // Re-mock for other tests if needed, or structure describe blocks
        jest.mock('../../services/api');
      });
  });
});
