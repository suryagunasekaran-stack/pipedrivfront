/**
 * Component for project creation actions and status display
 */
import { CreationResult } from '../types/pipedrive';

interface ProjectCreationActionsProps {
  allChecksPassed: boolean;
  isCreating: boolean;
  isLoading: boolean;
  error: string | null;
  hasValidProjectData: boolean;
  creationResult: CreationResult | null;
  onCreateProject: () => void;
}

/**
 * Displays project creation button or validation warning, plus creation results
 */
export default function ProjectCreationActions({
  allChecksPassed,
  isCreating,
  isLoading,
  error,
  hasValidProjectData,
  creationResult,
  onCreateProject,
}: ProjectCreationActionsProps) {
  const isButtonDisabled = isLoading || !!error || isCreating || !hasValidProjectData;

  return (
    <div className="space-y-4">
      {hasValidProjectData && (
        <>
          {allChecksPassed ? (
            <button 
              onClick={onCreateProject}
              disabled={isButtonDisabled}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating Project...' : 'Confirm & Create Project'}
            </button>
          ) : (
            <div className="text-sm text-gray-700 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
              <p>
                Please ensure all required Pipedrive deal information (marked as required) 
                is complete in Pipedrive and refresh this page to enable project creation.
              </p>
            </div>
          )}
        </>
      )}

      {creationResult && (
        <div className={`p-3 rounded text-center ${
          creationResult.success 
            ? 'bg-gray-100 text-gray-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {creationResult.message}
        </div>
      )}
    </div>
  );
}
