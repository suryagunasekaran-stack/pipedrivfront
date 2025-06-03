/**
 * Main component for the project preflight check interface
 */
import { ProjectData, CreationResult } from '../types/pipedrive';
import ProjectCheckItems from './ProjectCheckItems';
import ProjectCreationActions from './ProjectCreationActions';
import { validateProjectData } from '../utils/projectValidation';

interface ProjectPreflightCheckProps {
  projectData: ProjectData | null;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  creationResult: CreationResult | null;
  onCreateProject: () => void;
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
        <ProjectCheckItems checkItems={checkItems} />
        
        <ProjectCreationActions
          allChecksPassed={allChecksPassed}
          isCreating={isCreating}
          isLoading={isLoading}
          error={error}
          hasValidProjectData={hasValidProjectData}
          creationResult={creationResult}
          onCreateProject={onCreateProject}
        />
      </div>
    </div>
  );
}
