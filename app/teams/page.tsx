'use client';

import { useState } from 'react';
import axios from 'axios';

interface TeamMember {
  email: string;
  name?: string;
  role?: string;
}

interface Team {
  _id: string;
  uid: string;
  name: string;
  members: TeamMember[];
  base_credit: number;
  credits_used: number;
  credits: number; // Available credits (base_credit - credits_used)
  api_limits: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchInfo, setSearchInfo] = useState<string>('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    setSearchInfo('');

    try {
      const response = await axios.get('/api/teams/search', {
        params: {
          q: searchQuery.trim(),
          type: 'auto', // Always use auto-detection
        },
      });

      setTeams(response.data.teams || []);
      setSearchInfo(response.data.description || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search teams');
      setTeams([]);
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
        Team Management
      </h1>

      {/* Search Section */}
      <div
        className="p-6 mb-8"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5dfd8',
          borderRadius: '4px',
        }}
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
              Search Teams
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by email, team name, member name, or team ID..."
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
            
            {/* Search tips */}
            <div className="mt-2">
              <p className="text-xs" style={{ color: '#a8998a' }}>
                <strong>Examples:</strong> john@example.com • Acme Corp • John Smith • 507f1f77bcf86cd799439011
              </p>
            </div>
          </div>

          {/* Search Info */}
          {searchInfo && (
            <div
              className="p-3 text-sm"
              style={{
                backgroundColor: '#faf8f5',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
                color: '#8b7355',
              }}
            >
              ℹ️ {searchInfo}
            </div>
          )}

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
      {searched && !loading && (
        <div>
          {teams.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm" style={{ color: '#a8998a' }}>
                  Found {teams.length} team{teams.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-4">
                {teams.map((team) => (
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
                      <p className="text-xs font-mono" style={{ color: '#a8998a' }}>
                        UID: {team.uid}
                      </p>
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid #e5dfd8' }}>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#a8998a' }}>
                          Available Credits
                        </p>
                        <p className="text-base font-medium" style={{ color: '#16a34a' }}>
                          {team.credits.toLocaleString()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#a8998a' }}>
                          Base: {team.base_credit.toLocaleString()} • Used: {team.credits_used.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#a8998a' }}>
                          Usage Rate
                        </p>
                        <p className="text-base font-medium" style={{ color: '#3e3832' }}>
                          {team.base_credit > 0 ? Math.round((team.credits_used / team.base_credit) * 100) : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#a8998a' }}>
                          Members
                        </p>
                        <p className="text-base font-medium" style={{ color: '#3e3832' }}>
                          {team.members.length}
                        </p>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: '#a8998a' }}>
                        MEMBERS
                      </p>
                      <div className="space-y-2">
                        {team.members.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: '#8b7355' }}
                            />
                            <span className="text-sm" style={{ color: '#3e3832' }}>
                              {member.email}
                            </span>
                            {member.role && (
                              <span
                                className="text-xs px-2 py-0.5"
                                style={{
                                  backgroundColor: '#faf8f5',
                                  color: '#a8998a',
                                  borderRadius: '3px',
                                }}
                              >
                                {member.role}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              className="p-8 text-center"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
              }}
            >
              <p className="text-sm mb-2" style={{ color: '#a8998a' }}>
                No teams found
              </p>
              <p className="text-xs" style={{ color: '#a8998a' }}>
                Try different search terms or check for typos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
