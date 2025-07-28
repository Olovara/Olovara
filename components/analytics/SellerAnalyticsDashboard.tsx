'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star, AlertTriangle, Package } from 'lucide-react';

interface SellerMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  customerRetentionRate: number;
  averageRating: number;
  chargebacks: number;
  disputes: number;
  period: string;
  dataPoints: number;
}

interface DailyMetric {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  uniqueCustomers: number;
  customerRetentionRate: number;
  averageRating: number;
  totalReviews: number;
  chargebacks: number;
  disputes: number;
}

export function SellerAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
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
        `/api/analytics/seller?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
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
      const response = await fetch('/api/analytics/seller', {
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

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < threshold) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Seller Analytics</h1>
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
          <h1 className="text-3xl font-bold">Seller Analytics</h1>
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
              Views to purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatPercentage(metrics.customerRetentionRate) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Repeat customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Customer Satisfaction</span>
            </CardTitle>
            <CardDescription>Reviews and ratings performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Rating</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">{metrics?.averageRating.toFixed(1) || '0.0'}</span>
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>5 Stars</span>
                <span>80%</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>4 Stars</span>
                <span>15%</span>
              </div>
              <Progress value={15} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>3 Stars & Below</span>
                <span>5%</span>
              </div>
              <Progress value={5} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Risk Management</span>
            </CardTitle>
            <CardDescription>Chargebacks and disputes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Chargebacks</span>
              <Badge variant={metrics?.chargebacks && metrics.chargebacks > 0 ? "destructive" : "secondary"}>
                {metrics?.chargebacks || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Disputes</span>
              <Badge variant={metrics?.disputes && metrics.disputes > 0 ? "destructive" : "secondary"}>
                {metrics?.disputes || 0}
              </Badge>
            </div>
            <div className="pt-4">
              <div className="text-sm text-muted-foreground mb-2">Risk Score</div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={Math.max(0, 100 - ((metrics?.chargebacks || 0) + (metrics?.disputes || 0)) * 10)} 
                  className="h-2 flex-1" 
                />
                <span className="text-sm font-medium">
                  {Math.max(0, 100 - ((metrics?.chargebacks || 0) + (metrics?.disputes || 0)) * 10)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>Daily breakdown of your sales and customer metrics</CardDescription>
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
                  <th className="text-right p-2">Customers</th>
                  <th className="text-right p-2">Rating</th>
                  <th className="text-right p-2">Reviews</th>
                  <th className="text-right p-2">Issues</th>
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
                    <td className="text-right p-2">{metric.uniqueCustomers}</td>
                    <td className="text-right p-2">
                      <div className="flex items-center justify-end space-x-1">
                        <span>{metric.averageRating.toFixed(1)}</span>
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      </div>
                    </td>
                    <td className="text-right p-2">{metric.totalReviews}</td>
                    <td className="text-right p-2">
                      <Badge variant={(metric.chargebacks + metric.disputes) > 0 ? "destructive" : "secondary"}>
                        {metric.chargebacks + metric.disputes}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions to improve your performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics && (
            <>
              {metrics.averageOrderValue < 5000 && (
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Package className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Increase Average Order Value</h4>
                    <p className="text-sm text-blue-700">
                      Your average order value is ${(metrics.averageOrderValue / 100).toFixed(2)}. 
                      Consider bundling products or offering volume discounts to increase revenue per order.
                    </p>
                  </div>
                </div>
              )}
              
              {metrics.conversionRate < 2 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Improve Conversion Rate</h4>
                    <p className="text-sm text-yellow-700">
                      Your conversion rate is {metrics.conversionRate.toFixed(2)}%. 
                      Try improving product photos, descriptions, and pricing to convert more visitors to customers.
                    </p>
                  </div>
                </div>
              )}
              
              {metrics.customerRetentionRate < 20 && (
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Boost Customer Retention</h4>
                    <p className="text-sm text-green-700">
                      Your customer retention rate is {metrics.customerRetentionRate.toFixed(2)}%. 
                      Consider implementing a loyalty program or follow-up campaigns to encourage repeat purchases.
                    </p>
                  </div>
                </div>
              )}
              
              {(metrics.chargebacks > 0 || metrics.disputes > 0) && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Address Customer Issues</h4>
                    <p className="text-sm text-red-700">
                      You have {metrics.chargebacks} chargebacks and {metrics.disputes} disputes. 
                      Review your customer service processes and product quality to reduce these issues.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 