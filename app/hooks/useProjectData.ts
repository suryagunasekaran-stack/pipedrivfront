/**
 * Custom hook for managing project related data (fetched from Pipedrive deal) and project creation state.
 */
import { useState, useEffect, useCallback } from 'react';
// Assuming ProjectData can be represented by PipedriveDataResponse for the initial data load.
// Or we might need a more specific type that combines PipedriveDataResponse with other project-specific fields.
import { PipedriveDataResponse, CreateProjectRequest, CreateProjectResponse, ApiError } from '../services/api';
import { apiService } from '../services/api';
import { useToast } from './useToastNew';
// ERROR_MESSAGES can still be used if relevant
import { ERROR_MESSAGES } from '../constants';

// Define what ProjectData means in the context of this hook.
// It's likely the data fetched to inform project creation options.
export type ProjectContextData = PipedriveDataResponse; // Data needed to decide on project creation

interface UseProjectDataContextProps {
  dealId: string | null;
  companyId: string | null;
}

interface UseProjectDataContextReturn {
  projectContextData: ProjectContextData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch Pipedrive deal data relevant for creating a project.
 */
export function useProjectData({ dealId, companyId }: UseProjectDataContextProps): UseProjectDataContextReturn {
  const [projectContextData, setProjectContextData] = useState<ProjectContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchDealContextData = useCallback(async () => {
    if (!dealId || !companyId) {
      const errorMsg = ERROR_MESSAGES.MISSING_PROJECT_PARAMS || "Deal ID or Company ID is missing.";
      // setError(errorMsg); // setError will be handled by the component using the hook
      // toast.error(errorMsg); // Toasting errors here might be too early or repetitive
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch comprehensive deal data using the existing apiService method
      const responseData = await apiService.getPipedriveData(companyId, dealId);
      setProjectContextData(responseData);
      // toast.success('Deal data for project loaded successfully'); // Success toast might be too verbose here
    } catch (e: any) {
      const errorMsg = e instanceof ApiError ? e.message : (e.message || 'Failed to fetch deal data for project.');
      setError(errorMsg);
      // toast.error(errorMsg); // Let component handle displaying the error
      setProjectContextData(null); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [dealId, companyId, toast]);

  useEffect(() => {
    if (dealId && companyId) {
      fetchDealContextData();
    } else {
      setIsLoading(false); // Not enough params to load
    }
  }, [dealId, companyId, fetchDealContextData]);

  return {
    projectContextData,
    isLoading,
    error,
    refetch: fetchDealContextData,
  };
}

// --- useProjectCreation Hook ---

interface UseProjectCreationProps {
  // projectData is the context (e.g. from Pipedrive deal) needed to form the creation request
  projectContextData: ProjectContextData | null;
  dealId: string | null; // Explicit dealId for safety, though it's in projectContextData.deal.id
  companyId: string | null;
}

interface UseProjectCreationReturn {
  isCreating: boolean;
  creationResult: CreateProjectResponse | null; // Use the specific response type
  // createProject function now takes specific parameters needed for the request
  createProject: (params: { existingProjectNumberToLink?: string }) => Promise<CreateProjectResponse | null>;
  clearResult: () => void;
}

export function useProjectCreation({ 
  projectContextData,
  dealId, 
  companyId 
}: UseProjectCreationProps): UseProjectCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  // Use CreateProjectResponse for the result type
  const [creationResult, setCreationResult] = useState<CreateProjectResponse | null>(null);
  const toast = useToast();

  const createProject = useCallback(async (params: { existingProjectNumberToLink?: string }): Promise<CreateProjectResponse | null> => {
    // Use dealId from props, or fallback to projectContextData.deal.id
    const currentDealId = dealId || projectContextData?.deal?.id?.toString();

    if (!currentDealId) {
      const errorMsg = "Pipedrive Deal ID is missing.";
      toast.error(errorMsg);
      // Set a generic error response or throw
      const errorResponse: CreateProjectResponse = { success: false, projectNumber: '', deal: {}, metadata: { dealId: '', companyId: '', isNewProject: false }, error: errorMsg };
      setCreationResult(errorResponse);
      return errorResponse;
    }
    
    if (!companyId) {
      const errorMsg = "Pipedrive Company ID is missing.";
      toast.error(errorMsg);
      const errorResponse: CreateProjectResponse = { success: false, projectNumber: '', deal: {}, metadata: { dealId: currentDealId, companyId: '', isNewProject: false }, error: errorMsg };
      setCreationResult(errorResponse);
      return errorResponse;
    }

    setIsCreating(true);
    setCreationResult(null); // Clear previous result
    const loadingToastId = toast.loading('Creating project...');

    try {
      const request: CreateProjectRequest = {
        pipedriveDealId: currentDealId,
        pipedriveCompanyId: companyId,
        existingProjectNumberToLink: params.existingProjectNumberToLink,
      };

      const responseData = await apiService.createProject(request);

      const successMsg = responseData.xero?.error
        ? `Project ${responseData.projectNumber} created, but with a Xero issue: ${responseData.xero.error}`
        : (responseData.message || `Project ${responseData.projectNumber || ''} created successfully!`);

      setCreationResult(responseData); // Store the full response

      toast.dismiss(loadingToastId);
      if (responseData.success && !responseData.xero?.error) {
        toast.success(successMsg);
      } else if (responseData.success && responseData.xero?.error) {
        toast.warning(successMsg); // Use warning if there's a partial success with Xero issues
      }
      else {
        toast.error(responseData.error || responseData.message || "Project creation failed.");
      }
      return responseData;

    } catch (e: any) {
      const errorMsg = e instanceof ApiError ? e.message : (e.message || "An unexpected error occurred during project creation.");
      const errorResponse: CreateProjectResponse = {
        success: false, 
        projectNumber: '',
        deal: {},
        metadata: { dealId: currentDealId, companyId: companyId, isNewProject: false },
        error: errorMsg
      };
      setCreationResult(errorResponse);
      toast.dismiss(loadingToastId);
      toast.error(errorMsg);
      return errorResponse;
    } finally {
      setIsCreating(false);
    }
  }, [projectContextData, dealId, companyId, toast]);

  const clearResult = () => {
    setCreationResult(null);
  };

  return {
    isCreating,
    creationResult,
    createProject,
    clearResult,
  };
}
