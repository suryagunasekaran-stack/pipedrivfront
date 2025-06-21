/**
 * Component for displaying project validation check items
 */
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { CheckItem } from '../types/pipedrive';

interface ProjectCheckItemsProps {
  checkItems: CheckItem[];
}

/**
 * Displays a list of validation check items with pass/fail status
 */
export default function ProjectCheckItems({ checkItems }: ProjectCheckItemsProps) {
  if (checkItems.length === 0) {
    return (
      <p className="px-4 py-8 text-sm text-gray-500 text-center">
        No validation items to display
      </p>
    );
  }

  // Define which fields are required
  const requiredFieldIds = ['department', 'vessel-name', 'location', 'sales-in-charge'];

  return (
    <dl className="divide-y divide-gray-100">
      {checkItems.map((item) => {
        const isRequired = requiredFieldIds.includes(item.id);
        return (
          <div key={item.id} className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm/6 font-medium text-gray-900 flex items-center">
              <span className="mr-2">
                {item.isValid ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                )}
              </span>
              {item.label}
              {isRequired && !item.isValid && (
                <span className="ml-2 text-xs text-red-600">(Required)</span>
              )}
            </dt>
            <dd className={`mt-1 text-sm/6 sm:col-span-2 sm:mt-0 ${
              item.value 
                ? 'text-gray-700' 
                : 'text-gray-400 italic'
            }`}>
              {item.value || 'Not specified'}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
