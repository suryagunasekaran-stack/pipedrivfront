/**
 * Create Project Page - Refactored with proper separation of concerns
 */
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useProjectData, useProjectCreation } from '../hooks/useProjectData';
import { useProjectRedirect } from '../hooks/useProjectRedirect';
import { useAuth } from '../hooks/useAuth';
import { usePipedriveData } from '../hooks/usePipedriveData';
import ProjectPreflightCheck from '../components/ProjectPreflightCheck';
import QuoteExistsPage from '../components/QuoteExistsPage';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { CreationResult } from '../types/pipedrive';

/**
 * Main page component for project creation workflow
 */
export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');

  // Authentication handling
  const { checkAuth, handleAuthRedirect, isCheckingAuth } = useAuth();

  // Fetch Pipedrive data to check for existing project
  const { data: pipedriveData, loading: pipedriveLoading, error: pipedriveError } = usePipedriveData(dealId, companyId);

  // Data fetching for project creation
  const { projectData, isLoading, error, refetch } = useProjectData({ dealId, companyId });

  // Project creation
  const { isCreating, creationResult, createProject, clearResult } = useProjectCreation({
    projectData,
    dealId,
    companyId,
  });

  // Result state for redirect handling
  const [currentResult, setCurrentResult] = useState<CreationResult | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authResponse = await checkAuth(companyId || undefined);
        if (!authResponse.authenticated) {
          handleAuthRedirect(authResponse);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      }
    };

    verifyAuth();
  }, [checkAuth, handleAuthRedirect, companyId]);

  // Update current result when creation result changes
  useEffect(() => {
    if (creationResult) {
      setCurrentResult(creationResult);
    }
  }, [creationResult]);

  // Handle redirect after successful creation
  useProjectRedirect({
    creationResult: currentResult,
    onUpdateResult: setCurrentResult,
  });

  // Loading state (including auth check)
  if (isLoading || isCheckingAuth || pipedriveLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <LoadingSpinner message={
          isCheckingAuth ? "Checking authentication..." : 
          pipedriveLoading ? "Loading deal data..." :
          "Loading project data..."
        } />
      </div>
    );
  }

  // Error state
  if (error || pipedriveError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <ErrorDisplay
          error={error || pipedriveError || 'An error occurred'}
        />
      </div>
    );
  }

  // No data state
  if (!projectData || !pipedriveData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="p-6 text-black">No project data found.</div>
      </div>
    );
  }

  // Check if project already exists from the deal's custom field
  // Using specific custom field hash - TODO: implement company-specific mapping
  const existingProjectNumber = pipedriveData.dealDetails?.["54326aa3421d5bf7cb2ce5a215e5ab986cc50a27"];

  // Console log to see the actual data structure
  console.log('Project Page - Deal Details:', pipedriveData.dealDetails);
  console.log('Project Number:', existingProjectNumber);

  // If project exists, show the project page
  if (existingProjectNumber) {
    return (
      <QuoteExistsPage
        type="project"
        number={existingProjectNumber}
        dealId={dealId}
        companyId={companyId}
        dealTitle={pipedriveData.dealDetails?.title}
        organizationName={pipedriveData.organizationDetails?.name}
      />
    );
  }

  // Default view - show project creation workflow
  return (
    <div className="min-h-screen bg-white py-8 px-4 flex flex-col items-center">
      <ProjectPreflightCheck
        projectData={projectData}
        isLoading={isLoading}
        error={error}
        isCreating={isCreating}
        creationResult={currentResult}
        onCreateProject={createProject}
      />
    </div>
  );
}
