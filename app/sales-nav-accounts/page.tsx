'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExternalLink, Pencil, Check, X, Search } from 'lucide-react';

interface SalesNavAccount {
  _id: string;
  account_index: number;
  name: string;
  email: string;
  active: boolean;
  status: string;
  in_cooldown?: boolean;
  cooldown_until?: string;
  last_error?: string;
  last_error_time?: string;
  error_count: number;
  updated_at?: string;
  linkedin_profile_url?: string;
}

export default function SalesNavAccountsPage() {
  const [accounts, setAccounts] = useState<SalesNavAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit LinkedIn URL state
  const [editingLinkedIn, setEditingLinkedIn] = useState<number | null>(null);
  const [editLinkedInValue, setEditLinkedInValue] = useState('');
  const [savingLinkedIn, setSavingLinkedIn] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/sales-nav-accounts/list');
      setAccounts(response.data.accounts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleToggle = async (accountIndex: number, currentActive: boolean) => {
    setToggling(accountIndex);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/sales-nav-accounts/toggle', {
        accountIndex,
        active: !currentActive,
      });

      setSuccess(response.data.message);

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.account_index === accountIndex
            ? { ...acc, active: !currentActive }
            : acc
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle account status');
    } finally {
      setToggling(null);
    }
  };

  // Start editing LinkedIn URL
  const handleStartEditLinkedIn = (account: SalesNavAccount) => {
    setEditingLinkedIn(account.account_index);
    setEditLinkedInValue(account.linkedin_profile_url || '');
    setError(null);
    setSuccess(null);
  };

  // Cancel editing LinkedIn URL
  const handleCancelEditLinkedIn = () => {
    setEditingLinkedIn(null);
    setEditLinkedInValue('');
  };

  // Save LinkedIn URL
  const handleSaveLinkedIn = async (accountIndex: number) => {
    setSavingLinkedIn(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/sales-nav-accounts/update-linkedin', {
        accountIndex,
        linkedinProfileUrl: editLinkedInValue.trim(),
      });

      setSuccess(response.data.message);

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.account_index === accountIndex
            ? { ...acc, linkedin_profile_url: editLinkedInValue.trim() || undefined }
            : acc
        )
      );

      setEditingLinkedIn(null);
      setEditLinkedInValue('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update LinkedIn URL');
    } finally {
      setSavingLinkedIn(false);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    // Apply status filter
    if (filter === 'active' && !acc.active) return false;
    if (filter === 'inactive' && acc.active) return false;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchesName = acc.name?.toLowerCase().includes(query);
      const matchesEmail = acc.email?.toLowerCase().includes(query);
      const matchesLinkedIn = acc.linkedin_profile_url?.toLowerCase().includes(query);
      const matchesIndex = acc.account_index.toString().includes(query);

      if (!matchesName && !matchesEmail && !matchesLinkedIn && !matchesIndex) {
        return false;
      }
    }

    return true;
  });

  const activeCount = accounts.filter((acc) => acc.active).length;
  const inactiveCount = accounts.length - activeCount;

  // Truncate LinkedIn URL for display
  const formatLinkedInUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path.length > 30) {
        return `linkedin.com${path.substring(0, 25)}...`;
      }
      return `linkedin.com${path}`;
    } catch {
      return url;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-medium text-neutral-900">
          Sales Nav Accounts
        </h1>
        <button
          onClick={loadAccounts}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Total Accounts</p>
          <p className="text-2xl font-medium text-neutral-900">
            {accounts.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Active</p>
          <p className="text-2xl font-medium text-green-700">
            {activeCount}
          </p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Inactive</p>
          <p className="text-2xl font-medium text-red-700">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, LinkedIn URL, or account index..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
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
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              filter === 'all'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              filter === 'active'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              filter === 'inactive'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Inactive ({inactiveCount})
          </button>

          {/* Search results count */}
          {searchQuery && (
            <span className="text-sm text-neutral-500 ml-2">
              {filteredAccounts.length} result{filteredAccounts.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 text-sm bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-500">Loading accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-lg">
          <p className="text-sm text-neutral-500">No accounts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAccounts.map((account) => (
            <div
              key={account._id}
              className="p-5 bg-white border border-neutral-200 rounded-lg"
            >
              <div className="flex items-start justify-between">
                {/* Account Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-base font-medium text-neutral-900">
                      {account.name}
                    </span>
                    <span className="text-xs text-neutral-500">
                      (#{account.account_index})
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        account.active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {account.active ? 'Active' : 'Inactive'}
                    </span>
                    {account.in_cooldown && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700">
                        In Cooldown
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-neutral-600 mb-2">
                    {account.email}
                  </p>

                  {/* LinkedIn Profile URL - Editable */}
                  <div className="mb-2">
                    {editingLinkedIn === account.account_index ? (
                      // Edit mode
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={editLinkedInValue}
                          onChange={(e) => setEditLinkedInValue(e.target.value)}
                          placeholder="https://www.linkedin.com/in/..."
                          className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={savingLinkedIn}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveLinkedIn(account.account_index)}
                          disabled={savingLinkedIn}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md disabled:opacity-50"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEditLinkedIn}
                          disabled={savingLinkedIn}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center gap-2">
                        {account.linkedin_profile_url ? (
                          <a
                            href={account.linkedin_profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {formatLinkedInUrl(account.linkedin_profile_url)}
                          </a>
                        ) : (
                          <span className="text-sm text-neutral-400 italic">
                            No LinkedIn URL
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEditLinkedIn(account)}
                          className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                          title="Edit LinkedIn URL"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Status: {account.status}</span>
                    {account.error_count > 0 && (
                      <span className="text-red-600">
                        {account.error_count} errors
                      </span>
                    )}
                  </div>

                  {/* Error Information */}
                  {account.last_error && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs font-medium text-red-800 mb-1">
                        Last Error:
                      </p>
                      <p className="text-xs text-red-700 break-words">
                        {account.last_error}
                      </p>
                      {account.last_error_time && (
                        <p className="text-xs text-neutral-500 mt-2">
                          {new Date(account.last_error_time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => handleToggle(account.account_index, account.active)}
                  disabled={toggling === account.account_index}
                  className={`ml-4 px-4 py-2 text-sm font-medium rounded-md transition-colors min-w-[100px] ${
                    toggling === account.account_index
                      ? 'bg-neutral-400 text-white cursor-not-allowed'
                      : account.active
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {toggling === account.account_index
                    ? 'Updating...'
                    : account.active
                    ? 'Disable'
                    : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
