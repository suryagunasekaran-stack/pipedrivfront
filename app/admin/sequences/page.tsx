'use client';

import { useEffect, useState } from 'react';
import { sequences } from '../utils/api';
import { SequencesByYear, ProjectSequence } from '../utils/types';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SequencesPage() {
  const [sequencesData, setSequencesData] = useState<SequencesByYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [editingSequence, setEditingSequence] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState<{ dept: string; year: string } | null>(null);
  const [updateResponse, setUpdateResponse] = useState<any>(null);

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      const data = await sequences.getSequences();
      setSequencesData(data);
      // Expand current year by default
      if (data.currentYear) {
        setExpandedYears(new Set([data.currentYear.year]));
      }
    } catch (error) {
      toast.error('Failed to load sequences');
      console.error('Sequences error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (sequence: ProjectSequence) => {
    setEditingSequence(`${sequence.departmentCode}-${sequence.year}`);
    setEditValue(sequence.lastSequenceNumber.toString());
  };

  const handleEditCancel = () => {
    setEditingSequence(null);
    setEditValue('');
    setUpdateResponse(null);
  };

  const handleEditSave = async (sequence: ProjectSequence) => {
    const newValue = parseInt(editValue);
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    try {
      const response = await sequences.updateSequence(sequence.departmentCode, sequence.year.toString(), newValue);
      setUpdateResponse(response);
      
      // Check if the update was successful based on the backend response structure
      if (response.success && response.validation?.isValid) {
        toast.success(`Sequence updated for ${sequence.departmentName}`);
        setEditingSequence(null);
        loadSequences();
      } else if (response.success && !response.validation?.isValid) {
        // Show validation errors
        if (response.validation?.errors?.length > 0) {
          response.validation.errors.forEach((error: string) => {
            toast.error(error);
          });
        }
        // Show warnings
        if (response.validation?.warnings?.length > 0) {
          response.validation.warnings.forEach((warning: string) => {
            toast.error(warning, { duration: 6000 });
          });
        }
      }
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.data?.error) {
        toast.error(error.data.error);
      } else {
        toast.error('Failed to update sequence');
      }
    }
  };

  const handleReset = async () => {
    if (!resetModalOpen) return;

    try {
      const response = await sequences.resetSequence(resetModalOpen.dept, resetModalOpen.year, 0);
      
      if (response.success) {
        toast.success(response.message || 'Sequence reset successfully');
        setResetModalOpen(null);
        loadSequences();
      } else {
        toast.error('Failed to reset sequence');
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      if (error.data?.error) {
        toast.error(error.data.error);
      } else {
        toast.error('Failed to reset sequence');
      }
    }
  };

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const getEfficiencyColor = (efficiency: string) => {
    const value = parseFloat(efficiency);
    if (value >= 80) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <Loading text="Loading sequences..." />;
  }

  if (!sequencesData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load sequences data. Please try again.</p>
        </div>
      </div>
    );
  }

  const renderSequenceTable = (sequencesList: ProjectSequence[], year: number) => (
    <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Department
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Current Sequence
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Next Project
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Project Count
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Efficiency
            </th>
            <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Last Project
            </th>
            <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sequencesList.map((sequence) => {
            const isEditing = editingSequence === `${sequence.departmentCode}-${sequence.year}`;
            return (
              <tr key={`${sequence.departmentCode}-${sequence.year}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {sequence.departmentName} ({sequence.departmentCode})
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleEditSave(sequence)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>{sequence.lastSequenceNumber}</span>
                      <button
                        onClick={() => handleEditStart(sequence)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {sequence.departmentCode}{String(sequence.year).padStart(2, '0')}{String(sequence.nextSequence).padStart(3, '0')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {sequence.projectCount}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`font-medium ${getEfficiencyColor(sequence.efficiency)}`}>
                    {sequence.efficiency}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{sequence.lastProjectNumber || 'None'}</div>
                    {sequence.lastProjectCreated && (
                      <div className="text-xs text-gray-500">
                        {new Date(sequence.lastProjectCreated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => setResetModalOpen({ 
                      dept: sequence.departmentCode, 
                      year: sequence.year.toString() 
                    })}
                    className="text-red-600 hover:text-red-900"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span className="sr-only">Reset sequence</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Convert previousYears object to array for easier iteration
  const previousYearsArray = Object.keys(sequencesData.previousYears).map(year => ({
    year: parseInt(year),
    sequences: sequencesData.previousYears[year],
    totalProjects: sequencesData.previousYears[year].reduce((sum, seq) => sum + seq.projectCount, 0)
  })).sort((a, b) => b.year - a.year); // Sort by year descending

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Project Sequences</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage project numbering sequences by department and year
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sequences</dt>
                    <dd className="text-lg font-medium text-gray-900">{sequencesData.totalSequences}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">D</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Departments</dt>
                    <dd className="text-lg font-medium text-gray-900">{sequencesData.departmentMappings.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">Y</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Current Year</dt>
                    <dd className="text-lg font-medium text-gray-900">{sequencesData.currentYear.year}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {sequencesData.currentYear.sequences.reduce((sum, seq) => sum + seq.projectCount, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Year Section */}
        {sequencesData.currentYear && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Current Year ({sequencesData.currentYear.year})
                  </h3>
                </div>
                {renderSequenceTable(sequencesData.currentYear.sequences, sequencesData.currentYear.year)}
              </div>
            </div>
          </div>
        )}

        {/* Previous Years Section */}
        {previousYearsArray.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Previous Years</h3>
            <div className="space-y-4">
              {previousYearsArray.map((yearData) => (
                <div key={yearData.year} className="bg-white shadow rounded-lg">
                  <div className="px-4 py-3 sm:px-6">
                    <button
                      onClick={() => toggleYear(yearData.year)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedYears.has(yearData.year) ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <h4 className="text-base font-medium text-gray-900">Year {yearData.year}</h4>
                      </div>
                      <span className="text-sm text-gray-500">
                        {yearData.totalProjects} projects
                      </span>
                    </button>
                  </div>
                  {expandedYears.has(yearData.year) && (
                    <div className="px-4 pb-4 sm:px-6">
                      {renderSequenceTable(yearData.sequences, yearData.year)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Response Display */}
        {updateResponse && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Update Response</h4>
            <div className="text-sm text-yellow-700">
              {updateResponse.validation?.warnings?.map((warning: string, index: number) => (
                <div key={index} className="mb-1">⚠️ {warning}</div>
              ))}
              {updateResponse.validation?.errors?.map((error: string, index: number) => (
                <div key={index} className="mb-1 text-red-700">❌ {error}</div>
              ))}
              {updateResponse.validation?.suggestions?.map((suggestion: string, index: number) => (
                <div key={index} className="mb-1">💡 {suggestion}</div>
              ))}
            </div>
          </div>
        )}

        {/* Department Mappings */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Department Codes</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {sequencesData.departmentMappings.map((dept) => (
              <div key={dept.code} className="flex items-center space-x-2">
                <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs">{dept.code}</span>
                <span className="text-gray-600">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Sequence Management Tips</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Click the pencil icon to edit a sequence number inline</li>
                  <li>Use the reset button to start a sequence from zero (requires confirmation)</li>
                  <li>Efficiency is calculated as (projects / sequence number) * 100</li>
                  <li>Changes take effect immediately for new projects</li>
                  <li>Warning messages will appear if there are large gaps in sequences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Reset Sequence
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to reset this sequence to 0? This action cannot be undone
                        and will affect all future project numbers for this department.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={handleReset}
                  >
                    Reset to 0
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setResetModalOpen(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 