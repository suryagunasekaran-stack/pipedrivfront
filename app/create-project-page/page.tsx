/**
 * Create Project Page - Enhanced with improved UI/UX
 */
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjectData, useProjectCreation } from '../hooks/useProjectData';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorDisplay from '../components/ErrorDisplay';
import SuccessNotification from '../components/SuccessNotification';
import { createProjectWithAuth, getCurrentUrlWithParams } from '../utils/autoAuthFlow';

function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');
  const companyId = searchParams.get('companyId');
  
  const { 
    projectData, 
    isLoading, 
    error, 
    refetch 
  } = useProjectData({ dealId, companyId });

  const { 
    isCreating, 
    createProject 
  } = useProjectCreation({ projectData, dealId, companyId });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [autoCreateInProgress, setAutoCreateInProgress] = useState(false);

  // Auto-create project on page load with auth handling
  useEffect(() => {
    if (dealId && companyId && !autoCreateInProgress && !projectData && !isLoading && !error) {
      handleAutoCreateProject();
    }
  }, [dealId, companyId, autoCreateInProgress, projectData, isLoading, error]);

  const handleAutoCreateProject = async () => {
    if (!dealId || !companyId) return;
    
    setAutoCreateInProgress(true);
    
    try {
      const currentUrl = getCurrentUrlWithParams();
      
      // This will handle auth if needed, then proceed with project creation
      await createProjectWithAuth(companyId, dealId, currentUrl);
      
      // If auth is successful, proceed with actual project creation
      await createProject();
      // createProject handles success state internally
    } catch (error) {
      console.error('Auto project creation failed:', error);
    } finally {
      setAutoCreateInProgress(false);
    }
  };

  const handleManualCreate = async () => {
    try {
      await createProject();
      // createProject handles success state internally
    } catch (error) {
      console.error('Manual project creation failed:', error);
    }
  };

  const handleViewInPipedrive = () => {
    if (dealId) {
      const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN || 'app.pipedrive.com';
      window.open(`https://${pipedriveDomain}/deal/${dealId}`, '_blank');
    }
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setCreatedProject(null);
    // Allow user to create another project or go back
    router.push('/pipedrive-data-view' + (dealId && companyId ? `?dealId=${dealId}&companyId=${companyId}` : ''));
  };

  // Loading state during auto-creation or auth flow
  if (isLoading || autoCreateInProgress) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header skeleton */}
            <SkeletonLoader variant="card" className="mb-8" />
            
            {/* Multi-stage loading indicator */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="mb-6">
                <LoadingSpinner size="lg" variant="overlay" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {autoCreateInProgress ? 'Setting Up Your Project' : 'Loading Project Data'}
                </h2>
                
                <div className="text-sm text-gray-600 space-y-1">
                  {autoCreateInProgress ? (
                    <>
                      <p className="animate-pulse">🔍 Checking authentication...</p>
                      <p className="animate-pulse">📊 Gathering deal information...</p>
                      <p className="animate-pulse">🎯 Creating project structure...</p>
                    </>
                  ) : (
                    <p>Fetching deal details from Pipedrive...</p>
                  )}
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-black h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !projectData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <ErrorDisplay
              error={error}
              onRetry={refetch}
            />
          </div>
        </div>
      </div>
    );
  }

  // Success state with project data
  if (projectData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Project Created Successfully</h1>
                  <p className="text-gray-600 mt-1">
                    Project #{projectData.projectNumber} • {projectData.deal?.title}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✅ Active
                  </span>
                </div>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Deal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Deal Value:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {projectData.deal?.currency} {projectData.deal?.value?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Organization:</span>
                    <p className="text-gray-900">{projectData.organization?.name}</p>
                  </div>
                  {projectData.person && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact:</span>
                      <p className="text-gray-900">{projectData.person.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Project Number:</span>
                    <p className="text-lg font-semibold text-gray-900">{projectData.projectNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-gray-900">Active</p>
                  </div>
                  {projectData.xero?.projectCreated && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Xero Project:</span>
                      <p className="text-green-600 font-medium">✅ Synced</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products/Services */}
            {projectData.products && projectData.products.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Products & Services</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projectData.products.map((product: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {projectData.deal?.currency} {product.item_price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {projectData.deal?.currency} {product.sum}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleViewInPipedrive}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View in Pipedrive
                </button>
                
                {!isCreating && (
                  <button
                    onClick={handleManualCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Create New Project
                  </button>
                )}
                
                <button
                  onClick={handleCreateAnother}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                  Back to Deal View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Notification */}
        <SuccessNotification
          show={showSuccess}
          title="Project Created Successfully!"
          message={`Project ${createdProject?.projectNumber || projectData.projectNumber} has been created and synced with your systems.`}
          variant="celebration"
          onClose={() => setShowSuccess(false)}
          actions={[
            {
              label: 'View in Pipedrive',
              action: handleViewInPipedrive,
              variant: 'primary'
            },
            {
              label: 'Create Another',
              action: handleCreateAnother,
              variant: 'secondary'
            }
          ]}
        />
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner message="Initializing project creation..." size="lg" />
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading..." size="lg" />
      </div>
    }>
      <CreateProjectContent />
    </Suspense>
  );
}
