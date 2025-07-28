'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, AlertTriangle } from 'lucide-react';

interface MarketplaceMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalSellers: number;
  totalBuyers: number;
  conversionRate: number;
  averageOrderValue: number;
  cartAbandonmentRate: number;
  fraudAttempts: number;
  chargebacks: number;
  period: string;
  dataPoints: number;
}

interface DailyMetric {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  fraudAttempts: number;
  chargebacks: number;
  topCountries?: any[];
}

export function MarketplaceAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<MarketplaceMetrics | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [generating, setGenerating] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const response = await fetch(
        `/api/analytics/marketplace?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.summary);
        setDailyMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const generateAnalytics = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/analytics/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString() })
      });

      if (response.ok) {
        await fetchAnalytics(); // Refresh data
      }
    } catch (error) {
      console.error('Error generating analytics:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Convert from cents
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Marketplace Analytics</h1>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled>Loading...</Button>
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
          <h1 className="text-3xl font-bold">Marketplace Analytics</h1>
          <p className="text-muted-foreground">
            {metrics?.period} • {metrics?.dataPoints} data points
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateAnalytics} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Analytics'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatCurrency(metrics.totalRevenue) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatCurrency(metrics.averageOrderValue) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatPercentage(metrics.conversionRate) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Checkout to purchase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cart Abandonment</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatPercentage(metrics.cartAbandonmentRate) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Abandoned checkouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fraud & Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Fraud & Security</span>
            </CardTitle>
            <CardDescription>Platform security metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fraud Attempts</span>
              <Badge variant="destructive">{metrics?.fraudAttempts || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Chargebacks</span>
              <Badge variant="secondary">{metrics?.chargebacks || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Platform Users</span>
            </CardTitle>
            <CardDescription>User activity overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Sellers</span>
              <Badge variant="outline">{metrics?.totalSellers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Buyers</span>
              <Badge variant="outline">{metrics?.totalBuyers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Products</span>
              <Badge variant="outline">{metrics?.totalProducts || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>Daily breakdown of key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Orders</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Avg Order</th>
                  <th className="text-right p-2">Conversion</th>
                  <th className="text-right p-2">Abandonment</th>
                  <th className="text-right p-2">Fraud</th>
                </tr>
              </thead>
              <tbody>
                {dailyMetrics.map((metric, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      {new Date(metric.date).toLocaleDateString()}
                    </td>
                    <td className="text-right p-2">{metric.totalOrders}</td>
                    <td className="text-right p-2">
                      {formatCurrency(metric.totalRevenue)}
                    </td>
                    <td className="text-right p-2">
                      {formatCurrency(metric.averageOrderValue)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercentage(metric.conversionRate)}
                    </td>
                    <td className="text-right p-2">
                      {formatPercentage(metric.cartAbandonmentRate)}
                    </td>
                    <td className="text-right p-2">
                      <Badge variant={metric.fraudAttempts > 0 ? "destructive" : "secondary"}>
                        {metric.fraudAttempts}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 