'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ExternalLink,
  Pencil,
  Check,
  X,
  Search,
  Plus,
  Info,
  Shield,
  Server,
  Clock,
  AlertTriangle,
  Ban,
  Activity,
} from 'lucide-react';

interface ProxyConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface SalesNavAccount {
  _id: string;
  account_index: number;
  name: string;
  email: string;
  profile_urn?: string;
  two_fa_auth_token?: string;
  cookie_path?: string;
  proxy?: ProxyConfig;
  linkedin_profile_url?: string;
  location?: string;
  account_year?: string;
  connection_count?: number;
  recovery_email?: string;
  active: boolean;
  status: string;
  in_cooldown?: boolean;
  cooldown_until?: string;
  cooldown_reason?: string;
  last_error?: string;
  last_error_at?: string;
  error_count: number;
  permanently_disabled?: boolean;
  updated_at?: string;
  proxy_host?: string;
  daily_requests?: number;
  hourly_requests?: number;
  daily_followers?: number;
  daily_followers_limit?: number;
  has_2fa?: boolean;
}

interface AccountFormData {
  name: string;
  email: string;
  password: string;
  profile_urn: string;
  two_fa_auth_token: string;
  cookie_path: string;
  proxy: {
    host: string;
    port: string;
    username: string;
    password: string;
  };
  linkedin_profile_url: string;
  location: string;
  account_year: string;
  connection_count: string;
  recovery_email: string;
  active: boolean;
  permanently_disabled: boolean;
}

const emptyFormData: AccountFormData = {
  name: '',
  email: '',
  password: '',
  profile_urn: '',
  two_fa_auth_token: '',
  cookie_path: '',
  proxy: { host: '', port: '', username: '', password: '' },
  linkedin_profile_url: '',
  location: '',
  account_year: '',
  connection_count: '',
  recovery_email: '',
  active: false,
  permanently_disabled: false,
};

// Field tooltips explaining what each field means
const fieldTooltips: Record<string, string> = {
  name: 'Display name for this LinkedIn account. Used for identification in the dashboard.',
  email: 'LinkedIn login email address. Must be unique across all accounts.',
  password: 'LinkedIn login password. Will be encrypted using AES-256 before storing.',
  profile_urn: 'LinkedIn profile URN (unique identifier). Found in LinkedIn API responses.',
  two_fa_auth_token: '2FA secret key for generating TOTP codes. Required if 2FA is enabled on the LinkedIn account.',
  cookie_path: 'File path where browser cookies are stored. Used to maintain login session.',
  proxy_host: 'Proxy server hostname or IP address. Recommended to avoid LinkedIn rate limits.',
  proxy_port: 'Proxy server port number.',
  proxy_username: 'Proxy authentication username.',
  proxy_password: 'Proxy authentication password.',
  linkedin_profile_url: 'Full LinkedIn profile URL for this account.',
  location: 'Geographic location associated with this account.',
  account_year: 'Year the LinkedIn account was created.',
  connection_count: 'Number of LinkedIn connections this account has.',
  recovery_email: 'Recovery/backup email for the LinkedIn account.',
  active: 'Whether this account is enabled for scraping. Disabled accounts are skipped.',
  permanently_disabled: 'Marks account as permanently unusable (e.g., banned by LinkedIn). Cannot be used even if active is true.',
  status: 'Current operational status: available, busy, rate_limited, or error.',
  in_cooldown: 'Account is temporarily paused to avoid rate limits.',
  cooldown_reason: 'Explanation for why the account entered cooldown.',
  error_count: 'Number of consecutive errors. Account may be disabled after too many errors.',
  daily_requests: 'Number of API requests made today.',
  hourly_requests: 'Number of API requests made this hour.',
  daily_followers: 'Number of followers scraped today.',
  daily_followers_limit: 'Maximum followers that can be scraped per day.',
};

