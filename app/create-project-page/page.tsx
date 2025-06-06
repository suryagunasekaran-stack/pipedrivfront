/**
 * Create Project Page - Refactored with proper separation of concerns
 */
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react'; // Added Suspense
import { useProjectData, useProjectCreation } from '../hooks/useProjectData';
import { useProjectRedirect } from '../hooks/useProjectRedirect';
// import { useAuth } from '../hooks/useAuth'; // REMOVE - Replaced by ProtectedRoute
import ProjectPreflightCheck from '../components/ProjectPreflightCheck';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { CreationResult } from '../types/pipedrive';
import { ProtectedRoute } from '../components/ProtectedRoute'; // IMPORT ProtectedRoute
import { useAuthStore } from '../store/authStore'; // Import useAuthStore for companyId
import SimpleLoader from '../components/SimpleLoader'; // For Suspense fallback

function CreateProjectPageContent() {
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyIdFromUrl = searchParams.get('companyId'); // From URL

  const storeCompanyId = useAuthStore((state) => state.companyId);
  // Prioritize companyId from the store, as ProtectedRoute should ensure it's set.
  const effectiveCompanyId = storeCompanyId || companyIdFromUrl;

  // Data fetching
  const { projectData, isLoading, error, refetch } = useProjectData({ dealId, companyId: effectiveCompanyId });

  // Project creation
  const { isCreating, creationResult, createProject, clearResult } = useProjectCreation({
    projectData,
    dealId,
    companyId: effectiveCompanyId,
  });

  // Result state for redirect handling
  const [currentResult, setCurrentResult] = useState<CreationResult | null>(null);

  // Old auth check useEffect is removed.

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

  // Loading state for data fetching (auth check loading handled by ProtectedRoute)
  if (isLoading) { // isCheckingAuth part is removed as ProtectedRoute handles it
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <LoadingSpinner message={"Loading project data..."} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <ErrorDisplay
          error={error} // Make sure error is a string or Error object
          onRetry={refetch}
        />
      </div>
    );
  }

  // No data state
  if (!projectData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="p-6 text-black">No project data found. Ensure Pipedrive and Xero are connected and the deal has valid data.</div>
      </div>
    );
  }

  // Ensure dealId and effectiveCompanyId are available
  if (!dealId || !effectiveCompanyId) {
    return (
         <div className="flex justify-center items-center min-h-screen bg-white">
            <ErrorDisplay error="Deal ID or Company ID is missing. Please check the URL or ensure you are properly authenticated." />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 flex flex-col items-center">
      <ProjectPreflightCheck
        projectData={projectData}
        isLoading={isLoading} // This is data loading, not auth loading
        error={error}
        isCreating={isCreating}
        creationResult={currentResult}
        onCreateProject={createProject}
      />
    </div>
  );
}

/**
 * Main page component for project creation workflow.
 * Protected by authentication (Pipedrive and Xero).
 */
export default function CreateProjectPage() {
  return (
    <Suspense fallback={<SimpleLoader message="Loading page..." />}> {/* Suspense for useSearchParams */}
      <ProtectedRoute requireXero={true}> {/* Xero connection is required for creating projects */}
        <CreateProjectPageContent />
      </ProtectedRoute>
    </Suspense>
  );
}
