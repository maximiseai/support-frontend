'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
} from 'lucide-react';

interface TeamLog {
  _id: string;
  uid: string;
  team_uid: string;
  team_name: string;
  endpoint: string;
  method: string;
  status_code: number;
  credits_used: number;
  before_balance?: number;
  after_balance?: number;
  latency: string;
  ip: string;
  request_id: string;
  createdAt: string;
}

interface Team {
  _id: string;
  uid: string;
  name: string;
  current_credits: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// Convert to IST (Indian Standard Time - UTC+5:30)
const formatToIST = (dateString: string) => {
  const date = new Date(dateString);
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);

  const day = istDate.getUTCDate().toString().padStart(2, '0');
  const month = istDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = istDate.getUTCFullYear();
  const hours = istDate.getUTCHours().toString().padStart(2, '0');
  const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
  const seconds = istDate.getUTCSeconds().toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} IST`;
};

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<TeamLog[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
  });

  // Filters
  const [teamFilter, setTeamFilter] = useState('');
  const [endpointFilter, setEndpointFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      if (teamFilter) params.set('teamId', teamFilter);
      if (endpointFilter) params.set('endpoint', endpointFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await axios.get(`/api/teams/logs?${params.toString()}`);
      setLogs(response.data.logs || []);
      setTeam(response.data.team);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = () => {
    loadLogs(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setTeamFilter('');
    setEndpointFilter('');
    setStatusFilter('');
    setTimeout(() => loadLogs(1), 0);
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    if (status === 429) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-amber-100 text-amber-700',
      DELETE: 'bg-red-100 text-red-700',
      PATCH: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-mono font-medium rounded ${colors[method] || 'bg-neutral-100 text-neutral-700'}`}>
        {method}
      </span>
    );
  };

  // Stats from current page
  const stats = {
    total: pagination.totalCount,
    success: logs.filter((l) => l.status_code >= 200 && l.status_code < 300).length,
    errors: logs.filter((l) => l.status_code >= 400).length,
    totalCredits: logs.reduce((sum, l) => sum + (l.credits_used || 0), 0),
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-neutral-900">API Logs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${
              showFilters
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={() => loadLogs(pagination.page)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Total Logs</p>
          <p className="text-2xl font-medium text-neutral-900">{stats.total.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Success (This Page)</p>
          <p className="text-2xl font-medium text-green-600">{stats.success}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Errors (This Page)</p>
          <p className="text-2xl font-medium text-red-600">{stats.errors}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Credits Used (This Page)</p>
          <p className="text-2xl font-medium text-blue-600">{stats.totalCredits.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-white border border-neutral-200 rounded-lg mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Team (ID, UID, or Name)
              </label>
              <input
                type="text"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search team..."
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Endpoint
              </label>
              <input
                type="text"
                value={endpointFilter}
                onChange={(e) => setEndpointFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="/v2/api/..."
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">
                Status Code
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="">All Statuses</option>
                <option value="200">200 - OK</option>
                <option value="201">201 - Created</option>
                <option value="202">202 - Accepted</option>
                <option value="400">400 - Bad Request</option>
                <option value="401">401 - Unauthorized</option>
                <option value="403">403 - Forbidden</option>
                <option value="404">404 - Not Found</option>
                <option value="429">429 - Rate Limited</option>
                <option value="500">500 - Server Error</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50"
              >
                Search
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Info (when filtered by team) */}
      {team && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">{team.name}</h3>
              <p className="text-xs text-blue-700 mt-1">UID: {team.uid}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">Current Credits</p>
              <p className="text-lg font-medium text-blue-900">{team.current_credits?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-neutral-400" />
          <p className="text-sm text-neutral-500">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-500">No logs found</p>
          <p className="text-xs text-neutral-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Timestamp (IST)
                    </div>
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Team
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Method
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Endpoint
                  </th>
                  <th className="text-center text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Credits
                  </th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Latency
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log._id || log.uid} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-neutral-700">
                        {formatToIST(log.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-[200px]">
                        <p className="text-sm font-medium text-neutral-900" title={log.team_name}>
                          {log.team_name}
                        </p>
                        <p className="text-xs text-neutral-400 font-mono" title={log.team_uid}>
                          {log.team_uid}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getMethodBadge(log.method)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-neutral-700 break-all">
                        {log.endpoint}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(log.status_code)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${log.credits_used > 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                        {log.credits_used > 0 ? `-${log.credits_used}` : '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-neutral-500">
                        {log.latency}ms
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-neutral-400 truncate block max-w-[120px]" title={log.ip}>
                        {log.ip?.split(',')[0] || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount.toLocaleString()} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadLogs(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="p-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-neutral-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => loadLogs(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="p-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
