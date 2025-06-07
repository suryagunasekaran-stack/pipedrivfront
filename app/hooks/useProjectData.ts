/**
 * Custom hook for managing project creation data and state
 */
import { useState, useEffect } from 'react';
import { ProjectData, CreationResult, PipedriveDealForProject } from '../types/pipedrive';
import { ERROR_MESSAGES } from '../constants';
import { useToast } from './useToastNew';
import { apiService } from '../services/api';

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
      // Use the new API service to fetch Pipedrive data for project creation
      const responseData = await apiService.getPipedriveData(companyId, dealId);
      
      // Transform the response to match ProjectData interface
      const transformedDeal: PipedriveDealForProject = {
        id: responseData.deal.id,
        title: responseData.deal.title,
        org_name: responseData.deal.org_id?.name || responseData.organization?.name,
        organization: responseData.organization,
        person_name: responseData.deal.person_id?.name || responseData.person?.name,
        person: responseData.person,
        department: responseData.deal.department,
        org_id: responseData.deal.org_id,
        person_id: responseData.deal.person_id,
        vessel_name: responseData.deal.vessel_name,
        location: responseData.deal.location,
        sales_in_charge: responseData.deal.sales_in_charge,
      };
      
      const transformedData: ProjectData = {
        message: 'Project data loaded successfully',
        deal: transformedDeal,
        xeroQuoteNumber: responseData.deal.xero_quote_number || null,
      };
      
      setProjectData(transformedData);
      toast.success('Project data loaded successfully');
    } catch (e: any) {
      console.error('Failed to fetch project data:', e);
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
      // Use the new API service to create the project
      const responseData = await apiService.createProject({
        pipedriveDealId: String(projectData.deal.id),
        pipedriveCompanyId: companyId,
        existingProjectNumberToLink: projectData.xeroQuoteNumber || undefined,
      });

      const successMsg = `Project ${responseData.projectNumber || ''} created successfully! Redirecting...`;
      setCreationResult({
        success: true,
        message: successMsg,
        projectNumber: responseData.projectNumber,
        pipedriveDealId: responseData.metadata?.dealId || String(projectData.deal.id),
      });
      toast.dismiss(loadingToastId);
      toast.success(successMsg);

    } catch (e: any) {
      console.error('Failed to create project:', e);
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
