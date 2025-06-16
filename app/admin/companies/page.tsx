'use client';

import { useEffect, useState, useCallback } from 'react';
import { companies } from '../utils/api';
import { CompanyListItem, CompanyDetail, PaginatedResponse } from '../utils/types';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 50;

// Helper function to calculate custom fields status
const getCustomFieldsStatus = (customFields: any): 'complete' | 'partial' | 'empty' => {
  if (!customFields || typeof customFields !== 'object') return 'empty';
  
  const fieldValues = Object.values(customFields).filter(value => value && String(value).trim() !== '');
  const totalFields = Object.keys(customFields).length;
  
  if (fieldValues.length === 0) return 'empty';
  if (fieldValues.length === totalFields) return 'complete';
  return 'partial';
};

// Helper function to transform backend company data to frontend format
const transformCompanyData = (backendData: any): CompanyListItem => {
  return {
    companyId: backendData.companyId,
    companyName: backendData.companyName,
    isActive: backendData.isActive,
    createdAt: backendData.createdAt,
    updatedAt: backendData.updatedAt,
    authStatus: {
      pipedrive: {
        isConnected: backendData.authTokens?.pipedrive?.hasToken && backendData.authTokens?.pipedrive?.isActive,
        lastSync: backendData.authTokens?.pipedrive?.lastUsed,
      },
      xero: {
        isConnected: backendData.authTokens?.xero?.hasToken && backendData.authTokens?.xero?.isActive,
        lastSync: backendData.authTokens?.xero?.lastUsed,
      },
    },
    customFieldsStatus: getCustomFieldsStatus(backendData.customFields),
    projectCount: backendData.statistics?.totalProjects || 0,
  };
};

