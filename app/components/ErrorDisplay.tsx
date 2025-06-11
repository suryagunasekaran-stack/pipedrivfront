'use client';

import { useRouter } from 'next/navigation';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

/**
 * Component for displaying error states
 */
export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow text-center">
      <div className="mb-4 text-lg font-semibold text-black">Error</div>
      <div className="text-black">{error}</div>
    </div>
  );
}
