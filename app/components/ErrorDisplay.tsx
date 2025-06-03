interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

/**
 * Component for displaying error states with optional retry functionality
 */
export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow text-center">
      <div className="mb-4 text-lg font-semibold text-black">Error</div>
      <div className="mb-4 text-black">{error}</div>
      <button
        onClick={onRetry}
        className="inline-block px-4 py-2 bg-black text-white rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
      >
        Retry
      </button>
    </div>
  );
}