export default function CompaniesPage() {
  const [companiesList, setCompaniesList] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCompanies();
  }, [currentPage, searchTerm]);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await companies.getCompanies({
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
        search: searchTerm,
      });
      
      console.log('Raw companies response:', response);
      
      // Handle the backend response structure
      if (response && typeof response === 'object') {
        // Backend returns {success: true, data: [...]} or direct array
        const rawData = response.data || response;
        
        if (Array.isArray(rawData)) {
          // Transform each company data item
          const transformedCompanies = rawData.map(transformCompanyData);
          setCompaniesList(transformedCompanies);
          setTotalCompanies(response.total || response.totalCount || transformedCompanies.length);
        } else {
          console.warn('Expected array of companies, got:', rawData);
          setCompaniesList([]);
          setTotalCompanies(0);
        }
      } else {
        console.warn('Unexpected response format:', response);
        setCompaniesList([]);
        setTotalCompanies(0);
      }
    } catch (error) {
      toast.error('Failed to load companies');
      console.error('Companies error:', error);
      setCompaniesList([]);
      setTotalCompanies(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadCompanies();
  };

  const handleEditCompany = async (companyId: string) => {
    try {
      setLoadingCompany(true);
      const company = await companies.getCompany(companyId);
      console.log('Raw company details response:', company);
      setSelectedCompany(company);
      setEditModalOpen(true);
    } catch (error) {
      toast.error('Failed to load company details');
      console.error('Company details error:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const companyId = formData.get('companyId') as string;
      
      if (!companyId) {
        toast.error('Company ID is required');
        return;
      }

      const customFields: Record<string, string> = {};
      const xeroSettings: Record<string, string> = {};

      // Extract all custom fields
      const customFieldNames = [
        'department', 'vesselName', 'salesInCharge', 'location',
        'quoteNumber', 'quoteId', 'projectNumber', 'invoiceNumber', 
        'invoiceId', 'pendingStatus'
      ];
      
      customFieldNames.forEach(field => {
        const value = formData.get(`customFields.${field}`) as string;
        if (value && value.trim() !== '') customFields[field] = value.trim();
      });

      // Extract Xero settings
      ['defaultAccountCode', 'defaultTaxType', 'defaultCurrency'].forEach(field => {
        const value = formData.get(`xeroSettings.${field}`) as string;
        if (value && value.trim() !== '') xeroSettings[field] = value.trim();
      });

      const payload = {
        companyId,
        configData: {
          customFields,
          ...(Object.keys(xeroSettings).length > 0 && { xeroSettings }),
        },
      };

      console.log('=== CREATE COMPANY PAYLOAD ===');
      console.log('Company ID:', companyId);
      console.log('Custom Fields extracted:', customFields);
      console.log('Xero Settings extracted:', xeroSettings);
      console.log('Full payload being sent to backend:', JSON.stringify(payload, null, 2));
      console.log('API endpoint: POST /api/admin/companies');
      console.log('================================');

      await companies.createCompany(payload);

      toast.success('Company created successfully');
      setCreateModalOpen(false);
      loadCompanies();
    } catch (error) {
      toast.error('Failed to create company');
      console.error('Create company error:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // If it's a network error, try to get response details
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Response status:', (error as any).response?.status);
        console.error('Response data:', (error as any).response?.data);
      }
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const customFields: Record<string, string> = {};
      const xeroSettings: Record<string, string> = {};

      // Extract all custom fields
      const customFieldNames = [
        'projectNumber', 'projectName', 'departmentCode', 'projectManager', 'projectStatus',
        'department', 'vesselName', 'salesInCharge', 'location',
        'quoteNumber', 'quoteId', 'invoiceNumber', 'invoiceId', 'pendingStatus'
      ];
      
      customFieldNames.forEach(field => {
        const value = formData.get(`customFields.${field}`) as string;
        if (value && value.trim() !== '') customFields[field] = value.trim();
      });

      // Extract Xero settings if they exist
      ['defaultAccountCode', 'defaultTaxType', 'defaultCurrency'].forEach(field => {
        const value = formData.get(`xeroSettings.${field}`) as string;
        if (value && value.trim() !== '') xeroSettings[field] = value.trim();
      });

      await companies.updateCompany(selectedCompany.companyId, {
        customFields,
        ...(Object.keys(xeroSettings).length > 0 && { xeroSettings }),
      });

      toast.success('Company updated successfully');
      setEditModalOpen(false);
      loadCompanies();
    } catch (error) {
      toast.error('Failed to update company');
      console.error('Update company error:', error);
    }
  };

  const toggleSelectCompany = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.size === companiesList.length && companiesList.length > 0) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(companiesList.map(c => c.companyId)));
    }
  };

  const totalPages = Math.ceil(totalCompanies / ITEMS_PER_PAGE);

  if (loading && companiesList.length === 0) {
    return <Loading text="Loading companies..." />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage company configurations and authentication status
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Create Company
              </button>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search companies..."
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="relative px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={Array.isArray(companiesList) && selectedCompanies.size === companiesList.length && companiesList.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Auth Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Custom Fields
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Projects
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.isArray(companiesList) && companiesList.length > 0 ? (
                      companiesList.map((company) => (
                        <tr key={company.companyId} className="hover:bg-gray-50">
                          <td className="relative px-6 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedCompanies.has(company.companyId)}
                              onChange={() => toggleSelectCompany(company.companyId)}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {company.companyId}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {company.companyName || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <StatusBadge
                                status={company.authStatus?.pipedrive?.isConnected ? 'connected' : 'disconnected'}
                                text="Pipedrive"
                                size="sm"
                              />
                              <StatusBadge
                                status={company.authStatus?.xero?.isConnected ? 'connected' : 'disconnected'}
                                text="Xero"
                                size="sm"
                              />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <StatusBadge
                              status={
                                company.customFieldsStatus === 'complete'
                                  ? 'success'
                                  : company.customFieldsStatus === 'partial'
                                  ? 'warning'
                                  : 'error'
                              }
                              text={company.customFieldsStatus}
                              size="sm"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {company.projectCount || 0}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleEditCompany(company.companyId)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span className="sr-only">Edit {company.companyId}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      loading && (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                            Loading companies...
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Show message if no companies */}
        {!loading && (!companiesList || companiesList.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? `No companies found matching "${searchTerm}"` : 'No companies found.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {currentPage * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCompanies)} of {totalCompanies} companies
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Company Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Company: ${selectedCompany?.companyId || ''}`}
        size="lg"
      >
        {loadingCompany ? (
          <Loading text="Loading company details..." />
        ) : selectedCompany ? (
          <form onSubmit={handleSaveCompany} className="space-y-6">
            {/* Company Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Company Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Company ID:</span>
                  <span className="ml-2 font-medium">{selectedCompany.companyId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Company Name:</span>
                  <span className="ml-2 font-medium">{selectedCompany.companyName || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium">{selectedCompany.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{new Date(selectedCompany.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Auth Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Authentication Status</h4>
              <div className="space-y-2">
                {selectedCompany.authTokens?.pipedrive && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">Pipedrive</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {selectedCompany.authTokens.pipedrive.hasToken ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedCompany.authTokens.pipedrive.lastUsed && 
                        `Last used: ${new Date(selectedCompany.authTokens.pipedrive.lastUsed).toLocaleDateString()}`
                      }
                    </div>
                  </div>
                )}
                {selectedCompany.authTokens?.xero && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">Xero</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {selectedCompany.authTokens.xero.hasToken ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedCompany.authTokens.xero.lastUsed && 
                        `Last used: ${new Date(selectedCompany.authTokens.xero.lastUsed).toLocaleDateString()}`
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Fields */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Field Mappings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">
                    Department Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.department"
                    id="edit-department"
                    defaultValue={selectedCompany.customFields.department || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-vesselName" className="block text-sm font-medium text-gray-700">
                    Vessel Name Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.vesselName"
                    id="edit-vesselName"
                    defaultValue={selectedCompany.customFields.vesselName || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-salesInCharge" className="block text-sm font-medium text-gray-700">
                    Sales In Charge Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.salesInCharge"
                    id="edit-salesInCharge"
                    defaultValue={selectedCompany.customFields.salesInCharge || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700">
                    Location Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.location"
                    id="edit-location"
                    defaultValue={selectedCompany.customFields.location || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-quoteNumber" className="block text-sm font-medium text-gray-700">
                    Quote Number Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.quoteNumber"
                    id="edit-quoteNumber"
                    defaultValue={selectedCompany.customFields.quoteNumber || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-quoteId" className="block text-sm font-medium text-gray-700">
                    Quote ID Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.quoteId"
                    id="edit-quoteId"
                    defaultValue={selectedCompany.customFields.quoteId || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-projectNumber" className="block text-sm font-medium text-gray-700">
                    Project Number Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.projectNumber"
                    id="edit-projectNumber"
                    defaultValue={selectedCompany.customFields.projectNumber || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-invoiceNumber" className="block text-sm font-medium text-gray-700">
                    Invoice Number Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.invoiceNumber"
                    id="edit-invoiceNumber"
                    defaultValue={selectedCompany.customFields.invoiceNumber || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-invoiceId" className="block text-sm font-medium text-gray-700">
                    Invoice ID Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.invoiceId"
                    id="edit-invoiceId"
                    defaultValue={selectedCompany.customFields.invoiceId || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-pendingStatus" className="block text-sm font-medium text-gray-700">
                    Pending Status Field ID
                  </label>
                  <input
                    type="text"
                    name="customFields.pendingStatus"
                    id="edit-pendingStatus"
                    defaultValue={selectedCompany.customFields.pendingStatus || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Xero Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Xero Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="edit-defaultAccountCode" className="block text-sm font-medium text-gray-700">
                    Default Account Code
                  </label>
                  <input
                    type="text"
                    name="xeroSettings.defaultAccountCode"
                    id="edit-defaultAccountCode"
                    defaultValue={selectedCompany.xeroSettings?.defaultAccountCode || ''}
                    placeholder="e.g., 200"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-defaultTaxType" className="block text-sm font-medium text-gray-700">
                    Default Tax Type
                  </label>
                  <input
                    type="text"
                    name="xeroSettings.defaultTaxType"
                    id="edit-defaultTaxType"
                    defaultValue={selectedCompany.xeroSettings?.defaultTaxType || ''}
                    placeholder="e.g., NONE, INPUT2, OUTPUT2"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-defaultCurrency" className="block text-sm font-medium text-gray-700">
                    Default Currency
                  </label>
                  <input
                    type="text"
                    name="xeroSettings.defaultCurrency"
                    id="edit-defaultCurrency"
                    defaultValue={selectedCompany.xeroSettings?.defaultCurrency || ''}
                    placeholder="e.g., USD, EUR, GBP"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Company Statistics */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Projects:</span>
                  <span className="ml-2 font-medium">{selectedCompany.statistics.totalProjects}</span>
                </div>
                {selectedCompany.statistics.activeSequences && (
                  <div>
                    <span className="text-gray-500">Active Sequences:</span>
                    <span className="ml-2 font-medium">{selectedCompany.statistics.activeSequences}</span>
                  </div>
                )}
                {selectedCompany.statistics.lastProjectCreated && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Last Project Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedCompany.statistics.lastProjectCreated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Create Company Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Company"
        size="xl"
      >
        <div className="max-h-[80vh] overflow-y-auto px-1">
          <form onSubmit={handleCreateCompany} className="space-y-8">
            {/* Company ID */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label htmlFor="companyId" className="block text-sm font-semibold text-blue-900 mb-2">
                Company ID *
              </label>
              <input
                type="text"
                name="companyId"
                id="companyId"
                required
                placeholder="Enter company ID (e.g., 13961027)"
                className="block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
              <p className="mt-1 text-xs text-blue-600">This is the unique identifier for your company in Pipedrive</p>
            </div>

            {/* Custom Fields */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">Pipedrive</span>
                Custom Field Mappings
              </h4>
              <p className="text-sm text-gray-600 mb-4">Enter the Pipedrive custom field IDs for mapping data between systems</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-800 text-sm uppercase tracking-wide">Basic Fields</h5>
                  
                  <div>
                    <label htmlFor="create-department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.department"
                      id="create-department"
                      placeholder="a1b2c3d4e5f6g7h8"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-vesselName" className="block text-sm font-medium text-gray-700 mb-1">
                      Vessel Name Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.vesselName"
                      id="create-vesselName"
                      placeholder="b2c3d4e5f6g7h8i9"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-salesInCharge" className="block text-sm font-medium text-gray-700 mb-1">
                      Sales In Charge Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.salesInCharge"
                      id="create-salesInCharge"
                      placeholder="c3d4e5f6g7h8i9j0"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.location"
                      id="create-location"
                      placeholder="d4e5f6g7h8i9j0k1"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-projectNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Project Number Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.projectNumber"
                      id="create-projectNumber"
                      placeholder="g7h8i9j0k1l2m3n4"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-medium text-gray-800 text-sm uppercase tracking-wide">Quote & Invoice Fields</h5>
                  
                  <div>
                    <label htmlFor="create-quoteNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Quote Number Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.quoteNumber"
                      id="create-quoteNumber"
                      placeholder="e5f6g7h8i9j0k1l2"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-quoteId" className="block text-sm font-medium text-gray-700 mb-1">
                      Quote ID Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.quoteId"
                      id="create-quoteId"
                      placeholder="f6g7h8i9j0k1l2m3"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.invoiceNumber"
                      id="create-invoiceNumber"
                      placeholder="h8i9j0k1l2m3n4o5"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-invoiceId" className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice ID Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.invoiceId"
                      id="create-invoiceId"
                      placeholder="i9j0k1l2m3n4o5p6"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="create-pendingStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      Pending Status Field ID
                    </label>
                    <input
                      type="text"
                      name="customFields.pendingStatus"
                      id="create-pendingStatus"
                      placeholder="j0k1l2m3n4o5p6q7"
                      className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Xero Settings */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">Xero</span>
                Default Settings
              </h4>
              <p className="text-sm text-gray-600 mb-4">Configure default values for Xero integration (optional)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="create-defaultAccountCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Code
                  </label>
                  <input
                    type="text"
                    name="xeroSettings.defaultAccountCode"
                    id="create-defaultAccountCode"
                    placeholder="200"
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">e.g., 200, 400, 800</p>
                </div>
                
                <div>
                  <label htmlFor="create-defaultTaxType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Type
                  </label>
                  <input
                    type="text"
                    name="xeroSettings.defaultTaxType"
                    id="create-defaultTaxType"
                    placeholder="NONE"
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">NONE, INPUT2, OUTPUT2</p>
                </div>
                
                <div>
                  <label htmlFor="create-defaultCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    name="xeroSettings.defaultCurrency"
                    id="create-defaultCurrency"
                    placeholder="USD"
                    className="block w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">USD, EUR, GBP</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Company
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
} 