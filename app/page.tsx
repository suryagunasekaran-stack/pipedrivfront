export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-medium text-black mb-2">
          Connected to the system
        </h1>
        <p className="text-gray-600 text-sm">
          You may now close this window.
        </p>
      </div>
    </div>
  );
}
