"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHelpPreferencesAnalytics, getUsersByHelpCategory } from "@/actions/onboardingActions";
import { 
  Users, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Download,
  Lightbulb,
  Palette,
  Camera,
  DollarSign,
  Package,
  Calculator
} from "lucide-react";

// Map category IDs to display names and icons
const categoryDisplay = {
  deciding_what_to_sell: { name: "Deciding What to Sell", icon: Lightbulb },
  naming_and_branding: { name: "Naming & Branding", icon: Palette },
  taking_photos: { name: "Taking Photos", icon: Camera },
  pricing: { name: "Pricing Strategy", icon: DollarSign },
  packing_and_shipping: { name: "Packing & Shipping", icon: Package },
  understanding_finances: { name: "Understanding Finances", icon: Calculator }
};

export default function HelpPreferencesAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryUsers, setCategoryUsers] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getHelpPreferencesAnalytics();
      if (!result.error) {
        setAnalytics(result);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryUsers = async (category: string) => {
    try {
      const result = await getUsersByHelpCategory(category);
      if (!result.error) {
        setCategoryUsers(result.users || []);
        setSelectedCategory(category);
      }
    } catch (error) {
      console.error("Error loading category users:", error);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    
    const csvData = [
      ["Category", "Count", "Percentage"],
      ...analytics.popularCategories.map((cat: any) => [
        categoryDisplay[cat.category as keyof typeof categoryDisplay]?.name || cat.category,
        cat.count,
        `${cat.percentage}%`
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "help-preferences-analytics.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Help Preferences Analytics</h2>
          <p className="text-gray-600">Marketing insights from seller help preferences</p>
        </div>
        <Button onClick={exportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              With help preferences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentUsers}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.popularCategories[0]?.percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.popularCategories[0]?.category ? 
                categoryDisplay[analytics.popularCategories[0].category as keyof typeof categoryDisplay]?.name || 
                analytics.popularCategories[0].category : 
                "No data"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Most Requested Help Categories
          </CardTitle>
          <CardDescription>
            Click on a category to see users who selected it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popularCategories.map((category: any, index: number) => {
              const displayInfo = categoryDisplay[category.category as keyof typeof categoryDisplay];
              const IconComponent = displayInfo?.icon || BarChart3;
              
              return (
                <div
                  key={category.category}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadCategoryUsers(category.category)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <IconComponent className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {displayInfo?.name || category.category}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.count} users ({category.percentage}%)
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    #{index + 1}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Users */}
      {selectedCategory && categoryUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Users who selected &quot;{categoryDisplay[selectedCategory as keyof typeof categoryDisplay]?.name || selectedCategory}&quot;
            </CardTitle>
            <CardDescription>
              {categoryUsers.length} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryUsers.slice(0, 10).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-600">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {user.seller?.shopName && (
                      <Badge variant="outline">{user.seller.shopName}</Badge>
                    )}
                  </div>
                </div>
              ))}
              {categoryUsers.length > 10 && (
                <p className="text-sm text-gray-600 text-center">
                  Showing first 10 of {categoryUsers.length} users
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketing Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Insights</CardTitle>
          <CardDescription>
            Actionable insights for your marketing strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Content Strategy</h4>
              <p className="text-blue-800 text-sm">
                Focus on creating content for &quot;{analytics.popularCategories[0]?.category ? 
                  categoryDisplay[analytics.popularCategories[0].category as keyof typeof categoryDisplay]?.name : 
                  "top categories"
                }&quot; as it&apos;s the most requested help area.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Email Marketing</h4>
              <p className="text-green-800 text-sm">
                You can target {analytics.totalUsers} users with personalized help content based on their preferences.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Product Development</h4>
              <p className="text-purple-800 text-sm">
                Consider building tools or features to help with the most requested categories.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
