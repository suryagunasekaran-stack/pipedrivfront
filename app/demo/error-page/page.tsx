'use client';

import { useState } from 'react';
import ApiErrorPage from '../../components/ApiErrorPage';

export default function ErrorPageDemo() {
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState('validation');

  const errorExamples = {
    validation: {
      title: 'Project Creation Failed',
      message: 'Deal validation failed: Deal must have both quote number and quote ID before creating a project',
      statusCode: 400,
      details: 'Please ensure the deal has both a quote number and quote ID before creating a project.'
    },
    notFound: {
      message: 'The requested resource could not be found',
      statusCode: 404,
    },
    serverError: {
      message: 'Internal server error occurred while processing your request',
      statusCode: 500,
      details: 'Reference: ERR-2024-0103-1234'
    },
    unauthorized: {
      message: 'You need to authenticate to access this resource',
      statusCode: 401,
    },
    forbidden: {
      message: 'You do not have permission to perform this action',
      statusCode: 403,
    }
  };

  if (showError) {
    return (
      <ApiErrorPage
        error={errorExamples[errorType as keyof typeof errorExamples]}
        onRetry={() => {
          console.log('Retry clicked');
          setShowError(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Error Page Demo</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select an error type to preview:</h2>
          
          <div className="space-y-3">
            {Object.entries(errorExamples).map(([key, example]) => (
              <button
                key={key}
                onClick={() => {
                  setErrorType(key);
                  setShowError(true);
                }}
                className="w-full text-left p-4 border rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">{example.statusCode} - {key.charAt(0).toUpperCase() + key.slice(1)} Error</div>
                <div className="text-sm text-gray-600 mt-1">{example.message}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-blue-900 mb-2">Usage Example:</h3>
          <pre className="text-sm bg-blue-100 p-3 rounded overflow-x-auto">
{`<ApiErrorPage
  error={{
    title: 'Project Creation Failed',
    message: errorMessage,
    statusCode: 400,
    details: 'Additional details here'
  }}
  onRetry={() => refetch()}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}