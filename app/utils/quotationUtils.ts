/**
 * Utility functions for quotation operations
 */

import { QuotationDataResponse, ComparisonAnalysis } from '../types/quotation';

/**
 * Analyze quotation changes between Pipedrive and Xero
 */
export function analyzeQuotationChanges(data: QuotationDataResponse): ComparisonAnalysis {
  if (!data.comparison.canUpdate) {
    return {
      canUpdate: false,
      message: data.comparison.statusWarning || 'Cannot update quote'
    };
  }
  
  const pipedriveProducts = data.products;
  const xeroLineItems = data.xeroQuotation?.lineItems || [];
  
  // Find differences
  const newProducts = pipedriveProducts.filter(product => 
    !xeroLineItems.find(item => item.Description === product.name)
  );
  
  const removedItems = xeroLineItems.filter(item => 
    !pipedriveProducts.find(product => product.name === item.Description)
  );
  
  const changedItems = pipedriveProducts.filter(product => {
    const xeroItem = xeroLineItems.find(item => item.Description === product.name);
    const productUnitPrice = getProductUnitPrice(product);
    return xeroItem && (
      xeroItem.Quantity !== product.quantity ||
      (productUnitPrice !== null && Math.abs(xeroItem.UnitAmount - productUnitPrice) > 0.01)
    );
  });
  
  return {
    canUpdate: true,
    newProducts,
    removedItems, 
    changedItems,
    hasChanges: newProducts.length > 0 || removedItems.length > 0 || changedItems.length > 0
  };
}

/**
 * Format currency with proper locale and currency symbol
 * Handles invalid/null/undefined values gracefully
 */
export function formatCurrency(amount: number | null | undefined, currency?: string): string {
  // Handle invalid values
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'N/A';
  }

  const numericAmount = Number(amount);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(numericAmount);
}

/**
 * Calculate total for products array
 */
export function calculateProductsTotal(products: Array<{ sum: number }>): number {
  return products.reduce((sum, product) => sum + product.sum, 0);
}

/**
 * Get status color class for Xero quotation status
 */
export function getXeroStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'text-yellow-600';
    case 'ACCEPTED':
      return 'text-green-600';
    case 'DECLINED':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get comparison item background color class
 */
export function getComparisonItemColor(
  itemId: number,
  newProducts?: Array<{ id: number }>,
  changedItems?: Array<{ id: number }>
): string {
  if (newProducts?.find(p => p.id === itemId)) {
    return 'bg-green-50';
  }
  if (changedItems?.find(p => p.id === itemId)) {
    return 'bg-yellow-50';
  }
  return '';
}

/**
 * Get comparison summary class based on analysis
 */
export function getComparisonSummaryClass(analysis: ComparisonAnalysis): string {
  if (!analysis.canUpdate) {
    return 'bg-red-50 border border-red-200';
  }
  if (analysis.hasChanges) {
    return 'bg-yellow-50 border border-yellow-200';
  }
  return 'bg-green-50 border border-green-200';
}

/**
 * Safely extract unit price from product data
 * Handles various backend field naming conventions
 */
export function getProductUnitPrice(product: any): number | null {
  // Try different possible field names from backend
  const possibleFields = [
    'unit_price',
    'unitPrice', 
    'item_price',
    'itemPrice',
    'price',
    'unit_amount',
    'unitAmount'
  ];
  
  for (const field of possibleFields) {
    const value = product[field];
    if (value !== null && value !== undefined && !isNaN(Number(value))) {
      return Number(value);
    }
  }
  
  // Fallback: calculate from sum and quantity if available
  if (product.sum && product.quantity && product.quantity > 0) {
    const calculated = Number(product.sum) / Number(product.quantity);
    if (!isNaN(calculated)) {
      return calculated;
    }
  }
  
  return null;
} 