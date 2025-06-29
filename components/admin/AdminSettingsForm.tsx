"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminSettingsSchema, AdminSettingsFormData, defaultAdminSettings } from "@/schemas/AdminSettingsSchema";
import { updateAdminSettings, resetAdminSettings, getAdminSettings } from "@/actions/adminSettingsActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Monitor, Shield, Settings, Users, Globe, Clock, AlertTriangle } from "lucide-react";

export default function AdminSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<AdminSettingsFormData>({
    resolver: zodResolver(AdminSettingsSchema),
    defaultValues: defaultAdminSettings,
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAdminSettings();
        form.reset(settings);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      }
    };

    loadSettings();
  }, [form]);

  const onSubmit = async (data: AdminSettingsFormData) => {
    setIsLoading(true);
    try {
      await updateAdminSettings(data);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetAdminSettings();
      form.reset(defaultAdminSettings);
      toast.success("Settings reset to defaults");
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Settings</h2>
          <p className="text-muted-foreground">
            Manage your notification preferences and dashboard settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? "Resetting..." : "Reset to Defaults"}
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Seller Applications</Label>
                      <p className="text-sm text-muted-foreground">
                        New seller applications submitted
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.sellerApplications")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.sellerApplications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Customer Disputes</Label>
                      <p className="text-sm text-muted-foreground">
                        New customer disputes filed
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.customerDisputes")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.customerDisputes", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Refund Requests</Label>
                      <p className="text-sm text-muted-foreground">
                        New refund requests submitted
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.refundRequests")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.refundRequests", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Content Flags</Label>
                      <p className="text-sm text-muted-foreground">
                        Content flagged for review
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.contentFlags")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.contentFlags", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important system notifications
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.systemAlerts")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.systemAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Financial Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Financial and payment alerts
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.financialAlerts")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.financialAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Suspensions</Label>
                      <p className="text-sm text-muted-foreground">
                        User account suspensions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.userSuspensions")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.userSuspensions", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>General Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        General admin notifications
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("emailNotifications.generalNotifications")}
                      onCheckedChange={(checked) =>
                        form.setValue("emailNotifications.generalNotifications", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Dashboard Preferences
                </CardTitle>
                <CardDescription>
                  Customize your dashboard experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default View</Label>
                    <Select
                      value={form.watch("dashboardPreferences.defaultView")}
                      onValueChange={(value) =>
                        form.setValue("dashboardPreferences.defaultView", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="products">Products</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Items Per Page</Label>
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      value={form.watch("dashboardPreferences.itemsPerPage")}
                      onChange={(e) =>
                        form.setValue("dashboardPreferences.itemsPerPage", parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Recent Activity</Label>
                      <p className="text-sm text-muted-foreground">
                        Display recent activity widget
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("dashboardPreferences.showRecentActivity")}
                      onCheckedChange={(checked) =>
                        form.setValue("dashboardPreferences.showRecentActivity", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Quick Stats</Label>
                      <p className="text-sm text-muted-foreground">
                        Display quick statistics cards
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("dashboardPreferences.showQuickStats")}
                      onCheckedChange={(checked) =>
                        form.setValue("dashboardPreferences.showQuickStats", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Auto Refresh Interval (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      value={form.watch("dashboardPreferences.autoRefreshInterval")}
                      onChange={(e) =>
                        form.setValue("dashboardPreferences.autoRefreshInterval", parseInt(e.target.value))
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      0 = disabled, max 5 minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Task Management
                </CardTitle>
                <CardDescription>
                  Configure task assignment and management preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Assign Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign tasks to you
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("taskPreferences.autoAssignTasks")}
                      onCheckedChange={(checked) =>
                        form.setValue("taskPreferences.autoAssignTasks", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Task Priority Threshold</Label>
                    <Select
                      value={form.watch("taskPreferences.taskPriorityThreshold")}
                      onValueChange={(value) =>
                        form.setValue("taskPreferences.taskPriorityThreshold", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Concurrent Tasks</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={form.watch("taskPreferences.maxConcurrentTasks")}
                      onChange={(e) =>
                        form.setValue("taskPreferences.maxConcurrentTasks", parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Task Reminder Interval (minutes)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={1440}
                      value={form.watch("taskPreferences.taskReminderInterval")}
                      onChange={(e) =>
                        form.setValue("taskPreferences.taskReminderInterval", parseInt(e.target.value))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Preferences
                </CardTitle>
                <CardDescription>
                  Configure system display and localization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={form.watch("systemPreferences.timezone")}
                      onValueChange={(value) =>
                        form.setValue("systemPreferences.timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select
                      value={form.watch("systemPreferences.dateFormat")}
                      onValueChange={(value) =>
                        form.setValue("systemPreferences.dateFormat", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select
                      value={form.watch("systemPreferences.timeFormat")}
                      onValueChange={(value) =>
                        form.setValue("systemPreferences.timeFormat", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={form.watch("systemPreferences.language")}
                      onValueChange={(value) =>
                        form.setValue("systemPreferences.language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={form.watch("systemPreferences.theme")}
                      onValueChange={(value) =>
                        form.setValue("systemPreferences.theme", value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Preferences
                </CardTitle>
                <CardDescription>
                  Configure security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Force 2FA for admin access
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("securityPreferences.requireTwoFactor")}
                      onCheckedChange={(checked) =>
                        form.setValue("securityPreferences.requireTwoFactor", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={480}
                      value={form.watch("securityPreferences.sessionTimeout")}
                      onChange={(e) =>
                        form.setValue("securityPreferences.sessionTimeout", parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify on successful logins
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("securityPreferences.loginNotifications")}
                      onCheckedChange={(checked) =>
                        form.setValue("securityPreferences.loginNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Suspicious Activity Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert on suspicious activity
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("securityPreferences.suspiciousActivityAlerts")}
                      onCheckedChange={(checked) =>
                        form.setValue("securityPreferences.suspiciousActivityAlerts", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Role-Specific Settings
                </CardTitle>
                <CardDescription>
                  Configure permissions for your admin role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage Users</Label>
                      <p className="text-sm text-muted-foreground">
                        User management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageUsers")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageUsers", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage Products</Label>
                      <p className="text-sm text-muted-foreground">
                        Product management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageProducts")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageProducts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage Orders</Label>
                      <p className="text-sm text-muted-foreground">
                        Order management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageOrders")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageOrders", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage Sellers</Label>
                      <p className="text-sm text-muted-foreground">
                        Seller management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageSellers")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageSellers", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage Content</Label>
                      <p className="text-sm text-muted-foreground">
                        Content management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageContent")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageContent", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>View Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Analytics access permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canViewAnalytics")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canViewAnalytics", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage System</Label>
                      <p className="text-sm text-muted-foreground">
                        System management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageSystem")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageSystem", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Manage Financials</Label>
                      <p className="text-sm text-muted-foreground">
                        Financial management permissions
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("roleSpecificSettings.canManageFinancials")}
                      onCheckedChange={(checked) =>
                        form.setValue("roleSpecificSettings.canManageFinancials", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
} 