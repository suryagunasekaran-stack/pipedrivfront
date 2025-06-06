/**
 * Component for project creation actions and status display
 */
import { useState } from 'react'; // Import useState
import { CreationResult } from '../types/pipedrive'; // This might need to be CreateProjectResponse from api.ts

// Adjust CreationResult if it's different from CreateProjectResponse from api.ts
// For now, assuming it's compatible enough for 'message' and 'success' fields.
// Ideally, use CreateProjectResponse from '../services/api' if it matches the structure.
import type { CreateProjectResponse } from '../services/api';


interface ProjectCreationActionsProps {
  allChecksPassed: boolean;
  isCreating: boolean;
  isLoading: boolean; // Loading project context data, not creation loading
  error: string | null; // Error fetching project context data
  hasValidProjectData: boolean;
  creationResult: CreateProjectResponse | null; // Updated type
  onCreateProject: (params: { existingProjectNumberToLink?: string }) => void; // Updated signature
}

/**
 * Displays project creation button or validation warning, plus creation results
 */
export default function ProjectCreationActions({
  allChecksPassed,
  isCreating, // This is for the creation process itself
  isLoading,  // This is for loading the initial deal data
  error,
  hasValidProjectData,
  creationResult,
  onCreateProject,
}: ProjectCreationActionsProps) {
  const [existingProjectNumber, setExistingProjectNumber] = useState('');

  // Button should be disabled if still loading initial data, if there was an error loading data,
  // if creation is in progress, or if basic data isn't valid (e.g. no dealId)
  const isButtonDisabled = isLoading || !!error || isCreating || !hasValidProjectData;

  const handleSubmit = () => {
    onCreateProject({ existingProjectNumberToLink: existingProjectNumber || undefined });
  };

  return (
    <div className="space-y-4 pt-4">
      {hasValidProjectData && (
        <>
          <div className="mb-4">
            <label htmlFor="existingProjectNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Link to Existing Project Number (Optional)
            </label>
            <input
              type="text"
              name="existingProjectNumber"
              id="existingProjectNumber"
              value={existingProjectNumber}
              onChange={(e) => setExistingProjectNumber(e.target.value)}
              placeholder="e.g., P001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
              disabled={isButtonDisabled || !allChecksPassed}
            />
          </div>

          {allChecksPassed ? (
            <button 
              onClick={handleSubmit}
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
        <div className={`mt-4 p-3 rounded text-center ${
          creationResult.success && !creationResult.xero?.error
            ? 'bg-green-50 text-green-700'
            : creationResult.success && creationResult.xero?.error
            ? 'bg-yellow-50 text-yellow-700'
            : 'bg-red-50 text-red-700' // Error
        }`}>
          <p className="font-medium">Status: {creationResult.success ? 'Success' : 'Failed'}</p>
          <p>{creationResult.message || creationResult.error || (creationResult.success ? 'Project action completed.' : 'An error occurred.')}</p>
          {creationResult.projectNumber && <p>Project Number: {creationResult.projectNumber}</p>}
          {creationResult.xero?.error && <p>Xero Info: {creationResult.xero.error}</p>}
        </div>
      )}
    </div>
  );
}
