/**
 * Main component for the project preflight check interface
 */
// Ensure ProjectData and CreationResult types are aligned with what's passed from the page
// ProjectData here is likely PipedriveDataResponse (aliased as ProjectContextData in the hook)
// CreationResult is CreateProjectResponse
import type { PipedriveDataResponse } from '../services/api';
import type { CreateProjectResponse } from '../services/api';
import ProjectCheckItems from './ProjectCheckItems';
import ProjectCreationActions from './ProjectCreationActions';
import { validateProjectData } from '../utils/projectValidation'; // This util might need to accept PipedriveDataResponse

interface ProjectPreflightCheckProps {
  projectData: PipedriveDataResponse | null; // Updated type
  isLoading: boolean; // Loading initial data
  error: string | null; // Error loading initial data
  isCreating: boolean; // Actively creating project
  creationResult: CreateProjectResponse | null; // Updated type
  onCreateProject: (params: { existingProjectNumberToLink?: string }) => void; // Updated signature
}

/**
 * Displays the project preflight check interface with validation items and actions
 */
export default function ProjectPreflightCheck({
  projectData,
  isLoading,
  error,
  isCreating,
  creationResult,
  onCreateProject,
}: ProjectPreflightCheckProps) {
  // validateProjectData needs to be compatible with PipedriveDataResponse
  const { checkItems, allChecksPassed } = validateProjectData(projectData);
  const hasValidProjectData = !!projectData?.deal?.id;

  return (
    <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 bg-black">
        <h1 className="text-xl font-semibold text-white">Project Pre-flight Check</h1>
        <p className="text-sm text-gray-300 mt-1">
          Verifying deal information before project creation...
        </p>
      </div>
      
      <div className="p-6">
        {/* ProjectCheckItems might need projectData prop type updated too if it uses specific fields */}
        <ProjectCheckItems checkItems={checkItems} />
        
        <ProjectCreationActions
          allChecksPassed={allChecksPassed}
          isCreating={isCreating}
          isLoading={isLoading} // Pass loading state for initial data
          error={error} // Pass error state for initial data
          hasValidProjectData={hasValidProjectData}
          creationResult={creationResult}
          onCreateProject={onCreateProject} // Pass the function with updated signature
        />
      </div>
    </div>
  );
}
