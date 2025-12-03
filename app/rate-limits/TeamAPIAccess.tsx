'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface API {
  _id: string;
  name: string;
  slug: string;
  enabled: boolean;
  endpoint?: string;
  rateLimit?: number;
  creditsPerCall?: number;
  hasBulk?: boolean;
  dashboardEnabled?: boolean;
  // Global API settings (from apis collection)
  globalActive?: boolean;
  globalDashboardEnabled?: boolean;
  // Computed: will this actually show on client dashboard?
  willShowOnDashboard?: boolean;
}

interface Team {
  _id: string;
  name: string;
}

interface TeamAPIAccessProps {
  team: Team;
}

interface EditingState {
  apiId: string;
  rateLimit: string;
  creditsPerCall: string;
}

export default function TeamAPIAccess({ team }: TeamAPIAccessProps) {
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingApiId, setUpdatingApiId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApiToGrant, setSelectedApiToGrant] = useState<string>('');
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [editingApi, setEditingApi] = useState<EditingState | null>(null);

  const fetchTeamAPIs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/team-apis', {
        params: { teamId: team._id },
      });
      setApis(response.data.apis);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch team APIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAPIs();
  }, [team._id]);

  const handleGrantAccess = async () => {
    if (!selectedApiToGrant) return;

    setGrantingAccess(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedApi = apis.find(a => a._id === selectedApiToGrant);
      if (!selectedApi) return;

      const endpoint = selectedApi.endpoint || `/v2/api/${selectedApi.slug}`;

      const response = await axios.post('/api/team-apis', {
        teamId: team._id,
        apiId: selectedApi._id,
        endpoint,
        enabled: true,
        rateLimit: selectedApi.rateLimit || 100,
        creditsPerCall: selectedApi.creditsPerCall || 1,
        dashboardEnabled: true,
      });

      setSuccess(response.data.message);
      setSelectedApiToGrant('');

      // Refresh the list
      await fetchTeamAPIs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant API access');
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleToggleAccess = async (api: API) => {
    setUpdatingApiId(api._id);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = api.endpoint || `/v2/api/${api.slug}`;

      const response = await axios.post('/api/team-apis', {
        teamId: team._id,
        apiId: api._id,
        endpoint,
        enabled: !api.enabled,
        rateLimit: api.rateLimit || 100,
        creditsPerCall: api.creditsPerCall || 1,
      });

      setSuccess(response.data.message);

      // Update local state
      setApis(apis.map(a =>
        a._id === api._id
          ? { ...a, enabled: !api.enabled }
          : a
      ));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update API access');
    } finally {
      setUpdatingApiId(null);
    }
  };

  const handleToggleDashboardVisibility = async (api: API) => {
    setUpdatingApiId(api._id);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = api.endpoint || `/v2/api/${api.slug}`;

      const response = await axios.post('/api/team-apis', {
        teamId: team._id,
        apiId: api._id,
        endpoint,
        dashboardEnabled: !api.dashboardEnabled,
      });

      setSuccess(response.data.message);

      // Update local state
      setApis(apis.map(a =>
        a._id === api._id
          ? { ...a, dashboardEnabled: !api.dashboardEnabled }
          : a
      ));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update dashboard visibility');
    } finally {
      setUpdatingApiId(null);
    }
  };

  const handleStartEdit = (api: API) => {
    setEditingApi({
      apiId: api._id,
      rateLimit: (api.rateLimit || 100).toString(),
      creditsPerCall: (api.creditsPerCall || 1).toString(),
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingApi(null);
  };

  const handleSaveSettings = async (api: API) => {
    if (!editingApi) return;

    const rateLimit = parseInt(editingApi.rateLimit);
    const creditsPerCall = parseFloat(editingApi.creditsPerCall);

    if (isNaN(rateLimit) || rateLimit < 0) {
      setError('Rate limit must be a non-negative number');
      return;
    }

    if (isNaN(creditsPerCall) || creditsPerCall < 0) {
      setError('Credits per call must be a non-negative number');
      return;
    }

    setUpdatingApiId(api._id);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = api.endpoint || `/v2/api/${api.slug}`;

      const response = await axios.patch('/api/team-apis', {
        teamId: team._id,
        endpoint,
        rateLimit,
        creditsPerCall,
      });

      setSuccess(response.data.message);

      // Update local state
      setApis(apis.map(a =>
        a._id === api._id
          ? { ...a, rateLimit, creditsPerCall }
          : a
      ));

      setEditingApi(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update API settings');
    } finally {
      setUpdatingApiId(null);
    }
  };

  const filteredApis = apis.filter(api =>
    api.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = filteredApis.filter(api => api.enabled).length;
  const disabledCount = filteredApis.filter(api => !api.enabled).length;
  const dashboardVisibleCount = filteredApis.filter(api => api.willShowOnDashboard).length;

  const availableApisToGrant = apis.filter(api => !api.enabled);

  return (
    <div
      className="p-6 mt-6"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5dfd8',
        borderRadius: '4px',
      }}
    >
      <h2 className="text-base font-medium mb-4" style={{ color: '#3e3832' }}>
        Team API Access & Dashboard Visibility
      </h2>

      <p className="text-sm mb-4" style={{ color: '#a8998a' }}>
        Manage which APIs {team.name} can access, control dashboard visibility, and set custom rate limits & credit costs per API.
      </p>

      {/* Grant New API Access */}
      <div
        className="p-4 mb-4"
        style={{
          backgroundColor: '#faf8f5',
          border: '1px solid #e5dfd8',
          borderRadius: '4px',
        }}
      >
        <h3 className="text-sm font-medium mb-3" style={{ color: '#3e3832' }}>
          Grant New API Access
        </h3>
        <div className="flex gap-3">
          <select
            value={selectedApiToGrant}
            onChange={(e) => setSelectedApiToGrant(e.target.value)}
            className="flex-1 px-4 py-2 text-sm"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5dfd8',
              borderRadius: '4px',
              color: '#3e3832',
            }}
            disabled={grantingAccess}
          >
            <option value="">Select an API to grant access...</option>
            {availableApisToGrant.map((api) => (
              <option key={api._id} value={api._id}>
                {api.name} ({api.endpoint})
              </option>
            ))}
          </select>
          <button
            onClick={handleGrantAccess}
            disabled={!selectedApiToGrant || grantingAccess}
            className="px-6 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor:
                !selectedApiToGrant || grantingAccess ? '#a8998a' : '#8b7355',
              color: '#ffffff',
              borderRadius: '4px',
              cursor: !selectedApiToGrant || grantingAccess ? 'not-allowed' : 'pointer',
            }}
          >
            {grantingAccess ? 'Granting...' : 'Grant Access'}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: '#a8998a' }}>
          APIs are granted with default settings. You can customize rate limits and credits per call after granting.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div
          className="p-3 text-center"
          style={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <p className="text-xs" style={{ color: '#a8998a' }}>Total APIs</p>
          <p className="text-xl font-medium mt-1" style={{ color: '#3e3832' }}>{apis.length}</p>
        </div>
        <div
          className="p-3 text-center"
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
          }}
        >
          <p className="text-xs" style={{ color: '#166534' }}>Team Enabled</p>
          <p className="text-xl font-medium mt-1" style={{ color: '#166534' }}>{enabledCount}</p>
        </div>
        <div
          className="p-3 text-center"
          style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: '4px',
          }}
        >
          <p className="text-xs" style={{ color: '#1e40af' }}>Dashboard Visible</p>
          <p className="text-xl font-medium mt-1" style={{ color: '#1e40af' }}>{dashboardVisibleCount}</p>
        </div>
        <div
          className="p-3 text-center"
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
          }}
        >
          <p className="text-xs" style={{ color: '#991b1b' }}>Team Disabled</p>
          <p className="text-xl font-medium mt-1" style={{ color: '#991b1b' }}>{disabledCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search APIs..."
          className="w-full px-4 py-2 text-sm"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
            color: '#3e3832',
          }}
        />
      </div>

      {/* APIs List */}
      {loading ? (
        <div className="p-8 text-center" style={{ color: '#a8998a' }}>
          Loading APIs...
        </div>
      ) : filteredApis.length === 0 ? (
        <div className="p-8 text-center" style={{ color: '#a8998a' }}>
          No APIs found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApis.map((api) => {
            const isEditing = editingApi?.apiId === api._id;
            
            return (
              <div
                key={api._id}
                className="p-4"
                style={{
                  backgroundColor: api.enabled ? '#faf8f5' : '#ffffff',
                  border: `2px solid ${api.enabled ? '#bbf7d0' : '#e5dfd8'}`,
                  borderRadius: '4px',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                        {api.name}
                      </p>
                      {/* Final status - will it show on dashboard? */}
                      {api.willShowOnDashboard ? (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded"
                          style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                          }}
                        >
                          ✓ Will Show
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded"
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                          }}
                        >
                          ✗ Won't Show
                        </span>
                      )}
                      {api.hasBulk && (
                        <span
                          className="px-2 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                          }}
                        >
                          Bulk
                        </span>
                      )}
                    </div>
                    <code className="text-xs" style={{ color: '#a8998a' }}>
                      {api.endpoint}
                    </code>
                    {/* Team settings control visibility */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Team settings - these control visibility */}
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded"
                        style={{
                          backgroundColor: api.enabled ? '#dcfce7' : '#fee2e2',
                          color: api.enabled ? '#166534' : '#991b1b',
                        }}
                      >
                        Team Access: {api.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded"
                        style={{
                          backgroundColor: api.dashboardEnabled ? '#dbeafe' : '#fee2e2',
                          color: api.dashboardEnabled ? '#1e40af' : '#991b1b',
                        }}
                      >
                        Dashboard: {api.dashboardEnabled ? 'Visible' : 'Hidden'}
                      </span>
                      {/* Global settings - shown as reference only */}
                      <span
                        className="px-2 py-0.5 text-xs rounded opacity-60"
                        style={{
                          backgroundColor: '#f5f5f5',
                          color: '#737373',
                          border: '1px solid #e5e5e5',
                        }}
                        title="Global settings are defaults for new teams only"
                      >
                        Default: {api.globalActive && api.globalDashboardEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settings Display / Edit */}
                {api.enabled && (
                  <div
                    className="p-3 mb-3"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5dfd8',
                      borderRadius: '4px',
                    }}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: '#3e3832' }}>
                              Rate Limit (per minute)
                            </label>
                            <input
                              type="number"
                              value={editingApi.rateLimit}
                              onChange={(e) => setEditingApi({ ...editingApi, rateLimit: e.target.value })}
                              min="0"
                              className="w-full px-3 py-1.5 text-sm"
                              style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5dfd8',
                                borderRadius: '4px',
                                color: '#3e3832',
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: '#3e3832' }}>
                              Credits Per Call
                            </label>
                            <input
                              type="number"
                              value={editingApi.creditsPerCall}
                              onChange={(e) => setEditingApi({ ...editingApi, creditsPerCall: e.target.value })}
                              min="0"
                              step="0.1"
                              className="w-full px-3 py-1.5 text-sm"
                              style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5dfd8',
                                borderRadius: '4px',
                                color: '#3e3832',
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveSettings(api)}
                            disabled={updatingApiId === api._id}
                            className="px-4 py-1.5 text-xs font-medium transition-all"
                            style={{
                              backgroundColor: '#166534',
                              color: '#ffffff',
                              borderRadius: '4px',
                              cursor: updatingApiId === api._id ? 'not-allowed' : 'pointer',
                              opacity: updatingApiId === api._id ? 0.5 : 1,
                            }}
                          >
                            {updatingApiId === api._id ? 'Saving...' : 'Save Settings'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updatingApiId === api._id}
                            className="px-4 py-1.5 text-xs font-medium transition-all"
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#3e3832',
                              border: '1px solid #e5dfd8',
                              borderRadius: '4px',
                              cursor: updatingApiId === api._id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs" style={{ color: '#a8998a' }}>Rate Limit</p>
                            <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                              {api.rateLimit || 100}/min
                            </p>
                          </div>
                          <div>
                            <p className="text-xs" style={{ color: '#a8998a' }}>Credits Per Call</p>
                            <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                              {api.creditsPerCall || 1} credit{(api.creditsPerCall || 1) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartEdit(api)}
                          disabled={updatingApiId === api._id}
                          className="px-3 py-1 text-xs font-medium transition-all"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#8b7355',
                            border: '1px solid #e5dfd8',
                            borderRadius: '4px',
                            cursor: updatingApiId === api._id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Edit Settings
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleToggleAccess(api)}
                    disabled={updatingApiId === api._id || isEditing}
                    className="px-4 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: api.enabled ? '#fee2e2' : '#dcfce7',
                      color: api.enabled ? '#991b1b' : '#166534',
                      borderRadius: '4px',
                      cursor: (updatingApiId === api._id || isEditing) ? 'not-allowed' : 'pointer',
                      opacity: (updatingApiId === api._id || isEditing) ? 0.5 : 1,
                    }}
                  >
                    {updatingApiId === api._id ? 'Updating...' : api.enabled ? 'Revoke Access' : 'Enable Access'}
                  </button>

                  {api.enabled && (
                    <button
                      onClick={() => handleToggleDashboardVisibility(api)}
                      disabled={updatingApiId === api._id || isEditing}
                      className="px-4 py-1.5 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: api.dashboardEnabled ? '#fef3c7' : '#dbeafe',
                        color: api.dashboardEnabled ? '#92400e' : '#1e40af',
                        borderRadius: '4px',
                        cursor: (updatingApiId === api._id || isEditing) ? 'not-allowed' : 'pointer',
                        opacity: (updatingApiId === api._id || isEditing) ? 0.5 : 1,
                      }}
                    >
                      {updatingApiId === api._id
                        ? 'Updating...'
                        : api.dashboardEnabled
                        ? 'Hide from Dashboard'
                        : 'Show in Dashboard'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div
          className="mt-4 p-3 text-sm"
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="mt-4 p-3 text-sm"
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
            color: '#166534',
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
}
