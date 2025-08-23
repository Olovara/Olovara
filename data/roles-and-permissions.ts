export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
  MEMBER: 'MEMBER',
} as const;

export type Role = keyof typeof ROLES;

// Admin Roles for specialized admin tasks
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',           // Full access to everything
  GENERAL_ADMIN: 'GENERAL_ADMIN',       // General admin tasks
  SELLER_MANAGER: 'SELLER_MANAGER',     // Handles seller applications and issues
  CONTENT_MODERATOR: 'CONTENT_MODERATOR', // Manages content, blog, reviews
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT', // Handles customer issues and disputes
  FINANCIAL_ADMIN: 'FINANCIAL_ADMIN',   // Handles financial matters, refunds, disputes
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',         // Technical system management
} as const;

export type AdminRole = keyof typeof ADMIN_ROLES;

// Admin Task Types
export const ADMIN_TASK_TYPES = {
  SELLER_APPLICATION_REVIEW: 'SELLER_APPLICATION_REVIEW',
  CONTENT_MODERATION: 'CONTENT_MODERATION',
  CUSTOMER_DISPUTE: 'CUSTOMER_DISPUTE',
  REFUND_REQUEST: 'REFUND_REQUEST',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  USER_SUSPENSION: 'USER_SUSPENSION',
  PRODUCT_REVIEW: 'PRODUCT_REVIEW',
  BLOG_APPROVAL: 'BLOG_APPROVAL',
  FINANCIAL_REVIEW: 'FINANCIAL_REVIEW',
  GENERAL_TASK: 'GENERAL_TASK',
} as const;

export type AdminTaskType = keyof typeof ADMIN_TASK_TYPES;

// Admin Task Status
export const ADMIN_TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ESCALATED: 'ESCALATED',
} as const;

export type AdminTaskStatus = keyof typeof ADMIN_TASK_STATUS;

// Admin Task Priority
export const ADMIN_TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type AdminTaskPriority = keyof typeof ADMIN_TASK_PRIORITY;

// Admin Notification Types
export const ADMIN_NOTIFICATION_TYPES = {
  SELLER_APPLICATION_SUBMITTED: 'SELLER_APPLICATION_SUBMITTED',
  SELLER_APPLICATION_APPROVED: 'SELLER_APPLICATION_APPROVED',
  SELLER_APPLICATION_REJECTED: 'SELLER_APPLICATION_REJECTED',
  CUSTOMER_DISPUTE_CREATED: 'CUSTOMER_DISPUTE_CREATED',
  REFUND_REQUEST_SUBMITTED: 'REFUND_REQUEST_SUBMITTED',
  CONTENT_FLAGGED: 'CONTENT_FLAGGED',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  FINANCIAL_ALERT: 'FINANCIAL_ALERT',
  USER_SUSPENSION_REQUEST: 'USER_SUSPENSION_REQUEST',
  GENERAL_ADMIN_NOTIFICATION: 'GENERAL_ADMIN_NOTIFICATION',
} as const;

export type AdminNotificationType = keyof typeof ADMIN_NOTIFICATION_TYPES;

