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
  const badgeColor = type === 'quote' ? 'green' : 'blue';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-6 px-2 sm:px-4">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 bg-black text-center">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${type === 'quote' ? 'bg-green-100' : 'bg-blue-100'} mb-4`}>
            {currentContent.icon}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{currentContent.title}</h1>
          <p className="text-gray-300">
            {currentContent.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          {/* Number Information */}
          <div className="mb-8">
            <div className="text-center mb-6">
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
            <div className="space-y-3">
              {dealTitle && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Deal:</span>
                  <span className="text-sm text-black font-medium">{dealTitle}</span>
                </div>
              )}
              {organizationName && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Organization:</span>
                  <span className="text-sm text-black font-medium">{organizationName}</span>
                </div>
              )}
              {dealId && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Deal ID:</span>
                  <span className="text-sm text-black font-medium">{dealId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoHome}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Go Home
            </button>
            {/* Only show Update Deal button for quotes, not for projects */}
            {type === 'quote' && (
              <button
                onClick={handleUpdateDeal}
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Update Deal
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              {currentContent.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 