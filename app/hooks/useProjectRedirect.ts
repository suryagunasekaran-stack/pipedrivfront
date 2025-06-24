/**
 * Custom hook for handling project creation redirect logic
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreationResult } from '../types/pipedrive';
import { PROJECT_REDIRECT_DELAY } from '../constants';
import { generatePipedriveRedirectUrl, formatSuccessMessage } from '../utils/projectValidation';

interface UseProjectRedirectProps {
  creationResult: CreationResult | null;
  onUpdateResult: (result: CreationResult) => void;
}

/**
 * Handles automatic redirect to Pipedrive after successful project creation
 */
export function useProjectRedirect({ 
  creationResult, 
  onUpdateResult 
}: UseProjectRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (!creationResult?.success) return;

    const timer = setTimeout(() => {
      const dealId = creationResult.pipedriveDealId;
      
      console.log(`Project created successfully. Please return to Pipedrive to view deal ID: ${dealId}`);
      
      // Update the result message to indicate manual return needed
      const updatedResult: CreationResult = {
        ...creationResult,
        message: formatSuccessMessage(creationResult.projectNumber, false)
      };
      onUpdateResult(updatedResult);
    }, PROJECT_REDIRECT_DELAY);

    return () => clearTimeout(timer);
  }, [creationResult, onUpdateResult]);
}
