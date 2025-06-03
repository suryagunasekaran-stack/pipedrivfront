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
      <div className="text-center text-gray-500 py-8">
        No validation items to display
      </div>
    );
  }

  return (
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
            <span className={`ml-1 ${
              item.value 
                ? 'text-[#1F1300]' 
                : 'text-[#1F1300] italic opacity-75'
            }`}>
              {item.value || 'Not specified'}
            </span>
            {!item.isValid && (
              <span className="text-xs text-red-500 ml-2">(Required)</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
