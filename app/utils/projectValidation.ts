/**
 * Utility functions for project creation and validation
 */
import { CheckItem, ProjectData, PipedriveDealForProject } from '../types/pipedrive';

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
  const customFields = deal.customFields || {};
  
  // Helper function to get custom field value with fallback to legacy fields
  const getCustomField = (fieldName: string, legacyFieldName?: string): string | null => {
    // First check customFields object
    if (customFields[fieldName]) {
      return customFields[fieldName];
    }
    // Then check legacy field names for backward compatibility
    if (legacyFieldName && (deal as any)[legacyFieldName]) {
      return (deal as any)[legacyFieldName];
    }
    return null;
  };
  
  const checkItems: CheckItem[] = [
    {
      id: 'deal-title',
      label: 'Deal Title',
      value: deal.title,
      isValid: !!deal.title,
    },
    {
      id: 'currency',
      label: 'Currency',
      value: deal.currency,
      isValid: !!deal.currency,
    },
    {
      id: 'org-name',
      label: 'Organization',
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
      label: 'Xero Quote',
      value: projectData.xeroQuoteNumber,
      isValid: !!projectData.xeroQuoteNumber,
    },
    {
      id: 'department',
      label: 'Department',
      value: getCustomField('department', 'department'),
      isValid: !!getCustomField('department', 'department'),
    },
    {
      id: 'vessel-name',
      label: 'Vessel Name',
      value: getCustomField('vesselName', 'vessel_name'),
      isValid: !!getCustomField('vesselName', 'vessel_name'),
    },
    {
      id: 'location',
      label: 'Location',
      value: getCustomField('location', 'location'),
      isValid: !!getCustomField('location', 'location'),
    },
    {
      id: 'sales-in-charge',
      label: 'Sales In Charge',
      value: getCustomField('salesInCharge', 'sales_in_charge'),
      isValid: !!getCustomField('salesInCharge', 'sales_in_charge'),
    },
    {
      id: 'quote-number',
      label: 'Quote Number',
      value: getCustomField('quoteNumber'),
      isValid: !!getCustomField('quoteNumber'),
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
