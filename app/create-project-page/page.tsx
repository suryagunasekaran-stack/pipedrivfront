'use client';

import { useSearchParams, useRouter } from 'next/navigation'; // Import useRouter
import { useEffect, useState } from 'react';
import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// Define an interface for the Pipedrive deal structure within ProjectData
interface PipedriveDealForProject {
  org_name: any;
  organization: any;
  person_name: any;
  person: any;
  id?: number; // Used for pipedriveDealId
  title?: string;
  department?: string;
  org_id?: { name?: string };
  person_id?: { name?: string };
  vessel_name?: string; 
  location?: string;    
  sales_in_charge?: string; 
  // Consider adding creator_user_id if needed for domain, though env var is preferred
  // creator_user_id?: { company_domain?: string }; 
}

// Updated interface for the expected API response structure
interface ProjectData {
  message: string;
  deal: PipedriveDealForProject;
  xeroQuoteNumber: string | null; // Used for xeroQuoteNumber
}

interface CheckItem {
  label: string;
  value: string | undefined | null;
  isValid: boolean;
  id: string; 
}

interface CreationResult {
  success: boolean;
  message: string;
  projectNumber?: string;
  pipedriveDealId?: string;
}

export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter
  const dealIdFromQuery = searchParams.get('dealId'); // Renamed to avoid conflict if deal.id is used
  const companyId = searchParams.get('companyId');

  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const [error, setError] = useState<string | null>(null); // For initial data load error
  
  const [checkItems, setCheckItems] = useState<CheckItem[]>([]);
  const [allChecksPassed, setAllChecksPassed] = useState(false);

  // State for project creation
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creationResult, setCreationResult] = useState<CreationResult | null>(null);

  useEffect(() => {
    if (dealIdFromQuery && companyId) {
      const fetchProjectData = async () => {
        setIsLoading(true);
        setError(null);
        setCheckItems([]); 
        setCreationResult(null); // Clear previous creation results
        try {
          const response = await fetch('http://localhost:3000/api/pipedrive/create-project', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dealId: dealIdFromQuery, companyId }), // Use dealIdFromQuery
          });

          const responseData = await response.json();
          if (!response.ok) {
            throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
          }
          setProjectData(responseData);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjectData();
    } else {
      setError('Deal ID or Company ID is missing from URL parameters.');
      setIsLoading(false);
    }
  }, [dealIdFromQuery, companyId]); // Use dealIdFromQuery

  useEffect(() => {
    if (projectData?.deal) {
      console.log('Project Data:', projectData); 
      const items: CheckItem[] = [
        {
          id: 'deal-title',
          label: "Pipedrive Deal Title",
          value: projectData.deal.title,
          isValid: !!projectData.deal.title,
        },
        {
          id: 'org-name',
          label: "Organization Name",
          value: projectData.deal.org_id?.name || projectData.deal.organization?.name || projectData.deal.org_name,
          isValid: !!(projectData.deal.org_id?.name || projectData.deal.organization?.name || projectData.deal.org_name),
        },
        {
          id: 'contact-person',
          label: "Contact Person",
          value: projectData.deal.person_id?.name || projectData.deal.person?.name || projectData.deal.person_name,
          isValid: !!(projectData.deal.person_id?.name || projectData.deal.person?.name || projectData.deal.person_name),
        },
        {
          id: 'xero-quote',
          label: "Xero Quote Number",
          value: projectData.xeroQuoteNumber,
          isValid: !!projectData.xeroQuoteNumber,
        },
        {
          id: 'department',
          label: "Department",
          value: projectData.deal.department,
          isValid: !!projectData.deal.department,
        },
        {
          id: 'vessel-name',
          label: "Vessel Name",
          value: projectData.deal.vessel_name,
          isValid: !!projectData.deal.vessel_name,
        },
        {
          id: 'location',
          label: "Location",
          value: projectData.deal.location,
          isValid: !!projectData.deal.location,
        },
        {
          id: 'sales-in-charge',
          label: "Sales In Charge",
          value: projectData.deal.sales_in_charge,
          isValid: !!projectData.deal.sales_in_charge,
        },
      ];
      setCheckItems(items);
      setAllChecksPassed(items.every(item => item.isValid));
    }
  }, [projectData]);

  const handleCreateProject = async () => {
    // Ensure companyId is available from the component's scope
    if (!projectData?.deal?.id || !dealIdFromQuery) { 
      setCreationResult({ success: false, message: "Pipedrive Deal ID is missing." });
      return;
    }
    if (!companyId) { // Check for companyId
      setCreationResult({ success: false, message: "Pipedrive Company ID is missing." });
      return;
    }
    // xeroQuoteNumber can be null, so we might not need a hard check here unless backend strictly requires it (not just non-empty)

    setIsCreatingProject(true);
    setCreationResult(null);

    const dealIdToSend = projectData.deal.id;
    const quoteNumberToSend = projectData.xeroQuoteNumber;
    const companyIdToSend = companyId; // companyId from useSearchParams

    console.log('pipedriveDealId:', dealIdToSend);

    try {
      const response = await fetch('http://localhost:3000/api/project/create-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipedriveDealId: dealIdToSend,
          xeroQuoteNumber: quoteNumberToSend,
          pipedriveCompanyId: companyIdToSend, // Added pipedriveCompanyId
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "Failed to create project.");
      }

      setCreationResult({
        success: true,
        message: responseData.message || `Project ${responseData.projectNumber || ''} created successfully! Redirecting...`,
        projectNumber: responseData.projectNumber,
        pipedriveDealId: responseData.pipedriveDealId || String(projectData.deal.id),
      });

      // Redirect after a short delay
      setTimeout(() => {
        const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN;
        const dealIdToRedirect = responseData.pipedriveDealId || projectData.deal?.id;

        if (pipedriveDomain && dealIdToRedirect) {
          router.push(`https://${pipedriveDomain}/deal/${dealIdToRedirect}`);
        } else {
          console.log(`Project created successfully. Pipedrive domain or deal ID missing for redirect. Please return to Pipedrive to view deal ID: ${dealIdToRedirect}`);
          // Optionally, keep the success message on page if redirect fails
           setCreationResult(prev => prev ? {...prev, message: prev.message.replace(' Redirecting...', ' Please return to Pipedrive.')} : null);
        }
      }, 3000); // 3-second delay

    } catch (e: any) {
      setCreationResult({ success: false, message: e.message || "An unexpected error occurred." });
    } finally {
      // Do not set isCreatingProject to false immediately if redirecting, 
      // let the redirect happen or the message stay.
      // If no redirect, or redirect fails, user might want to see the button enabled again.
      // For now, let's keep it disabled on success to prevent re-clicks during redirect.
      // If error, enable it.
      if (!(creationResult && creationResult.success)) { // only set to false if not successful
         // setIsCreatingProject(false); // Re-evaluate if this should be set to false on error, or let user refresh
      }
       // Correction: always set isCreatingProject to false in finally, unless redirect is guaranteed and immediate
       setIsCreatingProject(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FEF3EC]">
        <div className="p-6 text-gray-700">Loading project data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FEF3EC]">
        <div className="p-6 text-red-600 text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#FEF3EC]">
        <div className="p-6 text-gray-700">No project data found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF3EC] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[#F1FFFA] shadow-xl rounded-lg overflow-hidden">
        <div className="px-6 py-5 bg-[#00916E]">
          <h1 className="text-xl font-semibold text-white">Project Pre-flight Check</h1>
          <p className="text-sm text-white mt-1">
            Verifying deal information before project creation...
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-1 mb-6">
            {checkItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-start py-3 border-b border-gray-200 last:border-b-0"
              >
                <div className="shrink-0 mt-1 mr-3 w-6 h-6 flex items-center justify-center">
                  {item.isValid ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div className="flex-grow">
                  <span className="font-medium text-[#1F1300]">{item.label}:</span>
                  <span className={`ml-1 ${item.value ? 'text-[#1F1300]' : 'text-[#1F1300] italic opacity-75'}`}>
                    {item.value || 'Not specified'}
                  </span>
                  {!item.isValid && <span className="text-xs text-red-500 ml-2">(Required)</span>}
                </div>
              </div>
            ))}
          </div>

          {projectData && ( // Main condition to show button or warning
            allChecksPassed ? (
              <button 
                onClick={handleCreateProject}
                disabled={isLoading || !!error || isCreatingProject || !projectData?.deal?.id} // Disable conditions
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingProject ? 'Creating Project...' : 'Confirm & Create Project'}
              </button>
            ) : (
              <div className="mt-6 text-sm text-yellow-700 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                <p>Please ensure all required Pipedrive deal information (marked as required) is complete in Pipedrive and refresh this page to enable project creation.</p>
              </div>
            )
          )}

          {creationResult && (
            <div className={`mt-4 p-3 rounded text-center ${creationResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {creationResult.message}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
