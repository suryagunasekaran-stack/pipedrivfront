/**
 * Create Project Page - Refactored with proper separation of concerns
 */
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useProjectData, useProjectCreation } from '../hooks/useProjectData';
import { useProjectRedirect } from '../hooks/useProjectRedirect';
import ProjectPreflightCheck from '../components/ProjectPreflightCheck';
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

  // Data fetching
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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FEF3EC]">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FEF3EC]">
        <ErrorDisplay
          error={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  // No data state
  if (!projectData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FEF3EC]">
        <div className="p-6 text-gray-700">No project data found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF3EC] py-8 px-4 flex flex-col items-center">
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
