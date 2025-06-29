import * as z from "zod";

export const AdminSettingsSchema = z.object({
  // Notification Preferences
  emailNotifications: z.object({
    sellerApplications: z.boolean().default(true),
    customerDisputes: z.boolean().default(true),
    refundRequests: z.boolean().default(true),
    contentFlags: z.boolean().default(true),
    systemAlerts: z.boolean().default(true),
    financialAlerts: z.boolean().default(true),
    userSuspensions: z.boolean().default(true),
    generalNotifications: z.boolean().default(true),
  }),
  
  // Dashboard Preferences
  dashboardPreferences: z.object({
    defaultView: z.enum(["overview", "orders", "products", "users", "applications"]).default("overview"),
    itemsPerPage: z.number().min(5).max(100).default(20),
    showRecentActivity: z.boolean().default(true),
    showQuickStats: z.boolean().default(true),
    autoRefreshInterval: z.number().min(0).max(300).default(30), // 0 = disabled, max 5 minutes
  }),
  
  // Task Management Preferences
  taskPreferences: z.object({
    autoAssignTasks: z.boolean().default(false),
    taskPriorityThreshold: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    maxConcurrentTasks: z.number().min(1).max(10).default(3),
    taskReminderInterval: z.number().min(15).max(1440).default(60), // minutes
  }),
  
  // System Preferences
  systemPreferences: z.object({
    timezone: z.string().default("UTC"),
    dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("MM/DD/YYYY"),
    timeFormat: z.enum(["12h", "24h"]).default("12h"),
    language: z.string().default("en"),
    theme: z.enum(["light", "dark", "system"]).default("system"),
  }),
  
  // Security Preferences
  securityPreferences: z.object({
    requireTwoFactor: z.boolean().default(false),
    sessionTimeout: z.number().min(15).max(480).default(120), // minutes
    loginNotifications: z.boolean().default(true),
    suspiciousActivityAlerts: z.boolean().default(true),
  }),
  
  // Assigned Regions (for regional admins)
  assignedRegions: z.array(z.string()).default([]),
  
  // Admin Role Specific Settings
  roleSpecificSettings: z.object({
    canManageUsers: z.boolean().default(true),
    canManageProducts: z.boolean().default(true),
    canManageOrders: z.boolean().default(true),
    canManageSellers: z.boolean().default(true),
    canManageContent: z.boolean().default(true),
    canViewAnalytics: z.boolean().default(true),
    canManageSystem: z.boolean().default(false),
    canManageFinancials: z.boolean().default(false),
  }),
});

export type AdminSettingsFormData = z.infer<typeof AdminSettingsSchema>;

// Default settings
export const defaultAdminSettings: AdminSettingsFormData = {
  emailNotifications: {
    sellerApplications: true,
    customerDisputes: true,
    refundRequests: true,
    contentFlags: true,
    systemAlerts: true,
    financialAlerts: true,
    userSuspensions: true,
    generalNotifications: true,
  },
  dashboardPreferences: {
    defaultView: "overview",
    itemsPerPage: 20,
    showRecentActivity: true,
    showQuickStats: true,
    autoRefreshInterval: 30,
  },
  taskPreferences: {
    autoAssignTasks: false,
    taskPriorityThreshold: "MEDIUM",
    maxConcurrentTasks: 3,
    taskReminderInterval: 60,
  },
  systemPreferences: {
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    language: "en",
    theme: "system",
  },
  securityPreferences: {
    requireTwoFactor: false,
    sessionTimeout: 120,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
  },
  assignedRegions: [],
  roleSpecificSettings: {
    canManageUsers: true,
    canManageProducts: true,
    canManageOrders: true,
    canManageSellers: true,
    canManageContent: true,
    canViewAnalytics: true,
    canManageSystem: false,
    canManageFinancials: false,
  },
}; 