// Info tooltip component
function InfoTooltip({ field }: { field: string }) {
  const [show, setShow] = useState(false);
  const tooltip = fieldTooltips[field];
  if (!tooltip) return null;

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="text-neutral-400 hover:text-neutral-600"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.preventDefault();
          setShow(!show);
        }}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <div className="absolute z-50 left-0 bottom-full mb-2 w-64 p-2 text-xs bg-neutral-900 text-white rounded-lg shadow-lg">
          {tooltip}
          <div className="absolute left-2 top-full border-4 border-transparent border-t-neutral-900" />
        </div>
      )}
    </div>
  );
}

// Form field component
function FormField({
  label,
  field,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: {
  label: string;
  field: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <InfoTooltip field={field} />
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// Checkbox field component
function CheckboxField({
  label,
  field,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  field: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 disabled:opacity-50"
      />
      <span className="text-sm text-neutral-700">{label}</span>
      <InfoTooltip field={field} />
    </label>
  );
}

export default function SalesNavAccountsPage() {
  const [accounts, setAccounts] = useState<SalesNavAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAccountIndex, setEditingAccountIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<AccountFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  // Expanded account details
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null);

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
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.account_index === accountIndex ? { ...acc, active: !currentActive } : acc
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle account status');
    } finally {
      setToggling(null);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    setFormData(emptyFormData);
    setModalMode('create');
    setEditingAccountIndex(null);
    setShowModal(true);
    setError(null);
  };

  // Open edit modal
  const handleOpenEdit = (account: SalesNavAccount) => {
    setFormData({
      name: account.name || '',
      email: account.email || '',
      password: '', // Don't prefill password
      profile_urn: account.profile_urn || '',
      two_fa_auth_token: '', // Don't show existing 2FA token for security
      cookie_path: account.cookie_path || '',
      proxy: {
        host: account.proxy?.host || account.proxy_host || '',
        port: account.proxy?.port?.toString() || '',
        username: account.proxy?.username || '',
        password: '', // Don't prefill proxy password
      },
      linkedin_profile_url: account.linkedin_profile_url || '',
      location: account.location || '',
      account_year: account.account_year || '',
      connection_count: account.connection_count?.toString() || '',
      recovery_email: account.recovery_email || '',
      active: account.active,
      permanently_disabled: account.permanently_disabled || false,
    });
    setModalMode('edit');
    setEditingAccountIndex(account.account_index);
    setShowModal(true);
    setError(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        account_index: editingAccountIndex,
        proxy: {
          host: formData.proxy.host,
          port: formData.proxy.port,
          username: formData.proxy.username,
          password: formData.proxy.password,
        },
      };

      if (modalMode === 'create') {
        const response = await axios.post('/api/sales-nav-accounts/create', payload);
        setSuccess(response.data.message);
      } else {
        const response = await axios.post('/api/sales-nav-accounts/update', payload);
        setSuccess(response.data.message);
      }

      setShowModal(false);
      loadAccounts();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${modalMode} account`);
    } finally {
      setSaving(false);
    }
  };

  // Update form field
  const updateField = (field: keyof AccountFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update proxy field
  const updateProxyField = (field: keyof AccountFormData['proxy'], value: string) => {
    setFormData((prev) => ({
      ...prev,
      proxy: { ...prev.proxy, [field]: value },
    }));
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (filter === 'active' && !acc.active) return false;
    if (filter === 'inactive' && acc.active) return false;
    if (filter === 'disabled' && !acc.permanently_disabled) return false;

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
  const inactiveCount = accounts.filter((acc) => !acc.active && !acc.permanently_disabled).length;
  const disabledCount = accounts.filter((acc) => acc.permanently_disabled).length;

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
          LinkedIn Accounts Management
        </h1>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Total Accounts</p>
          <p className="text-2xl font-medium text-neutral-900">{accounts.length}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
            Active <InfoTooltip field="active" />
          </p>
          <p className="text-2xl font-medium text-green-700">{activeCount}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1">Inactive</p>
          <p className="text-2xl font-medium text-amber-700">{inactiveCount}</p>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-lg">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
            Permanently Disabled <InfoTooltip field="permanently_disabled" />
          </p>
          <p className="text-2xl font-medium text-red-700">{disabledCount}</p>
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
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              filter === 'inactive'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
          <button
            onClick={() => setFilter('disabled')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              filter === 'disabled'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            Permanently Disabled ({disabledCount})
          </button>

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
              className={`p-5 bg-white border rounded-lg ${
                account.permanently_disabled
                  ? 'border-red-300 bg-red-50'
                  : 'border-neutral-200'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Account Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-base font-medium text-neutral-900">
                      {account.name}
                    </span>
                    <span className="text-xs text-neutral-500">(#{account.account_index})</span>

                    {/* Status badges */}
                    <span
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                        account.active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {account.active ? 'Active' : 'Inactive'}
                    </span>

                    {account.permanently_disabled && (
                      <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 flex items-center gap-1">
                        <Ban className="h-3 w-3" />
                        Permanently Disabled
                      </span>
                    )}

                    {account.in_cooldown && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        In Cooldown
                      </span>
                    )}

                    {account.has_2fa && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        2FA
                      </span>
                    )}

                    {account.proxy_host && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        Proxy
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-neutral-600 mb-2">{account.email}</p>

                  {/* LinkedIn Profile URL */}
                  <div className="mb-2">
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
                      <span className="text-sm text-neutral-400 italic">No LinkedIn URL</span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Status: {account.status || 'unknown'}
                    </span>
                    {account.daily_requests !== undefined && (
                      <span>Daily: {account.daily_requests} req</span>
                    )}
                    {account.hourly_requests !== undefined && (
                      <span>Hourly: {account.hourly_requests} req</span>
                    )}
                    {account.daily_followers !== undefined && (
                      <span>
                        Followers: {account.daily_followers}/{account.daily_followers_limit || 20000}
                      </span>
                    )}
                    {account.error_count > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {account.error_count} errors
                      </span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {expandedAccount === account.account_index && (
                    <div className="mt-4 p-4 bg-neutral-50 rounded-lg text-sm space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-neutral-500">Proxy:</span>{' '}
                          <span className="text-neutral-700">
                            {account.proxy_host || 'Not configured'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Cookie Path:</span>{' '}
                          <span className="text-neutral-700 break-all">
                            {account.cookie_path || 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Location:</span>{' '}
                          <span className="text-neutral-700">{account.location || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Account Year:</span>{' '}
                          <span className="text-neutral-700">
                            {account.account_year || 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Connections:</span>{' '}
                          <span className="text-neutral-700">
                            {account.connection_count || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Updated:</span>{' '}
                          <span className="text-neutral-700">
                            {account.updated_at
                              ? new Date(account.updated_at).toLocaleString()
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                      {account.cooldown_reason && (
                        <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                          <span className="text-amber-800">
                            Cooldown reason: {account.cooldown_reason}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Information */}
                  {account.last_error && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs font-medium text-red-800 mb-1">Last Error:</p>
                      <p className="text-xs text-red-700 break-words">{account.last_error}</p>
                      {account.last_error_at && (
                        <p className="text-xs text-neutral-500 mt-2">
                          {new Date(account.last_error_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleOpenEdit(account)}
                    className="px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors flex items-center gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      setExpandedAccount(
                        expandedAccount === account.account_index ? null : account.account_index
                      )
                    }
                    className="px-3 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    {expandedAccount === account.account_index ? 'Less' : 'More'}
                  </button>

                  <button
                    onClick={() => handleToggle(account.account_index, account.active)}
                    disabled={toggling === account.account_index || account.permanently_disabled}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      toggling === account.account_index || account.permanently_disabled
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : account.active
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {toggling === account.account_index
                      ? '...'
                      : account.active
                      ? 'Disable'
                      : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-neutral-900">
                  {modalMode === 'create' ? 'Add New Account' : 'Edit Account'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Name"
                    field="name"
                    value={formData.name}
                    onChange={(v) => updateField('name', v)}
                    placeholder="Account display name"
                    required
                  />
                  <FormField
                    label="Email"
                    field="email"
                    type="email"
                    value={formData.email}
                    onChange={(v) => updateField('email', v)}
                    placeholder="linkedin@example.com"
                    required
                  />
                </div>
              </div>

              {/* Credentials */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Credentials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label={modalMode === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}
                    field="password"
                    type="password"
                    value={formData.password}
                    onChange={(v) => updateField('password', v)}
                    placeholder={modalMode === 'edit' ? '••••••••' : 'LinkedIn password'}
                    required={modalMode === 'create'}
                  />
                  <FormField
                    label="2FA Secret Token"
                    field="two_fa_auth_token"
                    value={formData.two_fa_auth_token}
                    onChange={(v) => updateField('two_fa_auth_token', v)}
                    placeholder="TOTP secret key"
                  />
                  <FormField
                    label="Profile URN"
                    field="profile_urn"
                    value={formData.profile_urn}
                    onChange={(v) => updateField('profile_urn', v)}
                    placeholder="ACoAAB..."
                  />
                  <FormField
                    label="Cookie Path"
                    field="cookie_path"
                    value={formData.cookie_path}
                    onChange={(v) => updateField('cookie_path', v)}
                    placeholder="./cookie-jar/cookies-Name.json"
                  />
                </div>
              </div>

              {/* Proxy Configuration */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                  Proxy Configuration
                  <InfoTooltip field="proxy_host" />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Host"
                    field="proxy_host"
                    value={formData.proxy.host}
                    onChange={(v) => updateProxyField('host', v)}
                    placeholder="proxy.example.com"
                  />
                  <FormField
                    label="Port"
                    field="proxy_port"
                    value={formData.proxy.port}
                    onChange={(v) => updateProxyField('port', v)}
                    placeholder="8080"
                  />
                  <FormField
                    label="Username"
                    field="proxy_username"
                    value={formData.proxy.username}
                    onChange={(v) => updateProxyField('username', v)}
                    placeholder="proxy_user"
                  />
                  <FormField
                    label="Password"
                    field="proxy_password"
                    type="password"
                    value={formData.proxy.password}
                    onChange={(v) => updateProxyField('password', v)}
                    placeholder={modalMode === 'edit' ? '••••••••' : 'proxy_password'}
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="LinkedIn Profile URL"
                    field="linkedin_profile_url"
                    value={formData.linkedin_profile_url}
                    onChange={(v) => updateField('linkedin_profile_url', v)}
                    placeholder="https://linkedin.com/in/..."
                  />
                  <FormField
                    label="Location"
                    field="location"
                    value={formData.location}
                    onChange={(v) => updateField('location', v)}
                    placeholder="City, Country"
                  />
                  <FormField
                    label="Account Year"
                    field="account_year"
                    value={formData.account_year}
                    onChange={(v) => updateField('account_year', v)}
                    placeholder="2020"
                  />
                  <FormField
                    label="Connection Count"
                    field="connection_count"
                    value={formData.connection_count}
                    onChange={(v) => updateField('connection_count', v)}
                    placeholder="500"
                  />
                  <FormField
                    label="Recovery Email"
                    field="recovery_email"
                    type="email"
                    value={formData.recovery_email}
                    onChange={(v) => updateField('recovery_email', v)}
                    placeholder="backup@example.com"
                  />
                </div>
              </div>

              {/* Status (edit mode only) */}
              {modalMode === 'edit' && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-3">Status</h3>
                  <div className="flex gap-6">
                    <CheckboxField
                      label="Active"
                      field="active"
                      checked={formData.active}
                      onChange={(v) => updateField('active', v)}
                    />
                    <CheckboxField
                      label="Permanently Disabled"
                      field="permanently_disabled"
                      checked={formData.permanently_disabled}
                      onChange={(v) => updateField('permanently_disabled', v)}
                    />
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? 'Saving...'
                    : modalMode === 'create'
                    ? 'Create Account'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
