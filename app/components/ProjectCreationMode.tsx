'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectData, CreationResult } from '../types/pipedrive';
import ProjectCheckItems from './ProjectCheckItems';
import ProjectCreationActions from './ProjectCreationActions';
import { validateProjectData } from '../utils/projectValidation';
import { useToast } from '../hooks/useToastNew';
import { API_ENDPOINTS, PROJECT_REDIRECT_DELAY } from '../constants';

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

  // Debug logging to see what data we're receiving
  console.log('🔍 ProjectCreationMode Debug:');
  console.log('- projectData:', projectData);
  console.log('- xeroProjects:', xeroProjects);
  console.log('- xeroProjects.length:', xeroProjects.length);
  console.log('- Raw projectData keys:', projectData ? Object.keys(projectData) : 'null');

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
      console.log('🚀 Sending payload to link existing project:');
      console.log('- Current payload:', {
        pipedriveDealId: dealId,
        pipedriveCompanyId: companyId,
        xeroProjectId: selectedProject.projectId
      });
      console.log('- Available selectedProject data:', selectedProject);
      
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

  return (
    <div className="w-full max-w-4xl bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 bg-black">
        <h1 className="text-xl font-semibold text-white">Project Setup</h1>
        <p className="text-sm text-gray-300 mt-1">
          Create a new project or link to an existing one
        </p>
      </div>
      
      <div className="p-6">
        {/* Mode Selection */}
        <div className="flex space-x-2 mb-6">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
              mode === 'create'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleModeChange('create')}
            disabled={isProcessing}
          >
            Create New Project
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
              mode === 'link'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleModeChange('link')}
            disabled={isProcessing || !xeroProjects || xeroProjects.length === 0}
          >
            Link Existing Project ({xeroProjects.length} available)
          </button>
        </div>

        {/* Create Mode */}
        {mode === 'create' && (
          <>
            <ProjectCheckItems checkItems={checkItems} />
            
            <div className="mt-6 space-y-4">
              {hasValidProjectData && (
                <>
                  {allChecksPassed ? (
                    <button 
                      onClick={onCreateProject}
                      disabled={isLoading || !!error || isCreating || !hasValidProjectData}
                      className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? 'Creating Project...' : 'Confirm & Create Project'}
                    </button>
                  ) : (
                    <div className="text-sm text-gray-700 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                      <p>
                        Please ensure all required Pipedrive deal information (marked as required) 
                        is complete in Pipedrive and refresh this page to enable project creation.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Link Mode */}
        {mode === 'link' && (
          <div className="space-y-4">
            {/* Validation Checks */}
            <ProjectCheckItems checkItems={checkItems} />
            
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-gray-900 placeholder-gray-500 bg-white"
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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Selected Project</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Code:</span>
                    <span className="ml-2 text-gray-900">{selectedProject.projectCode}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedProject.status === 'ACTIVE' || selectedProject.status === 'INPROGRESS'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{selectedProject.name}</span>
                  </div>
                  {selectedProject.estimate && (
                    <div>
                      <span className="font-medium text-gray-700">Estimate:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedProject.estimate.currency} {selectedProject.estimate.value?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedProject.totalToBeInvoiced && (
                    <div>
                      <span className="font-medium text-gray-700">To Invoice:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedProject.totalToBeInvoiced.currency} {selectedProject.totalToBeInvoiced.value?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Link Button */}
            <button
              onClick={handleLinkProject}
              disabled={isLinking || !selectedProject}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLinking ? 'Linking Project...' : 'Link Selected Project'}
            </button>
          </div>
        )}

        {/* Result Display */}
        {displayResult && (
          <div className={`mt-4 p-3 rounded text-center ${
            displayResult.success 
              ? 'bg-gray-100 text-gray-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {displayResult.message}
          </div>
        )}
      </div>
    </div>
  );
} 