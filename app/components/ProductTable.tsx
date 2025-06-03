import { FetchedProductInfo } from '../types/pipedrive';
import { calculateProductFinancials, calculateProductSummary, formatCurrency } from '../utils/calculations';

interface ProductTableProps {
  products: FetchedProductInfo[];
  currency?: string;
}

/**
 * Component for displaying product details in a table format with calculations
 */
export default function ProductTable({ products, currency }: ProductTableProps) {
  if (!products || products.length === 0) {
    return (
      <p className="text-sm text-gray-500">No products associated with this deal.</p>
    );
  }

  const summary = calculateProductSummary(products);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Discount
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tax
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Line Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product, index) => {
            const calculations = calculateProductFinancials(product);
            const quantity = product.quantity ?? 0;
            const itemPrice = product.item_price ?? 0;

            return (
              <tr key={product.product_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                  {quantity}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatCurrency(itemPrice)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                  {product.discount ?? 0}{product.discount_type === 'percentage' ? '%' : ` ${currency || ''}`}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                  {product.tax ?? 0}%
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatCurrency(calculations.lineTotal, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700 uppercase">
              Subtotal
            </td>
            <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
              {formatCurrency(summary.subtotal, currency)}
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="px-4 py-2 text-right text-sm font-medium text-gray-700 uppercase">
              Total Tax
            </td>
            <td className="px-4 py-2 text-right text-sm font-medium text-gray-700">
              {formatCurrency(summary.totalTax, currency)}
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="px-4 py-2 text-right text-base font-semibold text-gray-900 uppercase">
              Total
            </td>
            <td className="px-4 py-2 text-right text-base font-semibold text-gray-900">
              {formatCurrency(summary.grandTotal, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
