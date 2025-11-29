'use client';

import { useState } from 'react';
import axios from 'axios';

interface Team {
  _id: string;
  uid: string;
  name: string;
  members: Array<{ email: string }>;
  base_credit: number;
  credits_used: number;
  credits: number; // Available credits (base_credit - credits_used)
}

export default function CreditsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState<'refund' | 'credit_addition'>('credit_addition');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'received' | 'not_applicable'>('not_applicable');
  const [paymentDate, setPaymentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Team[]>([]);

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
          type: 'auto', // Always use auto-detection
        },
      });

      setSearchResults(response.data.teams || []);

      if (response.data.teams?.length === 1) {
        setSelectedTeam(response.data.teams[0]);
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

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setSearchResults([]);
    setError(null);
    setSuccess(null);
  };

  const handleAddCredits = async () => {
    if (!selectedTeam) {
      setError('Please select a team first');
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/credits/add', {
        teamId: selectedTeam._id,
        amount,
        note: note.trim() || undefined,
        actionType,
        paymentStatus: actionType === 'credit_addition' ? paymentStatus : 'not_applicable',
        paymentDate: paymentStatus === 'received' ? paymentDate : undefined,
      });

      setSuccess(response.data.message);

      // Update selected team's credits
      setSelectedTeam({
        ...selectedTeam,
        base_credit: response.data.team.base_credit ?? selectedTeam.base_credit,
        credits_used: response.data.team.credits_used ?? selectedTeam.credits_used,
        credits: response.data.team.available_credits ?? ((response.data.team.base_credit || 0) - (response.data.team.credits_used || 0)),
      });

      // Clear form
      setCreditAmount('');
      setNote('');
      setPaymentStatus('not_applicable');
      setPaymentDate('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add credits');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !selectedTeam) {
      handleSearch();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-8" style={{ color: '#3e3832' }}>
        Add Credits
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
          {/* Search Input */}
          {!selectedTeam && (
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
              <div className="mt-2">
                <p className="text-xs" style={{ color: '#a8998a' }}>
                  <strong>Examples:</strong> john@example.com • Acme Corp • John Smith
                </p>
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
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1" style={{ color: '#3e3832' }}>
                    {selectedTeam.name}
                  </p>
                  <p className="text-xs font-mono mb-2" style={{ color: '#a8998a' }}>
                    UID: {selectedTeam.uid}
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div>
                      <p className="text-xs" style={{ color: '#a8998a' }}>Available</p>
                      <p className="text-sm font-medium" style={{ color: '#16a34a' }}>
                        {(selectedTeam.credits ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#a8998a' }}>Base</p>
                      <p className="text-sm font-medium" style={{ color: '#3e3832' }}>
                        {(selectedTeam.base_credit ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#a8998a' }}>Used</p>
                      <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
                        {(selectedTeam.credits_used ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTeam(null);
                    setSearchQuery('');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs px-3 py-1 transition-all ml-3"
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
                  className="w-full text-left p-3 transition-all hover:bg-opacity-80"
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
                    {team.members?.length ?? 0} members • {(team.credits ?? 0).toLocaleString()} credits
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Credits Section */}
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
            Add Credits to {selectedTeam.name}
          </h2>

          <div className="space-y-4">
            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as 'refund' | 'credit_addition')}
                className="w-full px-4 py-2 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: '#3e3832',
                }}
              >
                <option value="credit_addition">Credit Addition</option>
                <option value="refund">Refund</option>
              </select>
              <p className="text-xs mt-1" style={{ color: '#a8998a' }}>
                Choose whether this is a standard credit addition or a refund
              </p>
            </div>

            {/* Credit Amount */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                Credit Amount
              </label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter amount to add..."
                min="1"
                className="w-full px-4 py-2 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: '#3e3832',
                }}
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#3e3832' }}>
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this credit addition..."
                rows={3}
                className="w-full px-4 py-2 text-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                  color: '#3e3832',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Payment Status - Only show for credit additions */}
            {actionType === 'credit_addition' && (
              <div
                className="p-4"
                style={{
                  backgroundColor: '#faf8f5',
                  border: '1px solid #e5dfd8',
                  borderRadius: '4px',
                }}
              >
                <label className="block text-sm font-medium mb-3" style={{ color: '#3e3832' }}>
                  Payment Status
                </label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="not_applicable"
                        checked={paymentStatus === 'not_applicable'}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm" style={{ color: '#3e3832' }}>
                        Not Applicable
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="pending"
                        checked={paymentStatus === 'pending'}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm" style={{ color: '#dc7a00' }}>
                        Payment Pending
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentStatus"
                        value="received"
                        checked={paymentStatus === 'received'}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm" style={{ color: '#16a34a' }}>
                        Payment Received
                      </span>
                    </label>
                  </div>

                  {/* Payment Date - Only show when payment is received */}
                  {paymentStatus === 'received' && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#a8998a' }}>
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="px-3 py-2 text-sm"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5dfd8',
                          borderRadius: '4px',
                          color: '#3e3832',
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs" style={{ color: '#a8998a' }}>
                    {paymentStatus === 'pending'
                      ? 'Credits will be added but payment is still expected.'
                      : paymentStatus === 'received'
                      ? 'Payment has been received for these credits.'
                      : 'Select if this credit addition requires payment tracking.'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleAddCredits}
              disabled={loading || !creditAmount}
              className="w-full py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: loading || !creditAmount ? '#a8998a' : '#8b7355',
                color: '#ffffff',
                borderRadius: '4px',
                cursor: loading || !creditAmount ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Adding Credits...' : 'Add Credits'}
            </button>
          </div>
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
