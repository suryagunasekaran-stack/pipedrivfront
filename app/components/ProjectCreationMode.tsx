'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectData, CreationResult, FetchedPipedriveData } from '../types/pipedrive';
import ProjectCheckItems from './ProjectCheckItems';
import ProjectCreationActions from './ProjectCreationActions';
import { validateProjectData } from '../utils/projectValidation';
import { useToast } from '../hooks/useToastNew';
import { API_ENDPOINTS, PROJECT_REDIRECT_DELAY } from '../constants';
import { calculateProductSummary, calculateProductFinancials } from '../utils/calculations';

interface XeroProject {
  projectId: string;
  name: string;
  projectCode: string;
  status: string;
  currencyCode: string;
  contactId: string;
  estimate?: {
    currency: string;
    value: number;
  };
  totalInvoiced?: {
    currency: string;
    value: number;
  };
  totalToBeInvoiced?: {
    currency: string;
    value: number;
  };
  deadlineUtc?: string;
}

interface ProjectCreationModeProps {
  projectData: ProjectData | null;
  pipedriveData: FetchedPipedriveData | null;
  dealId: string | null;
  companyId: string | null;
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  creationResult: CreationResult | null;
  onCreateProject: () => void;
}

export default function ProjectCreationMode({
  projectData,
  pipedriveData,
  dealId,
  companyId,
  isLoading,
  error,
  isCreating,
  creationResult,
  onCreateProject,
}: ProjectCreationModeProps) {
  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [selectedProject, setSelectedProject] = useState<XeroProject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<CreationResult | null>(null);
  
  const toast = useToast();
  const router = useRouter();
  const { checkItems, allChecksPassed } = validateProjectData(projectData);
  const hasValidProjectData = !!projectData?.deal?.id;

  // Get xeroProjects from projectData
  const xeroProjects: XeroProject[] = (projectData as any)?.xeroProjects || [];

  // Define required field IDs
  const requiredFieldIds = ['department', 'vessel-name', 'location', 'sales-in-charge'];
  
  // Check for missing required fields
  const missingFields = checkItems.filter(item => 
    requiredFieldIds.includes(item.id) && !item.isValid
  );
  const hasAllRequiredFields = missingFields.length === 0;

  // Filter projects based on search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return xeroProjects;
    
    const term = searchTerm.toLowerCase();
    return xeroProjects.filter(project => 
      project.projectCode?.toLowerCase().includes(term) ||
      project.name?.toLowerCase().includes(term)
    );
  }, [searchTerm, xeroProjects]);

  // Handle redirect after successful link
  useEffect(() => {
    if (!linkResult?.success) return;

    const timer = setTimeout(() => {
      const pipedriveDomain = process.env.NEXT_PUBLIC_PIPEDRIVE_DOMAIN;
      const redirectUrl = pipedriveDomain && dealId
        ? `https://${pipedriveDomain}/deal/${dealId}`
        : null;

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const updatedResult: CreationResult = {
          ...linkResult,
          message: `${linkResult.message} Please return to Pipedrive.`
        };
        setLinkResult(updatedResult);
      }
    }, PROJECT_REDIRECT_DELAY);

    return () => clearTimeout(timer);
  }, [linkResult, router, dealId]);

  // Handle linking existing project
  const handleLinkProject = async () => {
    if (!selectedProject || !dealId || !companyId) {
      toast.error('Please select a project to link');
      return;
    }
    
    setIsLinking(true);
    setLinkResult(null);
    
    const loadingToast = toast.loading('Linking project...');
    
    try {
      const response = await fetch(API_ENDPOINTS.PROJECT_LINK_EXISTING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pipedriveDealId: dealId,
          pipedriveCompanyId: companyId,
          xeroProjectId: selectedProject.projectId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to link project');
      }
      
      if (result.success) {
        const successMsg = result.message || `Deal successfully linked to project ${selectedProject.projectCode}`;
        setLinkResult({
          success: true,
          message: successMsg,
          projectNumber: result.projectNumber || selectedProject.projectCode,
          pipedriveDealId: dealId,
        });
        toast.dismiss(loadingToast);
        toast.success(successMsg);
      } else {
        throw new Error(result.error || 'Operation failed');
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to link project';
      setLinkResult({ 
        success: false, 
        message: errorMsg 
      });
      toast.dismiss(loadingToast);
      toast.error(errorMsg);
    } finally {
      setIsLinking(false);
    }
  };

  // Combined result for display
  const displayResult = mode === 'create' ? creationResult : linkResult;
  const isProcessing = mode === 'create' ? isCreating : isLinking;

  // Handle project selection
  const handleSelectProject = (project: XeroProject) => {
    setSelectedProject(project);
    setSearchTerm(`${project.projectCode} - ${project.name}`);
    setIsDropdownOpen(false);
  };

  // Reset state when switching modes
  const handleModeChange = (newMode: 'create' | 'link') => {
    setMode(newMode);
    if (newMode === 'create') {
      setSelectedProject(null);
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.searchable-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Format currency helper
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Section */}
        <div className="px-4 sm:px-0">
          <h3 className="text-base/7 font-semibold text-gray-900">Project Setup</h3>
          <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">
            Create a new project or link to an existing one
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mt-6 flex space-x-2">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === 'create'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleModeChange('create')}
            disabled={isProcessing}
          >
            Create New Project
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === 'link'
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleModeChange('link')}
            disabled={isProcessing || !xeroProjects || xeroProjects.length === 0}
          >
            Link Existing Project ({xeroProjects.length})
          </button>
        </div>

        {/* Deal Overview Section */}
        <div className="mt-10">
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Deal Overview</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Pipedrive deal information</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Deal Title</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.dealDetails?.title || 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Currency</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.dealDetails?.currency || 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Created Date</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.dealDetails?.add_time ? new Date(pipedriveData.dealDetails.add_time).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Deal ID</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{dealId || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Organization Details Section */}
        <div className="mt-10">
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Organization Details</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Contact and company information</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Organization Name</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.organizationDetails?.name || 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Primary Contact</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.personDetails?.name || 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Email address</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.personDetails?.email?.map((e: any) => e.value).join(', ') || 'N/A'}
                </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Phone</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {pipedriveData?.personDetails?.phone?.map((p: any) => p.value).join(', ') || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-10">
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Products</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Deal products and pricing</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            {pipedriveData?.dealProducts && pipedriveData.dealProducts.length > 0 ? (
              <>
                <dl className="divide-y divide-gray-100">
                  {pipedriveData.dealProducts.map((product: any, index: number) => {
                    const productCalc = calculateProductFinancials(product);
                    return (
                      <div key={index} className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                        <dt className="text-sm/6 font-medium text-gray-900">{product.name}</dt>
                        <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
                          <div>
                            <span>Quantity: {product.quantity} × {formatCurrency(product.item_price || 0, pipedriveData?.dealDetails?.currency)}</span>
                            {product.discount && product.discount > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Discount: {product.discount}{product.discount_type === 'percentage' ? '%' : ` ${pipedriveData?.dealDetails?.currency}`})
                              </span>
                            )}
                            <span className="ml-4 font-medium">{formatCurrency(productCalc.lineTotal, pipedriveData?.dealDetails?.currency)}</span>
                          </div>
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {/* Financial Summary */}
                {(() => {
                  const summary = calculateProductSummary(pipedriveData.dealProducts);
                  return (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <dl className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Subtotal</dt>
                          <dd className="font-medium text-gray-900">
                            {formatCurrency(summary.subtotal, pipedriveData?.dealDetails?.currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Tax</dt>
                          <dd className="font-medium text-gray-900">
                            {formatCurrency(summary.totalTax, pipedriveData?.dealDetails?.currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-4 text-base">
                          <dt className="font-medium text-gray-900">Total</dt>
                          <dd className="font-semibold text-gray-900">
                            {formatCurrency(summary.grandTotal, pipedriveData?.dealDetails?.currency)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">No products found</p>
            )}
          </div>
        </div>

        {/* Required Fields Section */}
        <div className="mt-10">
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Required Fields Status</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Fields needed for project creation</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            <ProjectCheckItems checkItems={checkItems} />
          </div>
        </div>

        {/* Create Mode Actions */}
        {mode === 'create' && (
          <div className="mt-10">
            {hasValidProjectData && (
              <>
                {hasAllRequiredFields ? (
                  <button 
                    onClick={onCreateProject}
                    disabled={isLoading || !!error || isCreating || !hasValidProjectData}
                    className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating Project...' : 'Create Project'}
                  </button>
                ) : (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Missing Required Fields</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>The following required fields are missing:</p>
                          <ul className="mt-2 list-disc pl-5 space-y-1">
                            {missingFields.map((field, index) => (
                              <li key={index}>{field.label}</li>
                            ))}
                          </ul>
                          <p className="mt-2">Please complete these fields in Pipedrive before creating the project.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Link Mode Actions */}
        {mode === 'link' && (
          <div className="mt-10 space-y-4">
            {/* Searchable Project Dropdown */}
            <div className="searchable-dropdown relative">
              <label htmlFor="project-search" className="block text-sm font-medium text-gray-700 mb-2">
                Search & Select Project
              </label>
              <div className="relative">
                <input
                  id="project-search"
                  type="text"
                  placeholder="Type to search by project code or name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === '') {
                      setSelectedProject(null);
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500 bg-white"
                  disabled={isLinking}
                />
                
                {/* Dropdown Menu */}
                {isDropdownOpen && filteredProjects.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.projectId}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSelectProject(project)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{project.projectCode}</div>
                            <div className="text-sm text-gray-600 mt-1">{project.name}</div>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                project.status === 'ACTIVE' || project.status === 'INPROGRESS'
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {project.status}
                              </span>
                              {project.estimate && (
                                <span className="text-xs text-gray-500">
                                  Est: {project.estimate.currency} {project.estimate.value?.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {isDropdownOpen && searchTerm.trim() && filteredProjects.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No projects found matching "{searchTerm}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Project Info */}
            {selectedProject && (
              <div className="rounded-md bg-gray-50 p-4">
                <h4 className="font-medium text-gray-900 mb-3">Selected Project</h4>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Code:</dt>
                    <dd className="mt-1 text-gray-900">{selectedProject.projectCode}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Status:</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedProject.status === 'ACTIVE' || selectedProject.status === 'INPROGRESS'
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedProject.status}
                      </span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-gray-500">Name:</dt>
                    <dd className="mt-1 text-gray-900">{selectedProject.name}</dd>
                  </div>
                  {selectedProject.estimate && (
                    <div>
                      <dt className="font-medium text-gray-500">Estimate:</dt>
                      <dd className="mt-1 text-gray-900">
                        {selectedProject.estimate.currency} {selectedProject.estimate.value?.toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Link Button */}
            <button
              onClick={handleLinkProject}
              disabled={isLinking || !selectedProject}
              className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinking ? 'Linking Project...' : 'Link Selected Project'}
            </button>
          </div>
        )}

        {/* Result Display */}
        {displayResult && (
          <div className={`mt-6 rounded-md p-4 ${
            displayResult.success 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm font-medium">{displayResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
} 