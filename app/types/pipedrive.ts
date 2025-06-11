/**
 * Type definitions for Pipedrive data structures
 */

export interface FetchedDealDetails {
  id?: number;
  title?: string;
  add_time?: string; // Issue date
  expected_close_date?: string | null; // Expiry date
  currency?: string;
  quotation_number?: string; // Custom field for Quotation Number (deprecated - use hash field)
  // Custom field for Quotation Number - this hash is company-specific
  // TODO: Future implementation should map company-specific field IDs
  "5016d4ba7c51895eef88fadadff9ddd1301da89e"?: string;
  // Custom field for Project Number - this hash is company-specific
  // TODO: Future implementation should map company-specific field IDs
  "54326aa3421d5bf7cb2ce5a215e5ab986cc50a27"?: string;
}

export interface FetchedProductInfo {
  product_id?: number;
  name?: string;
  quantity?: number;
  item_price?: number;
  discount?: number;
  discount_type?: string;
  tax?: number;
  tax_method?: string;
}

export interface FetchedOrganizationDetails {
  id?: number;
  name?: string; // Used for org_name
}

export interface EmailEntry {
  value: string;
  primary?: boolean;
  label?: string;
}

export interface PhoneEntry {
  value: string;
  primary?: boolean;
  label?: string;
}

export interface FetchedPersonDetails {
  id?: number;
  name?: string; // Used for person_name
  email?: EmailEntry[];
  phone?: PhoneEntry[];
}

export interface FetchedPipedriveData {
  dealDetails?: FetchedDealDetails;
  dealProducts?: FetchedProductInfo[];
  organizationDetails?: FetchedOrganizationDetails;
  personDetails?: FetchedPersonDetails;
}

export interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface XeroStatus {
  isConnected: boolean;
  error?: string;
}

export interface XeroQuoteResponse {
  message: string;
  quoteNumber?: string;
  error?: string;
}

// Project creation types
export interface PipedriveDealForProject {
  org_name: any;
  organization: any;
  person_name: any;
  person: any;
  id?: number;
  title?: string;
  department?: string;
  org_id?: { name?: string };
  person_id?: { name?: string };
  vessel_name?: string;
  location?: string;
  sales_in_charge?: string;
}

export interface ProjectData {
  message: string;
  deal: PipedriveDealForProject;
  xeroQuoteNumber: string | null;
}

export interface CheckItem {
  label: string;
  value: string | undefined | null;
  isValid: boolean;
  id: string;
}

export interface CreationResult {
  success: boolean;
  message: string;
  projectNumber?: string;
  pipedriveDealId?: string;
}
