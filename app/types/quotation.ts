/**
 * Type definitions for quotation data structures
 */

export interface QuotationDataResponse {
  deal: {
    id: number;
    title: string;
    value: number;
    currency?: string;
    person_id?: { value: number };
    org_id?: { value: number };
    expected_close_date?: string;
    vesselName?: string;
    salesInCharge?: string;
    location?: string;
    department?: string;
    quotationNumber?: string;
  };
  
  quotationNumber: string | null;
  
  person: {
    id: number;
    name: string;
    email?: Array<{ value: string; primary: boolean }>;
    phone?: Array<{ value: string; primary: boolean }>;
  } | null;
  
  organization: {
    id: number;
    name: string;
    address?: string;
    email?: Array<{ value: string; primary: boolean }>;
  } | null;
  
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    unit_price?: number | null;  // Make optional as it might be missing/null from backend
    sum: number;
    currency?: string;
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    // Allow for other possible field names from backend
    [key: string]: any;
  }>;
  
  xeroQuotation: {
    quoteId: string;
    quoteNumber: string;
    status: string;
    lineItems: Array<{
      Description: string;
      Quantity: number;
      UnitAmount: number;
      LineAmount: number;
      DiscountRate?: number;
      DiscountAmount?: number;
    }>;
    subTotal: number;
    totalTax: number;
    total: number;
    contact: { ContactID: string } | null;
    date: string | null;
  } | null;
  
  comparison: {
    canUpdate: boolean;
    pipedriveProductCount: number;
    xeroLineItemCount: number;
    statusWarning: string | null;
  };
  
  metadata: {
    dealId: string;
    companyId: string;
    customFieldsExtracted: string[];
    hasQuotationNumber: boolean;
    hasXeroQuotation: boolean;
    productsCount: number;
    canUpdate: boolean;
  };
}

export interface DiscountAnalysisItem {
  productIndex: number;
  productName: string;
  pipedrive: {
    baseAmount: number;
    expectedAmount: number;
    discountValue: number;
    discountType: 'percentage' | 'amount';
    totalDiscountApplied: number;
    specialPrice: number | null;
  };
  xero: {
    lineAmount: number;
    discountRate: number;
    discountAmount: number;
    totalDiscountApplied: number;
  };
  discrepancy: number;
  discountMatch: boolean;
}

export interface ProductComparison {
  mismatches: string[];
  discountAnalysis?: DiscountAnalysisItem[];
  totalDiscrepancies?: {
    pipedriveTotalBeforeDiscount: number;
    pipedriveExpectedTotal: number;
    xeroActualTotal: number;
    discountDifference: number;
  };
}

export interface ComparisonAnalysis {
  canUpdate: boolean;
  message?: string;
  newProducts?: Array<any>;
  removedItems?: Array<any>;
  changedItems?: Array<any>;
  hasChanges?: boolean;
  productComparison?: ProductComparison;
}

export interface UpdateQuoteRequest {
  dealId: string;
  companyId: string;
  quoteId?: string;
}

export interface UpdateQuoteResponse {
  success: boolean;
  message: string;
  data: {
    dealId: string;
    quoteId: string;
    originalQuoteNumber: string;
    updatedQuoteNumber: string;
    status: string;
    lineItemsUpdated: number;
    totalAmount: number;
    currency: string;
    lastUpdated: string;
    versionHistory: {
      previousVersion: string;
      currentVersion: string;
      versionIncrement: number;
    };
  };
} 