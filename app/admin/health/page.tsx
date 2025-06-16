'use client';

import { useEffect, useState } from 'react';
import { health } from '../utils/api';
import { SystemHealth, CollectionDetail } from '../utils/types';
import Loading from '../components/Loading';
import StatusBadge from '../components/StatusBadge';
import {
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function HealthPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [collections, setCollections] = useState<CollectionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailedView, setDetailedView] = useState(false);

  useEffect(() => {
    loadHealthData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const [healthData, detailedData] = await Promise.all([
        health.getSystemHealth(),
        health.getDetailedHealth(),
      ]);
      setSystemHealth(healthData);
      setCollections(detailedData.collections || []);
    } catch (error) {
      toast.error('Failed to load health data');
      console.error('Health error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadHealthData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !systemHealth) {
    return <Loading text="Loading system health..." />;
  }

  if (!systemHealth) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load system health data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">System Health</h1>
            <p className="mt-2 text-sm text-gray-700">
              Monitor system performance and database metrics
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Overall Health Score */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Overall System Health
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Last checked: {new Date(systemHealth.lastCheck).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-4xl font-bold ${getHealthScoreColor(systemHealth.overallScore)}`}>
                  {systemHealth.overallScore}%
                </p>
                <StatusBadge status={systemHealth.status} size="lg" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                System Uptime: <span className="font-medium">{systemHealth.uptime}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Database Health */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CircleStackIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Database Status
                    </dt>
                    <dd className="mt-1 flex items-center justify-between">
                      <StatusBadge status={systemHealth.database.status} />
                      <span className="text-sm text-gray-600">
                        {systemHealth.database.responseTime}ms response time
                      </span>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-500">Collections</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {systemHealth.database.collections}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {systemHealth.database.totalDocuments.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CpuChipIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Memory Usage
                    </dt>
                    <dd className="mt-1 flex items-center justify-between">
                      <StatusBadge status={systemHealth.memory.status} />
                      <span className="text-sm text-gray-600">
                        {systemHealth.memory.percentage.toFixed(1)}% used
                      </span>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <div className="overflow-hidden h-6 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${systemHealth.memory.percentage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                        systemHealth.memory.status === 'healthy'
                          ? 'bg-green-500'
                          : systemHealth.memory.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        {formatBytes(systemHealth.memory.used)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>0 MB</span>
                  <span>{formatBytes(systemHealth.memory.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Details */}
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Database Collections
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Detailed breakdown of database collections and storage
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => setDetailedView(!detailedView)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {detailedView ? 'Hide' : 'Show'} Details
              </button>
            </div>
          </div>

          {detailedView && collections.length > 0 && (
            <div className="mt-4 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Collection Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Documents
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Size
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Indexes
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Avg Doc Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {collections.map((collection) => (
                          <tr key={collection.name}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {collection.name}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {collection.documentCount.toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {formatBytes(collection.sizeInBytes)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {collection.indexes}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {formatBytes(collection.averageDocumentSize)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Performance Monitoring</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Memory usage above 80% may impact performance</li>
                  <li>Database response times should typically be under 100ms</li>
                  <li>Monitor collection sizes to optimize database indexes</li>
                  <li>System health score is calculated based on multiple factors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 