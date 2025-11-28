'use client';

import { useState } from 'react';
import axios from 'axios';

interface TeamLog {
  uid: string;
  createdAt: string;
  method: string;
  endpoint: string;
  status_code: number;
  latency: string;
  ip: string;
  credits_used: number;
  before_balance: number;
  after_balance: number;
}

interface Team {
  _id: string;
  uid: string;
  name: string;
  current_credits: number;
}

export default function ApiLogsPage() {
  const [teamId, setTeamId] = useState('');
  const [logs, setLogs] = useState<TeamLog[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleSearch = async (newPage: number = 1) => {
    if (!teamId.trim()) {
      setError('Please enter a team ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await axios.get('/api/teams/logs', {
        params: {
          teamId: teamId.trim(),
          page: newPage,
          limit: 50,
        },
      });

      setLogs(response.data.logs);
      setTeam(response.data.team);
      setPage(newPage);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
      setLogs([]);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981';
    if (status === 429) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-8" style={{ color: '#3e3832' }}>
        API Logs
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
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
              Team ID or UID
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter team _id or uid..."
                className="flex-1 px-4 py-2 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: '#3e3832',
                }}
              />
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: loading ? '#a8998a' : '#8b7355',
                  color: '#ffffff',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </div>

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

      {/* Team Info */}
      {team && (
        <div
          className="p-6 mb-8"
          style={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <h2 className="text-lg font-medium mb-3" style={{ color: '#3e3832' }}>
            {team.name}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#a8998a' }}>
                Team UID
              </p>
              <p className="text-sm font-mono" style={{ color: '#3e3832' }}>
                {team.uid}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#a8998a' }}>
                Team ID
              </p>
              <p className="text-sm font-mono" style={{ color: '#3e3832' }}>
                {team._id}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#a8998a' }}>
                Current Credits
              </p>
              <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                {team.current_credits.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {searched && !loading && logs.length > 0 && (
        <div>
          <div className="mb-4">
            <p className="text-sm" style={{ color: '#a8998a' }}>
              Showing {logs.length} logs (Page {page} of {totalPages})
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5dfd8',
              borderRadius: '4px',
              overflowX: 'auto',
            }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#faf8f5', borderBottom: '1px solid #e5dfd8' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#a8998a' }}>
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#a8998a' }}>
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#a8998a' }}>
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#a8998a' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#a8998a' }}>
                    Before Balance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#a8998a' }}>
                    Credits Used
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#a8998a' }}>
                    After Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#a8998a' }}>
                    Latency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#a8998a' }}>
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.uid}
                    style={{
                      borderBottom: idx < logs.length - 1 ? '1px solid #e5dfd8' : 'none',
                    }}
                  >
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#3e3832' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-mono px-2 py-1"
                        style={{
                          backgroundColor: '#faf8f5',
                          color: '#3e3832',
                          borderRadius: '3px',
                        }}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#3e3832' }}>
                      {log.endpoint}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="text-xs font-mono px-2 py-1"
                        style={{
                          backgroundColor: `${getStatusColor(log.status_code)}15`,
                          color: getStatusColor(log.status_code),
                          borderRadius: '3px',
                        }}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: '#3e3832' }}>
                      {log.before_balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: log.credits_used > 0 ? '#ef4444' : '#a8998a',
                        }}
                      >
                        {log.credits_used > 0 ? '-' : ''}
                        {log.credits_used.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: '#3e3832' }}>
                      {log.after_balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#a8998a' }}>
                      {log.latency} ms
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#a8998a' }}>
                      {log.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => handleSearch(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 text-sm"
                style={{
                  backgroundColor: page === 1 ? '#f5f5f5' : '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: page === 1 ? '#a8998a' : '#3e3832',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm" style={{ color: '#3e3832' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handleSearch(page + 1)}
                disabled={page === totalPages || loading}
                className="px-4 py-2 text-sm"
                style={{
                  backgroundColor: page === totalPages ? '#f5f5f5' : '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: page === totalPages ? '#a8998a' : '#3e3832',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {searched && !loading && logs.length === 0 && (
        <div
          className="p-8 text-center"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <p className="text-sm mb-2" style={{ color: '#a8998a' }}>
            No logs found for this team
          </p>
        </div>
      )}
    </div>
  );
}
