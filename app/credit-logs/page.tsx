'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

interface CreditLog {
  _id: string;
  support_user_email: string;
  team_name: string;
  action_type: 'refund' | 'credit_addition' | 'credit_deduction' | 'adjustment';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reason?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function CreditLogsPage() {
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: pagination.page,
        limit: 50,
      };

      if (searchTerm) params.search = searchTerm;
      if (actionTypeFilter) params.action_type = actionTypeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get('/api/credit-logs', { params });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch credit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleReset = () => {
    setSearchTerm('');
    setActionTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchLogs, 100);
  };

  const getActionTypeBadge = (actionType: string) => {
    const badges = {
      refund: 'bg-blue-100 text-blue-700',
      credit_addition: 'bg-green-100 text-green-700',
      credit_deduction: 'bg-red-100 text-red-700',
      adjustment: 'bg-yellow-100 text-yellow-700',
    };
    const labels = {
      refund: 'Refund',
      credit_addition: 'Credit Addition',
      credit_deduction: 'Credit Deduction',
      adjustment: 'Adjustment',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badges[actionType as keyof typeof badges] || 'bg-neutral-100 text-neutral-700'}`}>
        {labels[actionType as keyof typeof labels] || actionType}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Credit Logs</h1>
        <p className="text-sm text-neutral-500 mt-1">
          View all credit operations performed by support team members
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter credit logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Search
              </label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Team or user email..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Action Type
              </label>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Types</option>
                <option value="refund">Refund</option>
                <option value="credit_addition">Credit Addition</option>
                <option value="credit_deduction">Credit Deduction</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSearch} disabled={loading}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Logs</CardTitle>
          <CardDescription>
            {pagination.total} total logs • Page {pagination.page} of {pagination.pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading logs...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No credit logs found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">New Balance</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="text-sm text-neutral-600">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">{log.team_name}</TableCell>
                      <TableCell>{getActionTypeBadge(log.action_type)}</TableCell>
                      <TableCell className={`text-right font-mono ${log.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.amount >= 0 ? '+' : ''}{log.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-neutral-600">
                        {log.previous_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {log.new_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {log.support_user_email}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600 max-w-xs truncate">
                        {log.reason || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
