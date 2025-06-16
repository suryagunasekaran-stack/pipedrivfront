'use client';

import { useEffect, useState } from 'react';
import { activity } from '../utils/api';
import { AdminAction, PaginatedResponse } from '../utils/types';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import {
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 50;

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'update_company', label: 'Update Company' },
  { value: 'update_sequence', label: 'Update Sequence' },
  { value: 'reset_sequence', label: 'Reset Sequence' },
  { value: 'bulk_update', label: 'Bulk Update' },
  { value: 'view_data', label: 'View Data' },
];

export default function ActivityPage() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [filters, setFilters] = useState({
    actionType: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [currentPage, filters]);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<AdminAction> = await activity.getActivityLog({
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
        actionType: filters.actionType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      setActions(response.data);
      setTotalActions(response.total);
    } catch (error) {
      toast.error('Failed to load activity log');
      console.error('Activity error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadActivity();
  };

  const clearFilters = () => {
    setFilters({
      actionType: '',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(0);
  };

  const getActionIcon = (action: AdminAction) => {
    if (action.success) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'login':
      case 'logout':
        return 'text-blue-600';
      case 'update_company':
      case 'bulk_update':
        return 'text-green-600';
      case 'update_sequence':
      case 'reset_sequence':
        return 'text-yellow-600';
      case 'view_data':
        return 'text-gray-600';
      default:
        return 'text-gray-900';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString()}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString()}`;
    } else {
      return date.toLocaleString();
    }
  };

  const totalPages = Math.ceil(totalActions / ITEMS_PER_PAGE);

  if (loading && actions.length === 0) {
    return <Loading text="Loading activity log..." />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
            <p className="mt-2 text-sm text-gray-700">
              View all admin actions and system activity
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 bg-white shadow rounded-lg p-4">
            <form onSubmit={handleFilterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="actionType" className="block text-sm font-medium text-gray-700">
                    Action Type
                  </label>
                  <select
                    id="actionType"
                    value={filters.actionType}
                    onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {ACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                    From Date
                  </label>
                  <input
                    type="date"
                    id="dateFrom"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
                    To Date
                  </label>
                  <input
                    type="date"
                    id="dateTo"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {actions.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500">
                  No activity found
                </li>
              ) : (
                actions.map((action) => (
                  <li key={action.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            <span className={getActionColor(action.actionType)}>
                              {formatActionType(action.actionType)}
                            </span>
                            {action.target && (
                              <span className="text-gray-500 ml-2">
                                on {action.targetType}: {action.target}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {formatTimestamp(action.timestamp)}
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            Performed by: {action.performedBy}
                          </p>
                          {action.message && (
                            <p className="text-sm text-gray-500 mt-1">{action.message}</p>
                          )}
                          {action.metadata && Object.keys(action.metadata).length > 0 && (
                            <div className="mt-2">
                              <details className="text-sm">
                                <summary className="cursor-pointer text-indigo-600 hover:text-indigo-500">
                                  View details
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(action.metadata, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusBadge
                          status={action.success ? 'success' : 'error'}
                          size="sm"
                        />
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {currentPage * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalActions)} of {totalActions} actions
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
    </div>
  );
} 