export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: { value: 'MANAGE_USERS', group: 'User Management', label: 'Manage Users' },
  VIEW_USERS: { value: 'VIEW_USERS', group: 'User Management', label: 'View Users' },
  DELETE_USERS: { value: 'DELETE_USERS', group: 'User Management', label: 'Delete Users' },
  SUSPEND_USERS: { value: 'SUSPEND_USERS', group: 'User Management', label: 'Suspend Users' },
  MANAGE_PERMISSIONS: { value: 'MANAGE_PERMISSIONS', group: 'User Management', label: 'Manage Permissions' },
  MANAGE_ROLES: { value: 'MANAGE_ROLES', group: 'User Management', label: 'Manage User Roles' },

  // Dashboard Access
  ACCESS_ADMIN_DASHBOARD: { value: 'ACCESS_ADMIN_DASHBOARD', group: 'Dashboard Access', label: 'Access Admin Dashboard' },
  ACCESS_SELLER_DASHBOARD: { value: 'ACCESS_SELLER_DASHBOARD', group: 'Dashboard Access', label: 'Access Seller Dashboard' },
  ACCESS_MEMBER_DASHBOARD: { value: 'ACCESS_MEMBER_DASHBOARD', group: 'Dashboard Access', label: 'Access Member Dashboard' },
  
  // Content Management
  MANAGE_CONTENT: { value: 'MANAGE_CONTENT', group: 'Content Management', label: 'Manage Content' },
  WRITE_BLOG: { value: 'WRITE_BLOG', group: 'Content Management', label: 'Write Blog' },
  PUBLISH_BLOG: { value: 'PUBLISH_BLOG', group: 'Content Management', label: 'Publish Blog' },
  DELETE_BLOG: { value: 'DELETE_BLOG', group: 'Content Management', label: 'Delete Blog' },
  MANAGE_COMMENTS: { value: 'MANAGE_COMMENTS', group: 'Content Management', label: 'Manage Comments' },
  WRITE_HELP_ARTICLES: { value: 'WRITE_HELP_ARTICLES', group: 'Content Management', label: 'Write Help Articles' },
  PUBLISH_HELP_ARTICLES: { value: 'PUBLISH_HELP_ARTICLES', group: 'Content Management', label: 'Publish Help Articles' },
  DELETE_HELP_ARTICLES: { value: 'DELETE_HELP_ARTICLES', group: 'Content Management', label: 'Delete Help Articles' },
  MANAGE_HELP_CATEGORIES: { value: 'MANAGE_HELP_CATEGORIES', group: 'Content Management', label: 'Manage Help Categories' },
  
  // Product Management
  MANAGE_PRODUCTS: { value: 'MANAGE_PRODUCTS', group: 'Product Management', label: 'Manage Products' },
  CREATE_PRODUCTS: { value: 'CREATE_PRODUCTS', group: 'Product Management', label: 'Create Products' },
  EDIT_PRODUCTS: { value: 'EDIT_PRODUCTS', group: 'Product Management', label: 'Edit Products' },
  DELETE_PRODUCTS: { value: 'DELETE_PRODUCTS', group: 'Product Management', label: 'Delete Products' },
  MANAGE_PRODUCT_CATEGORIES: { value: 'MANAGE_PRODUCT_CATEGORIES', group: 'Product Management', label: 'Manage Product Categories' },
  
  // Order Management
  MANAGE_ORDERS: { value: 'MANAGE_ORDERS', group: 'Order Management', label: 'Manage Orders' },
  VIEW_ORDERS: { value: 'VIEW_ORDERS', group: 'Order Management', label: 'View Orders' },
  PROCESS_ORDERS: { value: 'PROCESS_ORDERS', group: 'Order Management', label: 'Process Orders' },
  REFUND_ORDERS: { value: 'REFUND_ORDERS', group: 'Order Management', label: 'Refund Orders' },
  
  // Review Management
  MANAGE_REVIEWS: { value: 'MANAGE_REVIEWS', group: 'Review Management', label: 'Manage Reviews' },
  
  // Seller Management
  MANAGE_SELLERS: { value: 'MANAGE_SELLERS', group: 'Seller Management', label: 'Manage Sellers' },
  APPROVE_SELLERS: { value: 'APPROVE_SELLERS', group: 'Seller Management', label: 'Approve Sellers' },
  SUSPEND_SELLERS: { value: 'SUSPEND_SELLERS', group: 'Seller Management', label: 'Suspend Sellers' },
  VIEW_SELLER_APPLICATIONS: { value: 'VIEW_SELLER_APPLICATIONS', group: 'Seller Management', label: 'View Seller Applications' },
  
  // Founding Seller Management
  VIEW_FOUNDING_SELLERS: { value: 'VIEW_FOUNDING_SELLERS', group: 'Founding Seller Management', label: 'View Founding Sellers' },
  MANAGE_FOUNDING_SELLERS: { value: 'MANAGE_FOUNDING_SELLERS', group: 'Founding Seller Management', label: 'Manage Founding Sellers' },
  ASSIGN_LEGACY_FOUNDING_SELLER: { value: 'ASSIGN_LEGACY_FOUNDING_SELLER', group: 'Founding Seller Management', label: 'Assign Legacy Founding Seller Status' },
  
  // System Management
  MANAGE_SYSTEM: { value: 'MANAGE_SYSTEM', group: 'System Management', label: 'Manage System' },
  VIEW_LOGS: { value: 'VIEW_LOGS', group: 'System Management', label: 'View Logs' },
  MANAGE_ADMIN_SETTINGS: { value: 'MANAGE_ADMIN_SETTINGS', group: 'System Management', label: 'Manage Admin Settings' },
  MANAGE_SELLER_SETTINGS: { value: 'MANAGE_SELLER_SETTINGS', group: 'System Management', label: 'Manage Seller Settings' },
  MANAGE_MEMBER_SETTINGS: { value: 'MANAGE_MEMBER_SETTINGS', group: 'System Management', label: 'Manage Member Settings' },
  MANAGE_CURRENCIES: { value: 'MANAGE_CURRENCIES', group: 'System Management', label: 'Manage Currencies' },
  MANAGE_POLICIES: { value: 'MANAGE_POLICIES', group: 'System Management', label: 'Manage Policies' },
  
  // Analytics
  VIEW_ANALYTICS: { value: 'VIEW_ANALYTICS', group: 'Analytics', label: 'View Analytics' },
  EXPORT_ANALYTICS: { value: 'EXPORT_ANALYTICS', group: 'Analytics', label: 'Export Analytics' },
  VIEW_ONBOARDING_SURVEYS: { value: 'VIEW_ONBOARDING_SURVEYS', group: 'Analytics', label: 'View Onboarding Surveys' },
  
  // Fraud Detection
  VIEW_FRAUD_DETECTION: { value: 'VIEW_FRAUD_DETECTION', group: 'Fraud Detection', label: 'View Fraud Detection Events' },
  MANAGE_FRAUD_DETECTION: { value: 'MANAGE_FRAUD_DETECTION', group: 'Fraud Detection', label: 'Manage Fraud Detection Events' },
  CREATE_FRAUD_EVENTS: { value: 'CREATE_FRAUD_EVENTS', group: 'Fraud Detection', label: 'Create Fraud Detection Events' },
  
  // Communication
  MANAGE_MESSAGES: { value: 'MANAGE_MESSAGES', group: 'Communication', label: 'Manage Messages' },
  SEND_BROADCASTS: { value: 'SEND_BROADCASTS', group: 'Communication', label: 'Send Broadcasts' },
  MANAGE_NOTIFICATIONS: { value: 'MANAGE_NOTIFICATIONS', group: 'Communication', label: 'Manage Notifications' }
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Helper function to get permission value
export const getPermissionValue = (permission: Permission): string => {
  return PERMISSIONS[permission].value;
};

