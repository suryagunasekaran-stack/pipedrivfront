interface LoadingSpinnerProps {
  message?: string;
}

/**
 * Component for displaying loading state
 */
export default function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <div className="p-6 text-gray-700">{message}</div>
      </div>
    </div>
  );
}
