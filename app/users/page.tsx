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

interface User {
  _id: string;
  email: string;
  name?: string;
  has_support_dashboard_access: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/users', {
        params: { search, page, limit: 20 },
      });

      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
      setTotal(response.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleToggleAccess = async (userId: string, currentAccess: boolean) => {
    setUpdatingUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.patch(`/api/users/${userId}/access`, {
        has_support_dashboard_access: !currentAccess,
      });

      setSuccess(response.data.message);
      setUsers(users.map(user =>
        user._id === userId
          ? { ...user, has_support_dashboard_access: !currentAccess }
          : user
      ));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user access');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">User Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage support dashboard access for users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search for users by email or name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by email or name..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {total} total users • Page {page} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No users found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Support Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="text-neutral-600">{user.name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.has_support_dashboard_access ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                          {user.has_support_dashboard_access ? 'Enabled' : 'Disabled'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={user.has_support_dashboard_access ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleAccess(user._id, user.has_support_dashboard_access)}
                          disabled={updatingUserId === user._id}
                        >
                          {updatingUserId === user._id ? 'Updating...' : user.has_support_dashboard_access ? 'Revoke' : 'Grant'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading}>
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-600">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
