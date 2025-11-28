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

interface API {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  is_visible_on_dashboard?: boolean;
  hasBulk?: boolean;
  creditsPerCall?: number;
}

export default function APIsPage() {
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingApiId, setUpdatingApiId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAPIs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/apis');
      setApis(response.data.apis);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch APIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAPIs();
  }, []);

  const handleToggleVisibility = async (apiId: string, currentVisibility: boolean) => {
    setUpdatingApiId(apiId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.patch(`/api/apis/${apiId}/visibility`, {
        is_visible_on_dashboard: !currentVisibility,
      });

      setSuccess(response.data.message);
      setApis(apis.map(api =>
        api._id === apiId
          ? { ...api, is_visible_on_dashboard: !currentVisibility }
          : api
      ));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update API visibility');
    } finally {
      setUpdatingApiId(null);
    }
  };

  const filteredApis = apis.filter(api =>
    api.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">API Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Control which APIs are visible on the client dashboard and manage team access
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search APIs</CardTitle>
          <CardDescription>Search by API name or slug</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search APIs by name or slug..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>APIs</CardTitle>
          <CardDescription>{filteredApis.length} APIs found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading APIs...</div>
          ) : filteredApis.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No APIs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Bulk Support</TableHead>
                  <TableHead className="text-center">Dashboard Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApis.map((api) => (
                  <TableRow key={api._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{api.name}</p>
                        {api.description && (
                          <p className="text-xs text-neutral-500 mt-0.5">{api.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs px-2 py-0.5 bg-neutral-100 rounded">{api.slug}</code>
                    </TableCell>
                    <TableCell className="text-center">{api.creditsPerCall || 1}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${api.hasBulk ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                        {api.hasBulk ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${api.is_visible_on_dashboard ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                        {api.is_visible_on_dashboard ? 'Visible' : 'Hidden'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={api.is_visible_on_dashboard ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleVisibility(api._id, api.is_visible_on_dashboard || false)}
                        disabled={updatingApiId === api._id}
                      >
                        {updatingApiId === api._id ? 'Updating...' : api.is_visible_on_dashboard ? 'Hide' : 'Show'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
