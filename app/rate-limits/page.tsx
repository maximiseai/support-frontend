'use client';

import { useState } from 'react';
import axios from 'axios';
import QuickUpdateByEmail from './QuickUpdateByEmail';
import TeamAPIAccess from './TeamAPIAccess';

interface Team {
  _id: string;
  uid: string;
  name: string;
  members: Array<{ email: string }>;
  base_credit: number;
  credits_used: number;
  credits: number;
  api_limits: Record<string, number>;
  company_followers_per_team_rate_limit?: number;
  company_followers_per_request_limit?: number;
}

const COMMON_APIS = [
  { key: 'linkedin_profile_enrichment', name: 'LinkedIn Profile Enrichment', endpoint: '/v2/api/linkedin-to-email' },
  { key: 'company_followers', name: 'Company Followers', endpoint: '/v2/api/company-followers' },
  { key: 'email_validation', name: 'Email Validation', endpoint: '/v2/api/verify-email' },
  { key: 'email_finder', name: 'Email Finder', endpoint: '/v2/api/find-email' },
  { key: 'phone_validation', name: 'Phone Validation', endpoint: '/v1/api/phone-validation' },
  { key: 'bulk_enrichment', name: 'Bulk Enrichment', endpoint: '/v2/api/bulk' },
  { key: 'search_api', name: 'Search API', endpoint: '/v2/api/search' },
  { key: 'reverse_lookup', name: 'Reverse Lookup', endpoint: '/v1/api/reverse-lookup' },
  { key: 'company_lookup', name: 'Company Lookup', endpoint: '/v2/api/company/lookup' },
  { key: 'mobile_finder', name: 'Mobile Finder', endpoint: '/v1/api/mobile-finder' },
];

interface TeamAPI {
  endpoint: string;
  rateLimit: number;
  creditsPerCall: number;
  enabled: boolean;
}

