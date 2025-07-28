'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useCurrentPermissions } from '@/hooks/use-current-permissions';

interface FraudEvent {
  id: string;
  userId?: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  orderId?: string;
  productId?: string;
  sellerId?: string;
  actionsTaken: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

interface FraudStats {
  totalEvents: number;
  openEvents: number;
  resolvedEvents: number;
  falsePositives: number;
  averageRiskScore: number;
  criticalEvents: number;
  highRiskEvents: number;
  mediumRiskEvents: number;
  lowRiskEvents: number;
}

export function FraudDetectionDashboard() {
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const { hasPermission } = useCurrentPermissions();

  const canViewFraud = hasPermission('VIEW_FRAUD_DETECTION');
  const canManageFraud = hasPermission('MANAGE_FRAUD_DETECTION');
  const canCreateEvents = hasPermission('CREATE_FRAUD_EVENTS');

  const fetchFraudEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);

      const response = await fetch(`/api/analytics/fraud?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        
        // Calculate stats
        const totalEvents = data.events?.length || 0;
        const openEvents = data.events?.filter((e: FraudEvent) => e.status === 'OPEN').length || 0;
        const resolvedEvents = data.events?.filter((e: FraudEvent) => e.status === 'RESOLVED').length || 0;
        const falsePositives = data.events?.filter((e: FraudEvent) => e.status === 'FALSE_POSITIVE').length || 0;
        const averageRiskScore = data.events?.reduce((sum: number, e: FraudEvent) => sum + e.riskScore, 0) / totalEvents || 0;
        const criticalEvents = data.events?.filter((e: FraudEvent) => e.severity === 'CRITICAL').length || 0;
        const highRiskEvents = data.events?.filter((e: FraudEvent) => e.severity === 'HIGH').length || 0;
        const mediumRiskEvents = data.events?.filter((e: FraudEvent) => e.severity === 'MEDIUM').length || 0;
        const lowRiskEvents = data.events?.filter((e: FraudEvent) => e.severity === 'LOW').length || 0;

        setStats({
          totalEvents,
          openEvents,
          resolvedEvents,
          falsePositives,
          averageRiskScore,
          criticalEvents,
          highRiskEvents,
          mediumRiskEvents,
          lowRiskEvents
        });
      }
    } catch (error) {
      console.error('Error fetching fraud events:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    if (canViewFraud) {
      fetchFraudEvents();
    }
  }, [fetchFraudEvents, canViewFraud]);

  const updateEventStatus = async (eventId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/analytics/fraud`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          status,
          resolutionNotes: notes
        })
      });

      if (response.ok) {
        await fetchFraudEvents(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating fraud event:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'INVESTIGATING': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'FALSE_POSITIVE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canViewFraud) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">You don&apos;t have permission to view fraud detection events.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fraud Detection Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Select disabled>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
            </Select>
            <Select disabled>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fraud Detection Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage fraud detection events across the platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severity</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchFraudEvents}>Refresh</Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.openEvents} open, {stats.resolvedEvents} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.highRiskEvents} high risk
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.averageRiskScore * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.mediumRiskEvents} medium, {stats.lowRiskEvents} low
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">False Positives</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.falsePositives}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalEvents > 0 ? ((stats.falsePositives / stats.totalEvents) * 100).toFixed(1) : 0}% rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Detection Events</CardTitle>
          <CardDescription>
            Recent fraud detection events and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Severity</th>
                  <th className="text-left p-2">Risk Score</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">IP Address</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{event.eventType}</div>
                        <div className="text-xs text-muted-foreground">{event.description}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${event.riskScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{(event.riskScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs">
                      {event.ipAddress || 'N/A'}
                    </td>
                    <td className="p-2 text-xs">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      {canManageFraud && event.status === 'OPEN' && (
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEventStatus(event.id, 'INVESTIGATING')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEventStatus(event.id, 'RESOLVED')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEventStatus(event.id, 'FALSE_POSITIVE')}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Fraud Events</h3>
                <p className="text-gray-500">No fraud detection events found with the current filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 