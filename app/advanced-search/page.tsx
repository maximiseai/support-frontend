'use client';

import { useState } from 'react';
import axios from 'axios';

interface ApiConfig {
  api_name: string;
  current_limit: number;
  unlimited?: boolean;
  status?: string;
  needs_attention?: boolean;
}

interface TeamResult {
  _id: string;
  name: string;
  members: Array<{ email: string; name?: string; role?: string }>;
  credits: number;
  api_summary?: ApiConfig[];
  matching_apis?: ApiConfig[];
  total_apis: number;
}

interface MemberLookupTeam {
  team: {
    _id: string;
    name: string;
    credits: number;
    total_members: number;
  };
  matching_members: Array<{ email: string; name?: string; role?: string }>;
  api_configurations: {
    total_apis: number;
    all_apis: ApiConfig[];
    by_status: {
      disabled: ApiConfig[];
      low: ApiConfig[];
      normal: ApiConfig[];
      high: ApiConfig[];
      unlimited: ApiConfig[];
    };
  };
}

type SearchMode = 'unified' | 'by_api' | 'by_member';

export default function AdvancedSearchPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>('unified');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let response;

      switch (searchMode) {
        case 'unified':
          // Use advanced search that auto-detects
          response = await axios.get('/api/teams/search-advanced', {
            params: {
              q: searchQuery.trim(),
              includeApiDetails: true
            }
          });
          break;

        case 'by_api':
          // Search by API endpoint
          response = await axios.get('/api/teams/by-api', {
            params: {
              api: searchQuery.trim()
            }
          });
          break;

        case 'by_member':
          // Search by member email
          response = await axios.get('/api/teams/by-member', {
            params: {
              email: searchQuery.trim()
            }
          });
          break;
      }

      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-8" style={{ color: '#3e3832' }}>
        Advanced Search
      </h1>

      {/* Search Mode Selector */}
      <div
        className="p-6 mb-6"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5dfd8',
          borderRadius: '4px',
        }}
      >
        <div className="space-y-4">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
              Search Mode
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSearchMode('unified')}
                className="px-4 py-2 text-sm transition-all"
                style={{
                  backgroundColor: searchMode === 'unified' ? '#8b7355' : '#ffffff',
                  color: searchMode === 'unified' ? '#ffffff' : '#8b7355',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                }}
              >
                Unified Search
              </button>
              <button
                onClick={() => setSearchMode('by_api')}
                className="px-4 py-2 text-sm transition-all"
                style={{
                  backgroundColor: searchMode === 'by_api' ? '#8b7355' : '#ffffff',
                  color: searchMode === 'by_api' ? '#ffffff' : '#8b7355',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                }}
              >
                By API Endpoint
              </button>
              <button
                onClick={() => setSearchMode('by_member')}
                className="px-4 py-2 text-sm transition-all"
                style={{
                  backgroundColor: searchMode === 'by_member' ? '#8b7355' : '#ffffff',
                  color: searchMode === 'by_member' ? '#ffffff' : '#8b7355',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                }}
              >
                By Member Email
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
              {searchMode === 'unified' && 'Search Anything'}
              {searchMode === 'by_api' && 'API Endpoint'}
              {searchMode === 'by_member' && 'Member Email'}
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  searchMode === 'unified'
                    ? 'Team name, email, API endpoint, member name...'
                    : searchMode === 'by_api'
                    ? 'e.g., email_finder, linkedin, enrichment...'
                    : 'e.g., john@example.com'
                }
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
                disabled={loading}
                className="px-6 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: loading ? '#a8998a' : '#8b7355',
                  color: '#ffffff',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Mode descriptions */}
            <div className="mt-2">
              <p className="text-xs" style={{ color: '#a8998a' }}>
                {searchMode === 'unified' && (
                  <>
                    <strong>Unified Search:</strong> Automatically detects what you're looking for - team, member, or API
                  </>
                )}
                {searchMode === 'by_api' && (
                  <>
                    <strong>API Endpoint Search:</strong> Find all teams using a specific API and their current limits
                  </>
                )}
                {searchMode === 'by_member' && (
                  <>
                    <strong>Member Email Search:</strong> Find teams by member email and see all their API configurations
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-3 text-sm"
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
        </div>
      </div>

      {/* Results Section */}
      {results && !loading && (
        <div className="space-y-4">
          {/* Statistics Banner */}
          {results.statistics && (
            <div
              className="p-4"
              style={{
                backgroundColor: '#faf8f5',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
              }}
            >
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>Total Teams</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.statistics.total_teams}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>API Instances</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.statistics.total_api_instances}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>Needs Attention</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.statistics.teams_needing_attention}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>Avg Limit</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.statistics.average_limit?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary for member lookup */}
          {results.summary && (
            <div
              className="p-4"
              style={{
                backgroundColor: '#faf8f5',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
              }}
            >
              <p className="text-sm mb-2" style={{ color: '#3e3832' }}>
                <strong>Member:</strong> {results.member_email}
              </p>
              <div className="grid grid-cols-3 gap-4 text-center mt-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>Teams</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.summary.total_teams}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>Total APIs</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.summary.total_api_configurations}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#a8998a' }}>Unique APIs</p>
                  <p className="text-lg font-medium" style={{ color: '#3e3832' }}>
                    {results.summary.unique_api_endpoints}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {results.description && (
            <p className="text-sm" style={{ color: '#a8998a' }}>
              {results.description}
            </p>
          )}

          {/* Teams Results */}
          {results.teams && results.teams.length > 0 && (
            <div className="space-y-4">
              {searchMode === 'by_member' ? (
                // Special layout for member lookup
                results.teams.map((item: MemberLookupTeam, idx: number) => (
                  <div
                    key={idx}
                    className="p-6"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5dfd8',
                      borderRadius: '4px',
                    }}
                  >
                    {/* Team Header */}
                    <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e5dfd8' }}>
                      <h3 className="text-lg font-medium mb-1" style={{ color: '#3e3832' }}>
                        {item.team.name}
                      </h3>
                      <p className="text-xs font-mono mb-2" style={{ color: '#a8998a' }}>
                        ID: {item.team._id}
                      </p>
                      <div className="flex gap-4">
                        <span className="text-sm" style={{ color: '#8b7355' }}>
                          {item.team.credits.toLocaleString()} credits
                        </span>
                        <span className="text-sm" style={{ color: '#8b7355' }}>
                          {item.team.total_members} members
                        </span>
                        <span className="text-sm" style={{ color: '#8b7355' }}>
                          {item.api_configurations.total_apis} APIs
                        </span>
                      </div>
                    </div>

                    {/* API Configurations by Status */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium" style={{ color: '#a8998a' }}>
                        API CONFIGURATIONS
                      </p>

                      {/* Show APIs grouped by status */}
                      {item.api_configurations.by_status.high.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium" style={{ color: '#166534' }}>
                            High Limits ({item.api_configurations.by_status.high.length})
                          </p>
                          {item.api_configurations.by_status.high.slice(0, 3).map((api, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span style={{ color: '#3e3832' }}>{api.api_name}</span>
                              <span style={{ color: '#166534' }}>{api.current_limit.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.api_configurations.by_status.low.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
                            Low Limits - Needs Attention ({item.api_configurations.by_status.low.length})
                          </p>
                          {item.api_configurations.by_status.low.map((api, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span style={{ color: '#3e3832' }}>{api.api_name}</span>
                              <span style={{ color: '#dc2626' }}>{api.current_limit.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.api_configurations.by_status.disabled.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium" style={{ color: '#a8998a' }}>
                            Disabled ({item.api_configurations.by_status.disabled.length})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Standard layout for other searches
                results.teams.map((team: TeamResult) => (
                  <div
                    key={team._id}
                    className="p-6"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5dfd8',
                      borderRadius: '4px',
                    }}
                  >
                    {/* Team Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-1" style={{ color: '#3e3832' }}>
                        {team.name}
                      </h3>
                      <p className="text-xs font-mono mb-2" style={{ color: '#a8998a' }}>
                        ID: {team._id}
                      </p>
                      <p className="text-sm" style={{ color: '#8b7355' }}>
                        {team.credits.toLocaleString()} credits • {team.total_apis} APIs
                      </p>
                    </div>

                    {/* Matching APIs */}
                    {(team.matching_apis && team.matching_apis.length > 0) && (
                      <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #e5dfd8' }}>
                        <p className="text-xs font-medium mb-2" style={{ color: '#a8998a' }}>
                          MATCHING APIs
                        </p>
                        <div className="space-y-1">
                          {team.matching_apis.map((api, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span style={{ color: '#3e3832' }}>{api.api_name}</span>
                              <span
                                style={{
                                  color: api.needs_attention ? '#dc2626' : '#166534',
                                  fontWeight: api.needs_attention ? 'bold' : 'normal'
                                }}
                              >
                                {api.current_limit.toLocaleString()}
                                {api.needs_attention && ' ⚠️'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    {team.members && team.members.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: '#a8998a' }}>
                          MEMBERS ({team.members.length})
                        </p>
                        <div className="space-y-1">
                          {team.members.slice(0, 3).map((member, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: '#8b7355' }}
                              />
                              <span style={{ color: '#3e3832' }}>{member.email}</span>
                              {member.role && (
                                <span
                                  className="px-1.5 py-0.5"
                                  style={{
                                    backgroundColor: '#faf8f5',
                                    color: '#a8998a',
                                    borderRadius: '2px',
                                  }}
                                >
                                  {member.role}
                                </span>
                              )}
                            </div>
                          ))}
                          {team.members.length > 3 && (
                            <p className="text-xs" style={{ color: '#a8998a' }}>
                              + {team.members.length - 3} more members
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* No Results */}
          {results.teams && results.teams.length === 0 && (
            <div
              className="p-8 text-center"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
              }}
            >
              <p className="text-sm" style={{ color: '#a8998a' }}>
                No results found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
