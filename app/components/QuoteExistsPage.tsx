import { useRouter } from 'next/navigation';
import { DEFAULT_PIPEDRIVE_DOMAIN } from '../constants';

interface QuoteExistsPageProps {
  type: 'quote' | 'project';
  number: string; // Quote number or Project number
  dealId: string | null;
  companyId: string | null;
  dealTitle?: string;
  organizationName?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Full-page component displayed when a quote or project already exists for a deal
 * Provides options to go home or update the deal
 */
export default function QuoteExistsPage({ 
  type,
  number, 
  dealId, 
  companyId,
  dealTitle,
  organizationName,
  userId,
  userEmail,
  userName
}: QuoteExistsPageProps) {
  const router = useRouter();

  const handleGoHome = () => {
    const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || DEFAULT_PIPEDRIVE_DOMAIN;
    router.push(`https://${pipedriveDomain}`);
  };

  const handleUpdateDeal = () => {
    // Debug: Log the values to check what's being passed
    console.log('Update Deal - Values:', {
      dealId,
      companyId,
      userId,
      userEmail,
      userName
    });

    // Validate required parameters
    if (!dealId || !companyId) {
      console.error('Missing required parameters:', { dealId, companyId });
      alert('Missing required parameters: dealId or companyId');
      return;
    }

    // Construct the external workflow URL using environment variable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      uiAction: 'updateQuotation',
      dealId: dealId,
      companyId: companyId,
      ...(userId && { userId }),
      ...(userEmail && { userEmail }),
      ...(userName && { userName }),
    });
    
    const updateUrl = `${baseUrl}/pipedrive-action?${params.toString()}`;
    console.log('Redirecting to:', updateUrl);
    window.open(updateUrl, '_blank');
  };

  // Dynamic content based on type
  const content = {
    quote: {
      title: 'Quote Already Created',
      subtitle: 'This deal already has an associated Xero quotation',
      numberLabel: 'Quote Number:',
      description: `The quote has been successfully created in Xero. You can update the deal details or navigate back to your dashboard.`,
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    project: {
      title: 'Project Already Created',
      subtitle: 'This deal already has an associated project',
      numberLabel: 'Project Number:',
      description: `The project has been successfully created. You can update the deal details or navigate back to your dashboard.`,
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      )
    }
  };

  const currentContent = content[type];

  return (
    <div className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${type === 'quote' ? 'bg-green-100' : 'bg-blue-100'} mb-4`}>
            {currentContent.icon}
          </div>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance text-gray-900 sm:text-4xl text-center mx-auto">
            {currentContent.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {currentContent.subtitle}
          </p>
        </div>

        {/* Number Information */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center px-4 py-2 ${
            type === 'quote' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          } border rounded-lg`}>
            <span className={`text-sm font-medium ${
              type === 'quote' ? 'text-green-800' : 'text-blue-800'
            }`}>
              {currentContent.numberLabel}
            </span>
            <span className={`ml-2 text-lg font-bold ${
              type === 'quote' ? 'text-green-900' : 'text-blue-900'
            }`}>
              #{number}
            </span>
          </div>
        </div>

        {/* Deal Details */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            {dealTitle && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Deal:</span>
                <span className="text-sm text-gray-900 font-medium">{dealTitle}</span>
              </div>
            )}
            {organizationName && (
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-600">Organization:</span>
                <span className="text-sm text-gray-900 font-medium">{organizationName}</span>
              </div>
            )}
            {dealId && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600">Deal ID:</span>
                <span className="text-sm text-gray-900 font-medium">{dealId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            {/* Only show Update Quote button for quotes, not for projects */}
            {type === 'quote' && (
              <button
                onClick={handleUpdateDeal}
                className="flex-none rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
              >
                Update Quote
              </button>
            )}
            <button
              onClick={handleGoHome}
              className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 border border-gray-300 shadow-xs hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-colors"
            >
              Go Home
            </button>
          </div>
          
          {/* Additional Info */}
          <p className="mt-6 text-sm/6 text-gray-900 text-center">
            {currentContent.description}
          </p>
        </div>
      </div>
    </div>
  );
} 