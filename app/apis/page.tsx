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
  endpoint?: string;
  description?: string;
  is_visible_on_dashboard?: boolean;
  is_available?: boolean;
  unavailable_reason?: string;
  unavailable_since?: string;
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
  const [showUnavailableOnly, setShowUnavailableOnly] = useState(false);
  const [unavailableReasonInput, setUnavailableReasonInput] = useState<{ [key: string]: string }>({});

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

  const handleToggleAvailability = async (apiId: string, currentAvailability: boolean) => {
    setUpdatingApiId(apiId);
    setError(null);
    setSuccess(null);

    try {
      const reason = unavailableReasonInput[apiId] || 'Service temporarily unavailable due to maintenance';

      const response = await axios.patch(`/api/apis/${apiId}/availability`, {
        is_available: !currentAvailability,
        unavailable_reason: !currentAvailability ? null : reason,
      });

      setSuccess(response.data.message);
      setApis(apis.map(api =>
        api._id === apiId
          ? {
              ...api,
              is_available: !currentAvailability,
              unavailable_reason: currentAvailability ? reason : undefined,
              unavailable_since: currentAvailability ? new Date().toISOString() : undefined,
            }
          : api
      ));
      // Clear the reason input after successful update
      setUnavailableReasonInput(prev => ({ ...prev, [apiId]: '' }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update API availability');
    } finally {
      setUpdatingApiId(null);
    }
  };

  const filteredApis = apis.filter(api => {
    const matchesSearch = api.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    if (showUnavailableOnly) {
      return matchesSearch && api.is_available === false;
    }
    return matchesSearch;
  });

  const unavailableCount = apis.filter(api => api.is_available === false).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">API Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Control API visibility and availability. Mark APIs as unavailable to return 503 responses.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{apis.length}</div>
            <p className="text-xs text-neutral-500">Total APIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {apis.filter(api => api.is_available !== false).length}
            </div>
            <p className="text-xs text-neutral-500">Available</p>
          </CardContent>
        </Card>
        <Card className={unavailableCount > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${unavailableCount > 0 ? 'text-red-600' : ''}`}>
              {unavailableCount}
            </div>
            <p className="text-xs text-neutral-500">Unavailable (503)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Search by API name or slug</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search APIs by name or slug..."
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnavailableOnly}
              onChange={(e) => setShowUnavailableOnly(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600">Show unavailable APIs only</span>
          </label>
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
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Availability</TableHead>
                  <TableHead className="text-center">Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApis.map((api) => (
                  <TableRow key={api._id} className={api.is_available === false ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{api.name}</p>
                        <code className="text-xs text-neutral-500">{api.slug}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs px-2 py-0.5 bg-neutral-100 rounded">{api.endpoint}</code>
                    </TableCell>
                    <TableCell className="text-center">{api.creditsPerCall || 1}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          api.is_available !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {api.is_available !== false ? 'Available' : '503 Unavailable'}
                        </span>
                        {api.is_available === false && api.unavailable_reason && (
                          <span className="text-xs text-red-600 max-w-[150px] truncate" title={api.unavailable_reason}>
                            {api.unavailable_reason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        api.is_visible_on_dashboard ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {api.is_visible_on_dashboard ? 'Visible' : 'Hidden'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-2 items-end">
                        {/* Availability Toggle */}
                        {api.is_available !== false ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              type="text"
                              placeholder="Reason (optional)"
                              value={unavailableReasonInput[api._id] || ''}
                              onChange={(e) => setUnavailableReasonInput(prev => ({
                                ...prev,
                                [api._id]: e.target.value
                              }))}
                              className="w-32 h-8 text-xs"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleToggleAvailability(api._id, api.is_available !== false)}
                              disabled={updatingApiId === api._id}
                            >
                              {updatingApiId === api._id ? '...' : 'Disable'}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleToggleAvailability(api._id, false)}
                            disabled={updatingApiId === api._id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {updatingApiId === api._id ? '...' : 'Enable'}
                          </Button>
                        )}

                        {/* Visibility Toggle */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVisibility(api._id, api.is_visible_on_dashboard || false)}
                          disabled={updatingApiId === api._id}
                        >
                          {api.is_visible_on_dashboard ? 'Hide' : 'Show'}
                        </Button>
                      </div>
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
