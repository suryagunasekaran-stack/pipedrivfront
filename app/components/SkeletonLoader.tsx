/**
 * Skeleton loader component for content placeholders
 */

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'profile' | 'custom';
  lines?: number;
  className?: string;
  animate?: boolean;
}

export default function SkeletonLoader({ 
  variant = 'card', 
  lines = 3, 
  className = '',
  animate = true 
}: SkeletonLoaderProps) {
  const baseClasses = animate 
    ? 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse' 
    : 'bg-gray-200';

  const renderCard = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <div className={`h-6 ${baseClasses} rounded-md w-3/4`} />
        <div className={`h-4 ${baseClasses} rounded w-1/2`} />
      </div>
      
      {/* Content lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={`h-4 ${baseClasses} rounded`}
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
      
      {/* Action area */}
      <div className="flex space-x-2 pt-2">
        <div className={`h-8 w-20 ${baseClasses} rounded`} />
        <div className={`h-8 w-16 ${baseClasses} rounded`} />
      </div>
    </div>
  );

  const renderList = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className={`h-10 w-10 ${baseClasses} rounded-full`} />
          <div className="flex-1 space-y-1">
            <div className={`h-4 ${baseClasses} rounded w-3/4`} />
            <div className={`h-3 ${baseClasses} rounded w-1/2`} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className={`space-y-2 ${className}`}>
      {/* Table header */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-4 ${baseClasses} rounded w-full`} />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className={`h-6 ${baseClasses} rounded`} />
          ))}
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Profile header */}
      <div className="flex items-center space-x-4">
        <div className={`h-16 w-16 ${baseClasses} rounded-full`} />
        <div className="space-y-2 flex-1">
          <div className={`h-5 ${baseClasses} rounded w-1/3`} />
          <div className={`h-4 ${baseClasses} rounded w-1/2`} />
        </div>
      </div>
      
      {/* Profile details */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className={`h-4 ${baseClasses} rounded w-1/4`} />
            <div className={`h-4 ${baseClasses} rounded w-1/3`} />
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustom = () => (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={`h-4 ${baseClasses} rounded`}
          style={{ width: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  );

  const variants = {
    card: renderCard,
    list: renderList,
    table: renderTable,
    profile: renderProfile,
    custom: renderCustom,
  };

  return (
    <div className="animate-pulse">
      {variants[variant]()}
    </div>
  );
} 