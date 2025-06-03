/**
 * Utility functions for project creation and validation
 */
import { CheckItem, ProjectData, PipedriveDealForProject } from '../types/pipedrive';
import { PROJECT_CHECK_ITEMS } from '../constants';

/**
 * Validates project data and generates check items
 */
export function validateProjectData(projectData: ProjectData | null): {
  checkItems: CheckItem[];
  allChecksPassed: boolean;
} {
  if (!projectData?.deal) {
    return {
      checkItems: [],
      allChecksPassed: false,
    };
  }

  const deal = projectData.deal;
  
  const checkItems: CheckItem[] = [
    {
      id: 'deal-title',
      label: 'Pipedrive Deal Title',
      value: deal.title,
      isValid: !!deal.title,
    },
    {
      id: 'org-name',
      label: 'Organization Name',
      value: getOrganizationName(deal),
      isValid: !!getOrganizationName(deal),
    },
    {
      id: 'contact-person',
      label: 'Contact Person',
      value: getContactPersonName(deal),
      isValid: !!getContactPersonName(deal),
    },
    {
      id: 'xero-quote',
      label: 'Xero Quote Number',
      value: projectData.xeroQuoteNumber,
      isValid: !!projectData.xeroQuoteNumber,
    },
    {
      id: 'department',
      label: 'Department',
      value: deal.department,
      isValid: !!deal.department,
    },
    {
      id: 'vessel-name',
      label: 'Vessel Name',
      value: deal.vessel_name,
      isValid: !!deal.vessel_name,
    },
    {
      id: 'location',
      label: 'Location',
      value: deal.location,
      isValid: !!deal.location,
    },
    {
      id: 'sales-in-charge',
      label: 'Sales In Charge',
      value: deal.sales_in_charge,
      isValid: !!deal.sales_in_charge,
    },
  ];

  const allChecksPassed = checkItems.every(item => item.isValid);

  return {
    checkItems,
    allChecksPassed,
  };
}

/**
 * Extracts organization name from various possible fields
 */
export function getOrganizationName(deal: PipedriveDealForProject): string | null {
  return deal.org_id?.name || 
         deal.organization?.name || 
         deal.org_name || 
         null;
}

/**
 * Extracts contact person name from various possible fields
 */
export function getContactPersonName(deal: PipedriveDealForProject): string | null {
  return deal.person_id?.name || 
         deal.person?.name || 
         deal.person_name || 
         null;
}

/**
 * Generates redirect URL for Pipedrive deal
 */
export function generatePipedriveRedirectUrl(
  pipedriveDomain: string | undefined,
  dealId: string | number | undefined
): string | null {
  if (!pipedriveDomain || !dealId) {
    return null;
  }
  
  return `https://${pipedriveDomain}/deal/${dealId}`;
}

/**
 * Gets missing fields for project creation
 */
export function getMissingFields(checkItems: CheckItem[]): string[] {
  return checkItems
    .filter(item => !item.isValid)
    .map(item => item.label);
}

/**
 * Formats project creation success message
 */
export function formatSuccessMessage(
  projectNumber?: string,
  isRedirecting: boolean = true
): string {
  const baseMessage = projectNumber 
    ? `Project ${projectNumber} created successfully!`
    : 'Project created successfully!';
    
  return isRedirecting 
    ? `${baseMessage} Redirecting...`
    : `${baseMessage} Please return to Pipedrive.`;
}