// Helper function to get all permission values
export const getPermissionValues = (): string[] => {
  return Object.values(PERMISSIONS).map(p => p.value);
};

// Helper function to group permissions
export const getPermissionGroups = () => {
  const groups: Record<string, { value: string; label: string }[]> = {};
  
  Object.entries(PERMISSIONS).forEach(([key, permission]) => {
    const group = permission.group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push({
      value: permission.value,
      label: permission.label
    });
  });
  
  return groups;
};

// Default role permissions mapping (using permission values)
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: getPermissionValues(), // Super admin has all permissions
  ADMIN: [
    'MANAGE_USERS',
    'VIEW_USERS',
    'ACCESS_ADMIN_DASHBOARD',
    'MANAGE_CONTENT',
    'WRITE_BLOG',
    'PUBLISH_BLOG',
    'DELETE_BLOG',
    'MANAGE_COMMENTS',
    'WRITE_HELP_ARTICLES',
    'PUBLISH_HELP_ARTICLES',
    'DELETE_HELP_ARTICLES',
    'MANAGE_HELP_CATEGORIES',
    'MANAGE_PRODUCTS',
    'MANAGE_ORDERS',
    'VIEW_ORDERS',
    'PROCESS_ORDERS',
    'REFUND_ORDERS',
    'MANAGE_SELLERS',
    'APPROVE_SELLERS',
    'SUSPEND_SELLERS',
    'VIEW_SELLER_APPLICATIONS',
    'MANAGE_SYSTEM',
    'VIEW_LOGS',
    'MANAGE_ADMIN_SETTINGS',
    'VIEW_ANALYTICS',
    'VIEW_ONBOARDING_SURVEYS',
    'MANAGE_MESSAGES',
    'SEND_BROADCASTS',
    'MANAGE_NOTIFICATIONS',
    'MANAGE_REVIEWS',
  ],
  SELLER: [
    'ACCESS_SELLER_DASHBOARD',
    'MANAGE_PRODUCTS',
    'CREATE_PRODUCTS',
    'EDIT_PRODUCTS',
    'DELETE_PRODUCTS',
    'VIEW_ORDERS',
    'PROCESS_ORDERS',
    'MANAGE_MESSAGES',
    'MANAGE_REVIEWS',
    'MANAGE_SELLER_SETTINGS',
  ],
  MEMBER: [
    'ACCESS_MEMBER_DASHBOARD',
    'VIEW_USERS',
    'MANAGE_MESSAGES',
    'MANAGE_REVIEWS',
    'MANAGE_MEMBER_SETTINGS',
  ],
};

