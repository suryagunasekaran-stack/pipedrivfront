/**
 * Authentication State Management Store
 * Implements centralized auth state as specified in the Frontend Integration Guide
 */

import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import { AuthStatusResponse } from '../types/api';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface AuthStore {
  // State
  companyId: string | null;
  isAuthenticated: {
    pipedrive: boolean;
    xero: boolean;
  };
  loading: boolean;
  error: string | null;
  lastChecked: number | null;
  
  // Actions
  setCompanyId: (id: string) => void;
  setAuthStatus: (service: 'pipedrive' | 'xero', status: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuthStatus: (companyId: string, force?: boolean) => Promise<AuthStatusResponse>;
  logout: (companyId?: string) => Promise<void>;
  reset: () => void;
  
  // Computed getters
  getIsFullyAuthenticated: () => boolean;
  getAuthStatusSummary: () => {
    authenticated: boolean;
    pipedriveConnected: boolean;
    xeroConnected: boolean;
    requiresXero: boolean;
  };
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      companyId: null,
      isAuthenticated: {
        pipedrive: false,
        xero: false,
      },
      loading: false,
      error: null,
      lastChecked: null,

      // Actions
      setCompanyId: (id: string) => {
        set({ companyId: id, error: null });
      },

      setAuthStatus: (service: 'pipedrive' | 'xero', status: boolean) => {
        set((state) => ({
          isAuthenticated: {
            ...state.isAuthenticated,
            [service]: status,
          },
          error: null,
        }));
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error, loading: false });
      },

      checkAuthStatus: async (companyId: string, force: boolean = false) => {
        const state = get();
        const now = Date.now();
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes

        // Check cache unless forced
        if (!force && state.lastChecked && (now - state.lastChecked) < cacheExpiry) {
          return {
            authenticated: state.isAuthenticated.pipedrive,
            services: state.isAuthenticated,
            companyId: state.companyId || companyId,
            requiresXeroConnection: !state.isAuthenticated.xero,
          };
        }

        try {
          set({ loading: true, error: null });
          
          const response = await apiService.checkAuthStatus(companyId);
          
          set({
            companyId,
            isAuthenticated: {
              pipedrive: response.services.pipedrive,
              xero: response.services.xero,
            },
            loading: false,
            error: null,
            lastChecked: now,
          });
          
          return response;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to check authentication status';
          set({ 
            loading: false, 
            error: errorMessage,
            // Reset auth status on error to be safe
            isAuthenticated: {
              pipedrive: false,
              xero: false,
            },
          });
          throw error;
        }
      },

      logout: async (companyId?: string) => {
        const state = get();
        const targetCompanyId = companyId || state.companyId;
        
        if (!targetCompanyId) {
          set({ error: 'No company ID available for logout' });
          return;
        }

        try {
          set({ loading: true, error: null });
          
          await apiService.logout(targetCompanyId);
          
          // Reset all auth state
          set({
            companyId: null,
            isAuthenticated: {
              pipedrive: false,
              xero: false,
            },
            loading: false,
            error: null,
            lastChecked: null,
          });
          
        } catch (error: any) {
          const errorMessage = error.message || 'Logout failed';
          set({ 
            loading: false, 
            error: errorMessage,
          });
          throw error;
        }
      },

      reset: () => {
        set({
          companyId: null,
          isAuthenticated: {
            pipedrive: false,
            xero: false,
          },
          loading: false,
          error: null,
          lastChecked: null,
        });
      },

      // Computed getters
      getIsFullyAuthenticated: () => {
        const state = get();
        return state.isAuthenticated.pipedrive && state.isAuthenticated.xero;
      },

      getAuthStatusSummary: () => {
        const state = get();
        return {
          authenticated: state.isAuthenticated.pipedrive,
          pipedriveConnected: state.isAuthenticated.pipedrive,
          xeroConnected: state.isAuthenticated.xero,
          requiresXero: state.isAuthenticated.pipedrive && !state.isAuthenticated.xero,
        };
      },
    }),
    {
      name: 'auth-store', // Storage key
      partialize: (state) => ({
        companyId: state.companyId,
        isAuthenticated: state.isAuthenticated,
        lastChecked: state.lastChecked,
      }),
    }
  )
);

// =============================================================================
// HOOK UTILITIES
// =============================================================================

/**
 * Hook to get authentication status with auto-refresh
 */
export const useAuthStatus = (companyId?: string) => {
  const store = useAuthStore();
  
  // Auto-check auth status when companyId changes
  React.useEffect(() => {
    if (companyId && companyId !== store.companyId) {
      store.checkAuthStatus(companyId).catch(console.error);
    }
  }, [companyId, store.companyId]);
  
  return {
    ...store.getAuthStatusSummary(),
    loading: store.loading,
    error: store.error,
    companyId: store.companyId,
    checkAuthStatus: store.checkAuthStatus,
    logout: store.logout,
  };
};

/**
 * Hook for Pipedrive-specific auth state
 */
export const usePipedriveAuth = () => {
  const store = useAuthStore();
  
  return {
    isConnected: store.isAuthenticated.pipedrive,
    companyId: store.companyId,
    loading: store.loading,
    error: store.error,
    connect: () => {
      // This would redirect to Pipedrive auth
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/pipedrive';
      }
    },
  };
};

/**
 * Hook for Xero-specific auth state
 */
export const useXeroAuth = () => {
  const store = useAuthStore();
  
  return {
    isConnected: store.isAuthenticated.xero,
    requiresConnection: store.isAuthenticated.pipedrive && !store.isAuthenticated.xero,
    loading: store.loading,
    error: store.error,
    connect: (companyId?: string) => {
      const targetCompanyId = companyId || store.companyId;
      if (targetCompanyId) {
        apiService.connectXero(targetCompanyId);
      }
    },
  };
};

export default useAuthStore;
