import { create } from 'zustand';
import { apiService } from '../services/api'; // Corrected import path
import type { AuthStatusResponse } from '../services/api'; // Import type for clarity

interface AuthStore {
  companyId: string | null;
  isAuthenticated: {
    pipedrive: boolean;
    xero: boolean;
  };
  isCheckingAuth: boolean; // To replace isCheckingAuth from useAuth
  setCompanyId: (id: string | null) => void; // Allow setting to null
  setAuthStatus: (service: 'pipedrive' | 'xero', status: boolean) => void;
  checkAuthStatus: (companyId: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  companyId: null,
  isAuthenticated: {
    pipedrive: false,
    xero: false,
  },
  isCheckingAuth: false, // Initial state for loading status

  setCompanyId: (id) => set({ companyId: id }),

  setAuthStatus: (service, status) =>
    set((state) => ({
      isAuthenticated: {
        ...state.isAuthenticated,
        [service]: status,
      },
    })),

  checkAuthStatus: async (companyId) => {
    set({ isCheckingAuth: true }); // Set loading state
    try {
      const response: AuthStatusResponse = await apiService.checkAuthStatus(companyId);
      set({
        companyId: response.companyId, // Use companyId from response
        isAuthenticated: {
          pipedrive: response.services.pipedrive,
          xero: response.services.xero,
        },
        isCheckingAuth: false,
      });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      // Keep previous auth state but set companyId if provided, and turn off loading
      // Or reset auth status - guide implies updating with response, so on error, perhaps reset or log
      // For now, just stop loading and log. UI can handle the error.
      set(state => ({
        isCheckingAuth: false,
        // Optionally, reset auth or handle specific error states if needed
        // companyId: companyId, // Potentially set companyId even if API call fails
        // isAuthenticated: { pipedrive: false, xero: false }
      }));
      // Re-throw the error if components need to react to it
      // throw error;
    }
  },
}));