// Initial seller permissions (when application is submitted, before onboarding completion)
export const INITIAL_SELLER_PERMISSIONS = [
  'ACCESS_SELLER_DASHBOARD',
  'VIEW_ORDERS',
  'PROCESS_ORDERS',
  'MANAGE_MESSAGES',
  'MANAGE_REVIEWS',
  'MANAGE_SELLER_SETTINGS',
];

// Full seller permissions (after onboarding completion, including product permissions)
export const FULL_SELLER_PERMISSIONS = [
  'ACCESS_SELLER_DASHBOARD',
  'MANAGE_PRODUCTS',
  'CREATE_PRODUCTS',
  'EDIT_PRODUCTS',
  'DELETE_PRODUCTS',
  'VIEW_ORDERS',
  'PROCESS_ORDERS',
  'MANAGE_MESSAGES',
  'MANAGE_REVIEWS',
  'MANAGE_SELLER_SETTINGS',
];

// Route permissions mapping
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin": ['ACCESS_ADMIN_DASHBOARD'],
  "/admin/users": ['MANAGE_USERS'],
  "/admin/users/[userId]": ['MANAGE_PERMISSIONS'],
  "/admin/sellers": ['MANAGE_SELLERS'],
  "/admin/seller-applications": ['VIEW_SELLER_APPLICATIONS'],
  "/admin/founding-sellers": ['VIEW_FOUNDING_SELLERS'],
  "/admin/orders": ['MANAGE_ORDERS'],
  "/admin/products": ['MANAGE_PRODUCTS'],
  "/admin/blog": ['MANAGE_CONTENT'],
  "/admin/help-center": ['MANAGE_HELP_CATEGORIES'],
  "/admin/settings": ['MANAGE_ADMIN_SETTINGS'],
  "/admin/analytics": ['VIEW_ANALYTICS'],
  "/admin/onboarding-surveys": ['VIEW_ONBOARDING_SURVEYS'],
  "/admin/fraud-detection": ['VIEW_FRAUD_DETECTION'],
  "/seller": ['ACCESS_SELLER_DASHBOARD'],
  "/seller/orders": ['VIEW_ORDERS'],
  "/seller/products": ['MANAGE_PRODUCTS'],
  "/seller/messages": ['MANAGE_MESSAGES'],
  "/seller/settings": ['MANAGE_SELLER_SETTINGS'],
  "/member": ['ACCESS_MEMBER_DASHBOARD'],
  "/member/messages": ['MANAGE_MESSAGES'],
};

// Helper function to create permission objects for a role
export const createRolePermissions = (role: Role, grantedBy?: string) => {
  const permissions = ROLE_PERMISSIONS[role];
  
  return permissions.map(permission => ({
    permission,
    grantedAt: new Date(),
    grantedBy: grantedBy || 'system',
    reason: `Default permissions for ${role} role`,
    expiresAt: null, // No expiration for default role permissions
  }));
};