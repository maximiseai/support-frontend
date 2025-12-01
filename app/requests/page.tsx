'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw,
  Search,
  X,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CompanyFollowersRequest {
  _id: string;
  uid: string;
  team_uid: string;
  endpoint: string;
  status: string;
  retry_status: string;
  retry_count: number;
  current_attempt: number;
  max_retries: number;
  linkedin_url: string;
  max_limit: string;
  total_followers: number;
  scraped_count: number;
  progress: number;
  account_used: number | null;
  excluded_accounts: number[];
  last_error: string | null;
  status_message: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  failed_at: string | null;
  completed_at: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<CompanyFollowersRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadRequests = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '50');
      if (statusFilter) params.set('status', statusFilter);
      if (teamFilter) params.set('team_uid', teamFilter);

      const response = await axios.get(`/api/requests/list?${params.toString()}`);
      setRequests(response.data.requests || []);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, teamFilter]);

  const handleRetry = async (requestId: string) => {
    setRetrying(requestId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/requests/retry', { requestId });
      setSuccess(response.data.message);
      // Reload requests to see updated status
      loadRequests(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retry request');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 animate-spin" />
            In Progress
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const filteredRequests = requests.filter((req) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        req.linkedin_url?.toLowerCase().includes(query) ||
        req.uid?.toLowerCase().includes(query) ||
        req.team_uid?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    inProgress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    failed: requests.filter((r) => r.status === 'failed').length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-neutral-900">
          Company Followers Requests
        </h1>
        <button
          onClick={() => loadRequests(pagination.page)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Total</p>
          <p className="text-2xl font-medium text-neutral-900">{pagination.total}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Pending</p>
          <p className="text-2xl font-medium text-amber-600">{stats.pending}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">In Progress</p>
          <p className="text-2xl font-medium text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Completed</p>
          <p className="text-2xl font-medium text-green-600">{stats.completed}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Failed</p>
          <p className="text-2xl font-medium text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by LinkedIn URL, UID, or Team UID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        {/* Team Filter */}
        <input
          type="text"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          placeholder="Filter by Team UID"
          className="px-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 w-[250px]"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 text-sm bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Requests Table */}
      {loading ? (
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-neutral-400" />
          <p className="text-sm text-neutral-500">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-500">No requests found</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    LinkedIn URL
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Progress
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Team UID
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Account
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Created
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wide px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="max-w-[250px]">
                        {req.linkedin_url ? (
                          <a
                            href={req.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{req.linkedin_url.replace('https://www.linkedin.com/company/', '')}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5 truncate" title={req.uid}>
                          {req.uid}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {getStatusBadge(req.status)}
                        {req.last_error && (
                          <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={req.last_error}>
                            {req.last_error}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="font-medium">{req.scraped_count}</span>
                        <span className="text-neutral-400"> / {req.total_followers || req.max_limit || '?'}</span>
                      </div>
                      {req.total_followers > 0 && (
                        <div className="w-24 h-1.5 bg-neutral-200 rounded-full mt-1">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min((req.scraped_count / req.total_followers) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-neutral-600 truncate block max-w-[150px]" title={req.team_uid}>
                        {req.team_uid}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600">
                        {req.account_used !== null ? `#${req.account_used}` : '-'}
                      </span>
                      {req.excluded_accounts?.length > 0 && (
                        <p className="text-xs text-neutral-400">
                          Excluded: {req.excluded_accounts.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-600">
                        {formatDate(req.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(req.status === 'failed' || req.retry_status === 'exhausted') && (
                        <button
                          onClick={() => handleRetry(req._id)}
                          disabled={retrying === req._id}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {retrying === req._id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Retry
                            </>
                          )}
                        </button>
                      )}
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadRequests(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="p-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-neutral-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => loadRequests(pagination.page + 1)}
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
