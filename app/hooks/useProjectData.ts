/**
 * Custom hook for managing project creation data and state
 */
import { useState, useEffect } from 'react';
import { ProjectData, CreationResult } from '../types/pipedrive';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '../constants';
import { useToast } from './useToastNew';

interface UseProjectDataProps {
  dealId: string | null;
  companyId: string | null;
}

interface UseProjectDataReturn {
  projectData: ProjectData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProjectData({ dealId, companyId }: UseProjectDataProps): UseProjectDataReturn {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchProjectData = async () => {
    if (!dealId || !companyId) {
      const errorMsg = ERROR_MESSAGES.MISSING_PROJECT_PARAMS;
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(EXTERNAL_API_ENDPOINTS.PROJECT_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dealId, companyId }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      
      setProjectData(responseData);
      toast.success('Project data loaded successfully');
    } catch (e: any) {
      const errorMsg = e.message || 'Failed to fetch project data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [dealId, companyId]);

  return {
    projectData,
    isLoading,
    error,
    refetch: fetchProjectData,
  };
}

interface UseProjectCreationProps {
  projectData: ProjectData | null;
  dealId: string | null;
  companyId: string | null;
}

interface UseProjectCreationReturn {
  isCreating: boolean;
  creationResult: CreationResult | null;
  createProject: () => Promise<void>;
  clearResult: () => void;
}

export function useProjectCreation({ 
  projectData, 
  dealId, 
  companyId 
}: UseProjectCreationProps): UseProjectCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<CreationResult | null>(null);
  const toast = useToast();

  const createProject = async () => {
    if (!projectData?.deal?.id || !dealId) {
      const errorMsg = "Pipedrive Deal ID is missing.";
      setCreationResult({ 
        success: false, 
        message: errorMsg 
      });
      toast.error(errorMsg);
      return;
    }
    
    if (!companyId) {
      const errorMsg = "Pipedrive Company ID is missing from URL.";
      setCreationResult({ 
        success: false, 
        message: errorMsg 
      });
      toast.error(errorMsg);
      return;
    }

    setIsCreating(true);
    setCreationResult(null);
    
    const loadingToastId = toast.loading('Creating project...');

    try {
      const response = await fetch(EXTERNAL_API_ENDPOINTS.PROJECT_CREATE_FULL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: projectData.deal.id,
          companyId: companyId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || ERROR_MESSAGES.PROJECT_CREATION_ERROR);
      }

      const successMsg = responseData.message || `Project ${responseData.projectNumber || ''} created successfully! Redirecting...`;
      setCreationResult({
        success: true,
        message: successMsg,
        projectNumber: responseData.projectNumber,
        pipedriveDealId: responseData.pipedriveDealId || responseData.dealId || String(projectData.deal.id),
      });
      toast.dismiss(loadingToastId);
      toast.success(successMsg);

    } catch (e: any) {
      const errorMsg = e.message || "An unexpected error occurred.";
      setCreationResult({ 
        success: false, 
        message: errorMsg 
      });
      toast.dismiss(loadingToastId);
      toast.error(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

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