export default function RateLimitsPage() {
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'name' | 'id'>('email');
  const [searching, setSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [teamApis, setTeamApis] = useState<Record<string, TeamAPI>>({});
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [bulkLimitValue, setBulkLimitValue] = useState('');
  const [dailyFollowersLimit, setDailyFollowersLimit] = useState('');
  const [maxFollowersLimit, setMaxFollowersLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.get('/api/teams/search', {
        params: {
          q: searchQuery.trim(),
          type: 'auto', // Use auto-detection
        },
      });

      setSearchResults(response.data.teams || []);

      if (response.data.teams?.length === 1) {
        handleSelectTeam(response.data.teams[0]);
      } else {
        setSelectedTeam(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search teams');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const fetchTeamAPIs = async (teamId: string) => {
    try {
      const response = await axios.get('/api/team-apis', {
        params: { teamId },
      });

      // Create a map of endpoint -> TeamAPI for quick lookup
      const apisMap: Record<string, TeamAPI> = {};
      if (response.data.apis) {
        response.data.apis.forEach((api: any) => {
          if (api.enabled) {
            apisMap[api.endpoint] = {
              endpoint: api.endpoint,
              rateLimit: api.rateLimit || 0,
              creditsPerCall: api.creditsPerCall || 0,
              enabled: api.enabled,
            };
          }
        });
      }
      setTeamApis(apisMap);
    } catch (err) {
      console.error('Failed to fetch team APIs:', err);
      setTeamApis({});
    }
  };

  const handleSelectTeam = async (team: Team) => {
    setSelectedTeam(team);
    setSearchResults([]);
    setError(null);
    setSuccess(null);
    setSelectedApis([]);
    setBulkLimitValue('');
    setDailyFollowersLimit(team.company_followers_per_team_rate_limit?.toString() || '');
    setMaxFollowersLimit(team.company_followers_per_request_limit?.toString() || '');

    // Fetch team-apis to show which APIs are enabled
    await fetchTeamAPIs(team._id);
  };

  const handleToggleApi = (apiKey: string) => {
    setSelectedApis((prev) =>
      prev.includes(apiKey)
        ? prev.filter((key) => key !== apiKey)
        : [...prev, apiKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedApis.length === COMMON_APIS.length) {
      setSelectedApis([]);
    } else {
      setSelectedApis(COMMON_APIS.map((api) => api.key));
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedTeam) {
      setError('Please select a team first');
      return;
    }

    if (selectedApis.length === 0) {
      setError('Please select at least one API');
      return;
    }

    const limit = parseInt(bulkLimitValue);
    if (isNaN(limit) || limit < 0) {
      setError('Please enter a valid non-negative number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update all selected APIs
      await axios.post('/api/rate-limits/bulk-update', {
        teamId: selectedTeam._id,
        apis: selectedApis,
        limit,
      });

      setSuccess(`Successfully updated rate limit to ${limit} for ${selectedApis.length} API(s)`);

      // Update local state
      const updatedLimits = { ...selectedTeam.api_limits };
      selectedApis.forEach((apiKey) => {
        updatedLimits[apiKey] = limit;
      });

      setSelectedTeam({
        ...selectedTeam,
        api_limits: updatedLimits,
      });

      // Clear selections
      setBulkLimitValue('');
      setSelectedApis([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update rate limits');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFollowersLimits = async () => {
    if (!selectedTeam) {
      setError('Please select a team first');
      return;
    }

    const dailyLimit = dailyFollowersLimit ? parseInt(dailyFollowersLimit) : null;
    const maxLimit = maxFollowersLimit ? parseInt(maxFollowersLimit) : null;

    if ((dailyLimit !== null && (isNaN(dailyLimit) || dailyLimit < 0)) ||
        (maxLimit !== null && (isNaN(maxLimit) || maxLimit < 0))) {
      setError('Please enter valid non-negative numbers');
      return;
    }

    if (dailyLimit === null && maxLimit === null) {
      setError('Please enter at least one limit value');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('/api/rate-limits/update-followers-limits', {
        teamId: selectedTeam._id,
        dailyLimit,
        maxLimit,
      });

      setSuccess('Successfully updated company followers limits');

      setSelectedTeam({
        ...selectedTeam,
        company_followers_per_team_rate_limit: dailyLimit || selectedTeam.company_followers_per_team_rate_limit,
        company_followers_per_request_limit: maxLimit || selectedTeam.company_followers_per_request_limit,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update followers limits');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !selectedTeam) {
      handleSearch();
    }
  };

  const getCurrentLimit = (apiKey: string) => {
    if (!selectedTeam) return 'Not set';

    // Find the endpoint for this API key
    const apiConfig = COMMON_APIS.find(api => api.key === apiKey);
    if (!apiConfig) return 'Not set';

    // Look up in teamApis using the endpoint
    const teamApi = teamApis[apiConfig.endpoint];
    if (teamApi && teamApi.enabled) {
      return `${teamApi.rateLimit}/min (${teamApi.creditsPerCall} credits)`;
    }

    // Fallback to old api_limits if not in team-apis
    return selectedTeam.api_limits?.[apiKey]?.toLocaleString() || 'Not enabled';
  };

  const isApiEnabled = (apiKey: string) => {
    const apiConfig = COMMON_APIS.find(api => api.key === apiKey);
    if (!apiConfig) return false;

    const teamApi = teamApis[apiConfig.endpoint];
    return teamApi?.enabled || false;
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-8" style={{ color: '#3e3832' }}>
        Team API Management
      </h1>

      {/* Search Section */}
      <div
        className="p-6 mb-6"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5dfd8',
          borderRadius: '4px',
        }}
      >
        <h2 className="text-base font-medium mb-4" style={{ color: '#3e3832' }}>
          Find Team
        </h2>

        <div className="space-y-4">
          {/* Search Type */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
              Search By
            </label>
            <div className="flex gap-3">
              {['email', 'name', 'id'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type as any)}
                  disabled={!!selectedTeam}
                  className="px-4 py-2 text-sm transition-all capitalize"
                  style={{
                    backgroundColor: searchType === type ? '#8b7355' : '#ffffff',
                    color: searchType === type ? '#ffffff' : '#8b7355',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                    opacity: selectedTeam ? 0.5 : 1,
                    cursor: selectedTeam ? 'not-allowed' : 'pointer',
                  }}
                >
                  {type === 'id' ? 'Team ID' : type === 'name' ? 'Team Name' : 'Email'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          {!selectedTeam && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                {searchType === 'email' && 'Member Email'}
                {searchType === 'name' && 'Team Name'}
                {searchType === 'id' && 'Team ID'}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Enter ${searchType}...`}
                  className="flex-1 px-4 py-2 text-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                    color: '#3e3832',
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: searching ? '#a8998a' : '#8b7355',
                    color: '#ffffff',
                    borderRadius: '4px',
                    cursor: searching ? 'not-allowed' : 'pointer',
                  }}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {/* Selected Team Display */}
          {selectedTeam && (
            <div
              className="p-4"
              style={{
                backgroundColor: '#faf8f5',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#3e3832' }}>
                    {selectedTeam.name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: '#a8998a' }}>
                    UID: {selectedTeam.uid}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTeam(null);
                    setSearchQuery('');
                    setSelectedApis([]);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs px-3 py-1 transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#8b7355',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                  }}
                >
                  Change Team
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 1 && !selectedTeam && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: '#a8998a' }}>
                Found {searchResults.length} teams. Select one:
              </p>
              {searchResults.map((team) => (
                <button
                  key={team._id}
                  onClick={() => handleSelectTeam(team)}
                  className="w-full text-left p-3 transition-all"
                  style={{
                    backgroundColor: '#faf8f5',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                    {team.name}
                  </p>
                  <p className="text-xs" style={{ color: '#a8998a' }}>
                    {team.members.length} members • {team.credits} credits
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Update by Email & Pattern */}
      {!selectedTeam && (
        <div
          className="p-6 mb-6"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <h2 className="text-base font-medium mb-4" style={{ color: '#3e3832' }}>
            Quick Update by Email & Endpoint Pattern
          </h2>
          
          <p className="text-sm mb-4" style={{ color: '#a8998a' }}>
            Update rate limits using member email and endpoint pattern matching. Use <code className="px-1" style={{ backgroundColor: '#faf8f5' }}>%</code> for wildcards (e.g., <code className="px-1" style={{ backgroundColor: '#faf8f5' }}>email%</code> matches "email_finder", "email_validation").
          </p>

          <QuickUpdateByEmail onSuccess={() => setSuccess('Rate limit updated successfully!')} />
        </div>
      )}

      {/* Company Followers Limits */}
      {selectedTeam && (
        <div
          className="p-6 mb-6"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <h2 className="text-base font-medium mb-4" style={{ color: '#3e3832' }}>
            Company Followers Limits
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Daily Limit */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                  Daily Requests Limit (per team/day)
                </label>
                <input
                  type="number"
                  value={dailyFollowersLimit}
                  onChange={(e) => setDailyFollowersLimit(e.target.value)}
                  placeholder="Enter daily limit..."
                  min="0"
                  className="w-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                    color: '#3e3832',
                  }}
                />
                {selectedTeam.company_followers_per_team_rate_limit !== undefined && (
                  <p className="text-xs mt-1" style={{ color: '#a8998a' }}>
                    Current: {selectedTeam.company_followers_per_team_rate_limit.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Max Limit */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                  Maximum Per Request
                </label>
                <input
                  type="number"
                  value={maxFollowersLimit}
                  onChange={(e) => setMaxFollowersLimit(e.target.value)}
                  placeholder="Enter max per request..."
                  min="0"
                  className="w-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                    color: '#3e3832',
                  }}
                />
                {selectedTeam.company_followers_per_request_limit !== undefined && (
                  <p className="text-xs mt-1" style={{ color: '#a8998a' }}>
                    Current: {selectedTeam.company_followers_per_request_limit.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleUpdateFollowersLimits}
              disabled={loading || (!dailyFollowersLimit && !maxFollowersLimit)}
              className="w-full py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  loading || (!dailyFollowersLimit && !maxFollowersLimit)
                    ? '#a8998a'
                    : '#8b7355',
                color: '#ffffff',
                borderRadius: '4px',
                cursor:
                  loading || (!dailyFollowersLimit && !maxFollowersLimit)
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {loading ? 'Updating...' : 'Update Followers Limits'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk API Rate Limits */}
      {selectedTeam && (
        <div
          className="p-6"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <h2 className="text-base font-medium mb-4" style={{ color: '#3e3832' }}>
            Quick Rate Limit Update
          </h2>
          <p className="text-sm mb-4" style={{ color: '#a8998a' }}>
            Quickly update rate limits for multiple APIs at once. For individual API management and dashboard visibility, use the "Team API Access & Dashboard Visibility" section below.
          </p>

          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #e5dfd8' }}>
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium transition-all"
                style={{ color: '#8b7355' }}
              >
                {selectedApis.length === COMMON_APIS.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-xs" style={{ color: '#a8998a' }}>
                {selectedApis.length} selected
              </span>
            </div>

            {/* API Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMON_APIS.map((api) => {
                const enabled = isApiEnabled(api.key);
                return (
                  <label
                    key={api.key}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-all"
                    style={{
                      backgroundColor: selectedApis.includes(api.key) ? '#faf8f5' : '#ffffff',
                      border: `1px solid ${enabled ? '#bbf7d0' : '#e5dfd8'}`,
                      borderRadius: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedApis.includes(api.key)}
                      onChange={() => handleToggleApi(api.key)}
                      className="w-4 h-4"
                      style={{ accentColor: '#8b7355' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                          {api.name}
                        </p>
                        {enabled && (
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                            }}
                          >
                            Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#a8998a' }}>
                        {enabled ? getCurrentLimit(api.key) : 'Not enabled'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Bulk Update Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                New Rate Limit (requests per minute)
              </label>
              <input
                type="number"
                value={bulkLimitValue}
                onChange={(e) => setBulkLimitValue(e.target.value)}
                placeholder="Enter rate limit for selected APIs..."
                min="0"
                disabled={selectedApis.length === 0}
                className="w-full px-4 py-2 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: '#3e3832',
                  opacity: selectedApis.length === 0 ? 0.5 : 1,
                }}
              />
            </div>

            <button
              onClick={handleBulkUpdate}
              disabled={loading || selectedApis.length === 0 || !bulkLimitValue}
              className="w-full py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  loading || selectedApis.length === 0 || !bulkLimitValue
                    ? '#a8998a'
                    : '#8b7355',
                color: '#ffffff',
                borderRadius: '4px',
                cursor:
                  loading || selectedApis.length === 0 || !bulkLimitValue
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {loading
                ? 'Updating...'
                : `Update ${selectedApis.length} Selected API${selectedApis.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Team API Access */}
      {selectedTeam && <TeamAPIAccess team={selectedTeam} />}

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
