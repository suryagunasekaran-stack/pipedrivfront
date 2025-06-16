'use client';

import { useEffect, useState } from 'react';
import { dashboard } from '../utils/api';

interface DashboardData {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    totalProjects: number;
    totalSequences: number;
    currentYear: number;
    currentYearShort: number;
    systemUptime: number;
    timestamp: string;
  };
  companies: {
    totalCompanies: number;
    activeCompanies: number;
    inactiveCompanies: number;
    authConnections: {
      pipedrive: {
        total: number;
        active: number;
      };
    };
    recentCompanies: Array<{
      companyId: string;
      companyName: string;
      isActive: boolean;
      lastActivity: string;
    }>;
  };
  projects: {
    overview: {
      totalSequences: number;
      totalProjectMappings: number;
      currentYear: number;
      formattedCurrentYear: string;
    };
    departmentBreakdown: {
      sequences: Array<{
        departmentCode: string;
        count: number;
      }>;
      projects: any[];
    };
    currentYearActivity: any[];
    recentProjects: any[];
  };
  activity: {
    recentActions: Array<{
      action: string;
      target: string;
      timestamp: string;
      success: boolean;
      details: string;
    }>;
    actionSummary: Array<{
      action: string;
      count: number;
    }>;
    dailyActivity: Array<{
      date: string;
      total: number;
      successful: number;
      failed: number;
    }>;
  };
  health: {
    database: {
      connected: boolean;
      responseTime: number;
      status: string;
    };
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
      usage: number;
      status: string;
    };
    uptime: number;
    version: string;
    environment: string;
    activeSessions: number;
    timestamp: string;
    overallScore: number;
    status: string;
  };
}
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  BuildingOfficeIcon,
  DocumentDuplicateIcon,
  HashtagIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboard.getDashboardData();
      console.log('Dashboard data received:', dashboardData);
      setData(dashboardData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Admin Dashboard
            </h2>
          </div>
          <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4">
            <StatusBadge status={data.health.status} size="lg" />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Companies"
            value={data.overview.totalCompanies}
            icon={<BuildingOfficeIcon className="h-6 w-6" />}
            color="blue"
            description={`${data.overview.activeCompanies} active`}
          />
          <StatCard
            title="Total Projects"
            value={data.overview.totalProjects}
            icon={<DocumentDuplicateIcon className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="Total Sequences"
            value={data.overview.totalSequences}
            icon={<HashtagIcon className="h-6 w-6" />}
            color="yellow"
            description={`Year ${data.overview.currentYear}`}
          />
          <StatCard
            title="System Uptime"
            value={formatUptime(data.overview.systemUptime)}
            icon={<ClockIcon className="h-6 w-6" />}
            color={getHealthColor(data.health.status)}
          />
        </div>

        {/* Health Indicators */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Database Health */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Database Health
                </h3>
                <StatusBadge status={data.health.database.connected ? 'connected' : 'disconnected'} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Response Time</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {data.health.database.responseTime}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {data.health.database.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Connection</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {data.health.database.connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Health Score</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {data.health.overallScore}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Memory Usage
                </h3>
                <StatusBadge status={data.health.memory.status} />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Usage</p>
                  <p className="text-sm font-medium text-gray-900">
                    {data.health.memory.usage}%
                  </p>
                </div>
                <div className="mt-2 relative">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${data.health.memory.usage}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        data.health.memory.status === 'low' || data.health.memory.status === 'good'
                          ? 'bg-green-500'
                          : data.health.memory.status === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Used</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {data.health.memory.heapUsed} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">RSS</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {data.health.memory.rss} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <div className="mt-4 space-y-3">
                {data.activity.recentActions.length > 0 ? (
                  data.activity.recentActions.slice(0, 5).map((action, index) => (
                    <div key={`${action.timestamp}-${index}`} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {action.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <svg
                            className="h-5 w-5 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {action.action.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                           action.action.replace(/_/g, ' ').slice(1)}
                          {action.target && (
                            <span className="text-gray-500"> - {action.target}</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(action.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Stats
              </h3>
              <div className="mt-4 space-y-4">
                {/* Auth Connections */}
                <div>
                  <p className="text-sm font-medium text-gray-900">Auth Connections</p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Pipedrive</span>
                      <StatusBadge
                        status={data.companies.authConnections.pipedrive.active > 0 ? 'connected' : 'disconnected'}
                        text={`${data.companies.authConnections.pipedrive.total} companies`}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Department Breakdown */}
                {data.projects.departmentBreakdown.sequences.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Department Sequences</p>
                    <div className="mt-2 space-y-2">
                      {data.projects.departmentBreakdown.sequences.slice(0, 3).map((dept) => (
                        <div key={dept.departmentCode} className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{dept.departmentCode}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {dept.count} sequences
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Summary */}
                <div>
                  <p className="text-sm font-medium text-gray-900">Activity Summary</p>
                  <div className="mt-2 space-y-2">
                    {data.activity.actionSummary.slice(0, 3).map((summary) => (
                      <div key={summary.action} className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {summary.action.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                           summary.action.replace(/_/g, ' ').slice(1)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {summary.count} times
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 