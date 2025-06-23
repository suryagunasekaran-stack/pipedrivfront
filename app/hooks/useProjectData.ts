/**
 * Custom hook for managing project creation data and state
 */
import { useState, useEffect } from 'react';
import { ProjectData, CreationResult } from '../types/pipedrive';
import { API_ENDPOINTS, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES, BACKEND_API_BASE_URL } from '../constants';
import { useToast } from './useToastNew';
import { apiCall } from '../utils/apiClient';

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
      // Use GET request to fetch project data for display
      const responseData = await apiCall(`${API_ENDPOINTS.PIPEDRIVE_CREATE_PROJECT}?dealId=${dealId}&companyId=${companyId}`);
      
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
      const responseData = await apiCall(API_ENDPOINTS.PROJECT_CREATE_FULL, {
        method: 'POST',
        body: JSON.stringify({
          pipedriveDealId: projectData.deal.id,
          pipedriveCompanyId: companyId,
        }),
      });

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

/**
 * Custom hook for fetching project invoice data
 */
export function useProjectInvoiceData(projectNumber: string | null, companyId: string | null) {
  const [projectData, setProjectData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectNumber || !companyId) {
      setError('Project number and company ID are required');
      setLoading(false);
      return;
    }

    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching project data for:', { projectNumber, companyId });

        // Fetch real project data from backend
        const response = await fetch(
          `${BACKEND_API_BASE_URL}/api/pipedrive/project-invoice-data?projectNumber=${encodeURIComponent(projectNumber)}&companyId=${encodeURIComponent(companyId)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch project data: ${response.status} ${errorText}`);
        }

        const projectData = await response.json();

        // Log incoming payload from backend
        console.log('Real Project Data Payload from Backend:', projectData);

        // Validate the data structure
        if (!projectData.projectNumber || !projectData.deals || !projectData.quotes) {
          throw new Error('Invalid project data structure received from backend');
        }

        setProjectData(projectData);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectNumber, companyId]);

  const refetch = () => {
    if (projectNumber && companyId) {
      setLoading(true);
      setError(null);
    }
  };

  return { projectData, loading, error, refetch };
}
