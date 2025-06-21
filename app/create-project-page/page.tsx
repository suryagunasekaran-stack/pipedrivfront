/**
 * Create Project Page - Refactored with proper separation of concerns
 */
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useProjectData, useProjectCreation } from '../hooks/useProjectData';
import { useProjectRedirect } from '../hooks/useProjectRedirect';
import { useAuth } from '../hooks/useAuth';
import { usePipedriveData } from '../hooks/usePipedriveData';
import ProjectCreationMode from '../components/ProjectCreationMode';
import QuoteExistsPage from '../components/QuoteExistsPage';
import SimpleLoader from '../components/SimpleLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import { CreationResult } from '../types/pipedrive';

/**
 * Main page component for project creation workflow
 */
function CreateProjectContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');
  // Extract additional user parameters
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('userEmail');
  const userName = searchParams.get('userName');

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

  // Loading state
  if (isLoading || pipedriveLoading) {
    return <SimpleLoader />;
  }

  // Error state
  if (error || pipedriveError) {
    return (
      <ErrorDisplay
        error={error || pipedriveError || 'An error occurred'}
        onRetry={() => {
          refetch();
        }}
      />
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
  const existingProjectNumber = pipedriveData.dealDetails?.customFields?.projectNumber || 
                                pipedriveData.dealDetails?.["54326aa3421d5bf7cb2ce5a215e5ab986cc50a27"]; // Fallback for legacy

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
        userId={userId || undefined}
        userEmail={userEmail || undefined}
        userName={userName || undefined}
      />
    );
  }

  // Default view - show project creation workflow
  return (
    <div className="bg-white min-h-screen">
      <ProjectCreationMode
        projectData={projectData}
        pipedriveData={pipedriveData}
        dealId={dealId}
        companyId={companyId}
        isLoading={isLoading}
        error={error}
        isCreating={isCreating}
        creationResult={currentResult}
        onCreateProject={createProject}
      />
    </div>
  );
}

function LoadingFallback() {
  return <SimpleLoader />;
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateProjectContent />
    </Suspense>
  );
}
