import { FetchedProductInfo } from '../types/pipedrive';

/**
 * Calculates line totals and product summaries for a list of products
 */
export interface ProductCalculation {
  lineTotal: number;
  discountAmount: number;
  priceAfterDiscount: number;
  taxAmount: number;
}

/**
 * Calculates financial details for a single product
 */
export function calculateProductFinancials(product: FetchedProductInfo): ProductCalculation {
  const quantity = product.quantity ?? 0;
  const itemPrice = product.item_price ?? 0;
  
  let discountAmount = 0;
  if (product.discount_type === 'percentage') {
    discountAmount = (itemPrice * quantity) * ((product.discount ?? 0) / 100);
  } else {
    discountAmount = product.discount ?? 0;
  }
  
  const priceAfterDiscount = (itemPrice * quantity) - discountAmount;
  const taxAmount = priceAfterDiscount * ((product.tax ?? 0) / 100);
  const lineTotal = priceAfterDiscount + taxAmount;

  return {
    lineTotal,
    discountAmount,
    priceAfterDiscount,
    taxAmount
  };
}

/**
 * Calculates summary totals for all products
 */
export interface ProductSummary {
  subtotal: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateProductSummary(products: FetchedProductInfo[]): ProductSummary {
  const calculations = products.map(calculateProductFinancials);
  
  const subtotal = calculations.reduce((acc, calc) => acc + calc.priceAfterDiscount, 0);
  const totalTax = calculations.reduce((acc, calc) => acc + calc.taxAmount, 0);
  const grandTotal = calculations.reduce((acc, calc) => acc + calc.lineTotal, 0);

  return {
    subtotal,
    totalTax,
    grandTotal
  };
}

/**
 * Formats currency with appropriate decimal places
 */
export function formatCurrency(amount: number, currency?: string): string {
  return `${amount.toFixed(2)} ${currency || ''}`.trim();
}

/**
 * Extracts primary contact information from person details
 */
export function extractPrimaryContact(personDetails?: any) {
  const primaryEmail = personDetails?.email?.find((e: any) => e.primary)?.value || 
                     personDetails?.email?.[0]?.value || 'N/A';
  
  const primaryPhone = personDetails?.phone?.find((p: any) => p.primary)?.value || 
                      personDetails?.phone?.[0]?.value || 'N/A';
  
  return { primaryEmail, primaryPhone };
}
