'use client';

import { useState } from 'react';
import axios from 'axios';

interface MatchedEndpoint {
  endpoint: string;
  current_limit: number | string;
}

interface UpdatedEndpoint {
  endpoint: string;
  new_limit: number;
  previous_limit: number | string;
}

interface QuickUpdateProps {
  onSuccess?: () => void;
}

export default function QuickUpdateByEmail({ onSuccess }: QuickUpdateProps) {
  const [memberEmail, setMemberEmail] = useState('');
  const [endpointPattern, setEndpointPattern] = useState('');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    team: { name: string; member_email: string };
    matching_endpoints: MatchedEndpoint[];
    all_endpoints: string[];
  } | null>(null);
  const [updateResult, setUpdateResult] = useState<{
    team: { name: string; member_email: string };
    updated_endpoints: UpdatedEndpoint[];
  } | null>(null);

  const handlePreview = async () => {
    if (!memberEmail.trim() || !endpointPattern.trim()) {
      setError('Please enter both member email and endpoint pattern');
      return;
    }

    setPreviewing(true);
    setError(null);
    setSuccess(null);
    setPreviewData(null);
    setUpdateResult(null);

    try {
      const response = await axios.get('/api/rate-limits/update-by-email', {
        params: {
          memberEmail: memberEmail.trim(),
          endpointPattern: endpointPattern.trim(),
        },
      });

      setPreviewData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview matches');
      setPreviewData(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleUpdate = async () => {
    if (!memberEmail.trim() || !endpointPattern.trim() || !limit) {
      setError('Please fill in all fields');
      return;
    }

    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 0) {
      setError('Limit must be a non-negative number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUpdateResult(null);

    try {
      const response = await axios.post('/api/rate-limits/update-by-email', {
        memberEmail: memberEmail.trim(),
        endpointPattern: endpointPattern.trim(),
        limit: limitNum,
      });

      setSuccess(response.data.message);
      setUpdateResult(response.data);
      setPreviewData(null);
      
      if (onSuccess) {
        onSuccess();
      }

      // Clear form after success
      setTimeout(() => {
        setMemberEmail('');
        setEndpointPattern('');
        setLimit('');
        setUpdateResult(null);
      }, 3000);
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.error || 'Failed to update rate limit');
      
      // If error includes existing endpoints, show them
      if (errorData?.team?.existing_endpoints) {
        setError(
          `${errorData.error}\n\nExisting endpoints in team: ${errorData.team.existing_endpoints.join(', ')}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !previewing) {
      if (previewData && limit) {
        handleUpdate();
      } else {
        handlePreview();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
            Member Email
          </label>
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="user@example.com"
            disabled={loading}
            className="w-full px-4 py-2 text-sm"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5dfd8',
              borderRadius: '4px',
              color: '#3e3832',
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
            Endpoint Pattern
            <span className="text-xs font-normal ml-2" style={{ color: '#a8998a' }}>
              (use % as wildcard)
            </span>
          </label>
          <input
            type="text"
            value={endpointPattern}
            onChange={(e) => setEndpointPattern(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="email% or linkedin_profile"
            disabled={loading}
            className="w-full px-4 py-2 text-sm"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5dfd8',
              borderRadius: '4px',
              color: '#3e3832',
            }}
          />
          <p className="text-xs mt-1" style={{ color: '#a8998a' }}>
            Examples: "email%" matches email_finder, email_validation
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
            New Rate Limit
          </label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="1000"
            min="0"
            disabled={loading || !previewData}
            className="w-full px-4 py-2 text-sm"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5dfd8',
              borderRadius: '4px',
              color: '#3e3832',
              opacity: !previewData ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!previewData ? (
          <button
            onClick={handlePreview}
            disabled={previewing || !memberEmail || !endpointPattern}
            className="flex-1 md:flex-none px-6 py-2.5 text-sm font-medium transition-all"
            style={{
              backgroundColor: previewing || !memberEmail || !endpointPattern ? '#a8998a' : '#8b7355',
              color: '#ffffff',
              borderRadius: '4px',
              cursor: previewing || !memberEmail || !endpointPattern ? 'not-allowed' : 'pointer',
            }}
          >
            {previewing ? 'Previewing...' : 'Preview Matches'}
          </button>
        ) : (
          <>
            <button
              onClick={handleUpdate}
              disabled={loading || !limit}
              className="flex-1 md:flex-none px-6 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: loading || !limit ? '#a8998a' : '#8b7355',
                color: '#ffffff',
                borderRadius: '4px',
                cursor: loading || !limit ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Updating...' : 'Update Rate Limits'}
            </button>
            <button
              onClick={() => {
                setPreviewData(null);
                setError(null);
              }}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: '#ffffff',
                color: '#8b7355',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Preview Results */}
      {previewData && (
        <div
          className="p-4 space-y-3"
          style={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5dfd8',
            borderRadius: '4px',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                {previewData.team.name}
              </p>
              <p className="text-xs" style={{ color: '#a8998a' }}>
                {previewData.team.member_email}
              </p>
            </div>
            <span
              className="px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: '#ffffff',
                color: '#8b7355',
                border: '1px solid #e5dfd8',
                borderRadius: '4px',
              }}
            >
              {previewData.matching_endpoints.length} match(es)
            </span>
          </div>

          {previewData.matching_endpoints.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: '#3e3832' }}>
                Endpoints that will be updated:
              </p>
              {previewData.matching_endpoints.map((endpoint, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 text-xs"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5dfd8',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ color: '#3e3832' }}>{endpoint.endpoint}</span>
                  <span style={{ color: '#a8998a' }}>
                    Current: {endpoint.current_limit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#a8998a' }}>
              No existing endpoints match this pattern. A new endpoint will be created if you proceed.
            </p>
          )}

          {previewData.all_endpoints.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium" style={{ color: '#8b7355' }}>
                Show all {previewData.all_endpoints.length} existing endpoints
              </summary>
              <div className="mt-2 space-y-1" style={{ color: '#a8998a' }}>
                {previewData.all_endpoints.map((endpoint, idx) => (
                  <div key={idx}>• {endpoint}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Update Results */}
      {updateResult && (
        <div
          className="p-4 space-y-3"
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
          }}
        >
          <p className="text-sm font-medium" style={{ color: '#166534' }}>
            Successfully Updated
          </p>
          <div className="space-y-2">
            {updateResult.updated_endpoints.map((endpoint, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 text-xs"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                }}
              >
                <span style={{ color: '#3e3832' }}>{endpoint.endpoint}</span>
                <span style={{ color: '#166534' }}>
                  {endpoint.previous_limit} → {endpoint.new_limit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="p-3 text-sm whitespace-pre-wrap"
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

      {/* Success Message */}
      {success && !updateResult && (
        <div
          className="p-3 text-sm"
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
