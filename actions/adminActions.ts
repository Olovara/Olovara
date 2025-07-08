import { db } from "@/lib/db"; // Use the global Prisma instance
import { User, AccountStatus } from "@prisma/client";
import { getAuthUserId, getUserRole } from "./authActions";
import { currentUser } from "@/lib/auth";
import { 
  PERMISSIONS, 
  getPermissionValue, 
  createRolePermissions, 
  ROLES, 
  ADMIN_ROLES,
  ADMIN_TASK_TYPES,
  ADMIN_TASK_STATUS,
  ADMIN_TASK_PRIORITY,
  ADMIN_NOTIFICATION_TYPES,
  INITIAL_SELLER_PERMISSIONS
} from "@/data/roles-and-permissions";
import { updateUserSession } from "@/lib/session-update";
import { triggerCompleteSessionUpdate } from "@/lib/session-utils";
import { sendSellerApplicationApprovedEmail, sendSellerApplicationRejectedEmail } from "@/lib/mail";
import { ObjectId } from "mongodb";

interface GetUsersParams {
  role?: string;
  status?: AccountStatus;
  pageNumber: string;
  pageSize: string;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
}

export async function getUsers({
  role,
  status,
  pageNumber = "1",
  pageSize = "12",
}: GetUsersParams): Promise<PaginatedResponse<User>> {
  const userId = await getAuthUserId();

  const page = isNaN(parseInt(pageNumber)) ? 1 : parseInt(pageNumber);
  const limit = isNaN(parseInt(pageSize)) ? 12 : parseInt(pageSize);
  const skip = (page - 1) * limit;

  try {
    // Dynamic WHERE filters based on parameters
    const usersSelect = {
      where: {
        AND: [
          ...(role ? [{ role }] : []),
          ...(status ? [{ status }] : []),
          { id: { not: userId } },
        ],
      },
    };

    const count = await db.user.count(usersSelect); // Using the global db client
    const users = await db.user.findMany({
      ...usersSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return {
      items: users,
      totalCount: count,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error; // Customize this error handling based on your needs
  }
}

export async function getAllSellers() {
  try {
    console.log("Starting getAllSellers...");
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes('VIEW_SELLER_APPLICATIONS');
    
    if (!hasViewSellerApplications) {
      console.error("Access denied: User does not have VIEW_SELLER_APPLICATIONS permission");
      throw new Error("Forbidden: Insufficient permissions");
    }

    console.log("Fetching all seller applications...");
    const applications = await db.sellerApplication.findMany({
      select: {
        id: true,
        userId: true,
        createdAt: true,
        craftingProcess: true,
        productTypes: true,
        interestInJoining: true,
        // Simplified fields for enhanced application review
        onlinePresence: true,
        yearsOfExperience: true,
        birthdate: true,
        agreeToHandmadePolicy: true,
        certifyOver18: true,
        agreeToTerms: true,
        applicationApproved: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
    console.log("Found applications:", {
      count: applications.length,
      firstApplication: applications[0] ? {
        id: applications[0].id,
        userId: applications[0].userId,
        username: applications[0].user?.username,
        email: applications[0].user?.email
      } : null
    });
    return applications;
  } catch (error) {
    console.error("Error in getAllSellers:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });
    return [];
  }
}

export async function getApprovedSellers() {
  try {
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes('VIEW_SELLER_APPLICATIONS');
    
    if (!hasViewSellerApplications) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    return await db.sellerApplication.findMany({
      where: {
        applicationApproved: true,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        craftingProcess: true,
        productTypes: true,
        interestInJoining: true,
        // Simplified fields for enhanced application review
        onlinePresence: true,
        yearsOfExperience: true,
        birthdate: true,
        agreeToHandmadePolicy: true,
        certifyOver18: true,
        agreeToTerms: true,
        applicationApproved: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching approved seller applications:", error);
    return [];
  }
}

export async function getUnapprovedSellers() {
  try {
    console.log("Starting getUnapprovedSellers...");
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes('VIEW_SELLER_APPLICATIONS');
    
    if (!hasViewSellerApplications) {
      console.error("Access denied: User does not have VIEW_SELLER_APPLICATIONS permission");
      throw new Error("Forbidden: Insufficient permissions");
    }

    console.log("Fetching unapproved seller applications...");
    const applications = await db.sellerApplication.findMany({
      where: {
        applicationApproved: false,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        craftingProcess: true,
        productTypes: true,
        interestInJoining: true,
        // Simplified fields for enhanced application review
        onlinePresence: true,
        yearsOfExperience: true,
        birthdate: true,
        agreeToHandmadePolicy: true,
        certifyOver18: true,
        agreeToTerms: true,
        applicationApproved: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
    console.log("Found applications:", {
      count: applications.length,
      firstApplication: applications[0] ? {
        id: applications[0].id,
        userId: applications[0].userId,
        username: applications[0].user?.username,
        email: applications[0].user?.email
      } : null
    });
    return applications;
  } catch (error) {
    console.error("Error in getUnapprovedSellers:", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    });
    return [];
  }
}

export async function approveApplication(applicationId: string) {
  try {
    // Validate that the applicationId is a valid ObjectID
    if (!ObjectId.isValid(applicationId)) {
      throw new Error("Invalid application ID format");
    }

    // Verify that the current user has APPROVE_SELLERS permission
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has APPROVE_SELLERS permission
    const hasApproveSellersPermission = currentUserData.permissions?.includes('APPROVE_SELLERS');
    
    if (!hasApproveSellersPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Retrieve the seller application to get the userId
    const sellerApplication = await db.sellerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    });

    if (!sellerApplication) {
      throw new Error("Seller application not found.");
    }

    const { userId } = sellerApplication;

    // Update application and seller in a transaction to ensure consistency
    await db.$transaction(async (tx) => {
      // Approve the seller application
      await tx.sellerApplication.update({
        where: { id: applicationId },
        data: { applicationApproved: true },
      });

      // Update the existing seller document to mark application as accepted
      await tx.seller.update({
        where: { userId },
        data: { applicationAccepted: true },
      });

      // Grant initial seller permissions (without product permissions)
      const sellerPermissions = INITIAL_SELLER_PERMISSIONS.map(permission => ({
        permission,
        grantedAt: new Date(),
        grantedBy: currentUserData.id,
        reason: 'Application approved by admin - initial seller permissions',
        expiresAt: null,
      }));

      // Get current user permissions and merge
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { permissions: true },
      });

      if (user) {
        const currentPermissions = user.permissions as any[];
        const existingPermissionValues = currentPermissions.map(p => p.permission);
        const uniqueNewPermissions = sellerPermissions.filter(p => !existingPermissionValues.includes(p.permission));
        const updatedPermissions = [...currentPermissions, ...uniqueNewPermissions];

        await tx.user.update({
          where: { id: userId },
          data: { permissions: updatedPermissions },
        });
      }
    });

    // Send approval email to seller (outside of transaction to avoid blocking)
    try {
      if (sellerApplication.user.email) {
        await sendSellerApplicationApprovedEmail(
          sellerApplication.user.email,
          sellerApplication.user.username || 'Seller'
        );
        console.log(`Approval email sent to seller: ${sellerApplication.user.email}`);
      }
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the approval process if email fails
    }

    // Trigger complete session update with WebSocket notification
    await triggerCompleteSessionUpdate(userId, currentUserData.id || 'system', 'Seller application approved');

    return { success: true };
  } catch (error) {
    console.error("Error approving application:", error);
    return { success: false, error: "Failed to approve application." };
  }
}

export async function rejectApplication(applicationId: string, rejectionReason?: string) {
  try {
    // Validate that the applicationId is a valid ObjectID
    if (!ObjectId.isValid(applicationId)) {
      throw new Error("Invalid application ID format");
    }

    const currentUserData = await currentUser();
    
    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has APPROVE_SELLERS permission (same permission for approve/reject)
    const hasApproveSellersPermission = currentUserData.permissions?.includes('APPROVE_SELLERS');
    
    if (!hasApproveSellersPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get the seller application to find the userId
    const sellerApplication = await db.sellerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    });

    if (!sellerApplication) {
      throw new Error("Seller application not found.");
    }

    const { userId } = sellerApplication;

    // Delete application and seller document in a transaction
    await db.$transaction(async (tx) => {
      // Delete the seller application
      await tx.sellerApplication.delete({
        where: { id: applicationId },
      });

      // Delete the seller document since application was rejected
      await tx.seller.delete({
        where: { userId },
      });

      // Revert user role back to MEMBER and restore member permissions
      const memberPermissions = [
        'ACCESS_MEMBER_DASHBOARD',
        'VIEW_USERS',
        'MANAGE_MESSAGES',
        'MANAGE_REVIEWS',
        'MANAGE_MEMBER_SETTINGS',
      ].map(permission => ({
        permission,
        grantedAt: new Date(),
        grantedBy: currentUserData.id,
        reason: 'Application rejected - restored member permissions',
        expiresAt: null,
      }));

      await tx.user.update({
        where: { id: userId },
        data: { 
          role: ROLES.MEMBER,
          permissions: memberPermissions,
        },
      });
    });

    // Send rejection email to seller (outside of transaction to avoid blocking)
    try {
      if (sellerApplication.user.email) {
        await sendSellerApplicationRejectedEmail(
          sellerApplication.user.email,
          sellerApplication.user.username || 'Seller',
          rejectionReason
        );
        console.log(`Rejection email sent to seller: ${sellerApplication.user.email}`);
      }
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
      // Don't fail the rejection process if email fails
    }

    // Trigger complete session update with WebSocket notification
    await triggerCompleteSessionUpdate(userId, currentUserData.id || 'system', 'Seller application rejected');

    return { success: true };
  } catch (error) {
    console.error("Error rejecting application:", error);
    return { success: false, error: "Failed to reject application." };
  }
}

export async function getAllUsers() {
  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_USERS permission
    const hasViewUsersPermission = user.permissions?.includes('VIEW_USERS');
    
    if (!hasViewUsersPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        image: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getUserPermissions(userId: string) {
  try {
    // Validate that the userId is a valid ObjectID
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_PERMISSIONS permission
    const hasManagePermissions = currentUserData.permissions?.includes('MANAGE_PERMISSIONS');
    
    if (!hasManagePermissions) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        image: true,
        status: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            shopName: true,
            shopNameSlug: true,
            shopTagLine: true,
            shopDescription: true,
            applicationAccepted: true,
            stripeConnected: true,
            connectedAccountId: true,
            totalSales: true,
            totalProducts: true,
            acceptsCustom: true,
            isWomanOwned: true,
            isMinorityOwned: true,
            isLGBTQOwned: true,
            isVeteranOwned: true,
            isSustainable: true,
            isCharitable: true,
            valuesPreferNotToSay: true,
            taxCountry: true,
            taxIdVerified: true,
            taxIdVerificationDate: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    throw error;
  }
}

export async function addUserPermission(userId: string, permission: string, reason?: string) {
  try {
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_PERMISSIONS permission
    const hasManagePermissions = currentUserData.permissions?.includes('MANAGE_PERMISSIONS');
    
    if (!hasManagePermissions) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if permission already exists
    const existingPermissions = user.permissions as any[];
    const permissionExists = existingPermissions.some(p => p.permission === permission);

    if (permissionExists) {
      throw new Error("Permission already exists for this user");
    }

    // Add new permission
    const newPermission = {
      permission,
      grantedAt: new Date(),
      grantedBy: currentUserData.id,
      reason: reason || "Granted by admin",
    };

    const updatedPermissions = [...existingPermissions, newPermission];

    await db.user.update({
      where: { id: userId },
      data: { permissions: updatedPermissions },
    });

    // Update user's session to include new permissions
    await updateUserSession(userId);

    // Send real-time session update notification
    try {
      const emitSessionUpdate = (global as any).emitSessionUpdate;
      if (typeof emitSessionUpdate === "function") {
        emitSessionUpdate(
          userId, 
          currentUserData.email || currentUserData.id || "Unknown Admin",
          `Permission "${permission}" added: ${reason || "Granted by admin"}`
        );
      }
    } catch (socketError) {
      console.error("Error sending session update notification:", socketError);
      // Don't fail the permission update if socket notification fails
    }

    return { success: true, message: "Permission added successfully" };
  } catch (error) {
    console.error("Error adding user permission:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add permission" };
  }
}

export async function removeUserPermission(userId: string, permission: string) {
  try {
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_PERMISSIONS permission
    const hasManagePermissions = currentUserData.permissions?.includes('MANAGE_PERMISSIONS');
    
    if (!hasManagePermissions) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Remove the permission
    const existingPermissions = user.permissions as any[];
    const updatedPermissions = existingPermissions.filter(p => p.permission !== permission);

    await db.user.update({
      where: { id: userId },
      data: { permissions: updatedPermissions },
    });

    // Update user's session to reflect removed permissions
    await updateUserSession(userId);

    // Send real-time session update notification
    try {
      const emitSessionUpdate = (global as any).emitSessionUpdate;
      if (typeof emitSessionUpdate === "function") {
        emitSessionUpdate(
          userId, 
          currentUserData.email || currentUserData.id || "Unknown Admin",
          `Permission "${permission}" removed by admin`
        );
      }
    } catch (socketError) {
      console.error("Error sending session update notification:", socketError);
      // Don't fail the permission update if socket notification fails
    }

    return { success: true, message: "Permission removed successfully" };
  } catch (error) {
    console.error("Error removing user permission:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove permission" };
  }
}

// Dashboard Statistics Functions
export async function getDashboardStats() {
  try {
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes('ACCESS_ADMIN_DASHBOARD');
    
    if (!hasAccessAdminDashboard) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get all counts in parallel for better performance
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingSellerApplications,
      activeUsers,
      suspendedUsers,
      totalRevenue,
      recentOrders
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // Total sellers (users with seller profile)
      db.seller.count(),
      
      // Total products
      db.product.count(),
      
      // Total orders
      db.order.count(),
      
      // Pending seller applications
      db.sellerApplication.count({
        where: { applicationApproved: false }
      }),
      
      // Active users
      db.user.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Suspended users
      db.user.count({
        where: { status: 'SUSPENDED' }
      }),
      
      // Total revenue (sum of all completed orders)
      db.order.aggregate({
        where: { 
          status: 'COMPLETED',
          paymentStatus: 'PAID'
        },
        _sum: { totalAmount: true }
      }),
      
      // Recent orders (last 7 days)
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          }
        }
      })
    ]);

    // Get user growth (users created in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get product growth (products created in last 30 days)
    const newProductsThisMonth = await db.product.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get recent seller applications (last 7 days)
    const recentSellerApplications = await db.sellerApplication.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth
      },
      sellers: {
        total: totalSellers,
        pendingApplications: pendingSellerApplications,
        recentApplications: recentSellerApplications
      },
      products: {
        total: totalProducts,
        newThisMonth: newProductsThisMonth
      },
      orders: {
        total: totalOrders,
        recent: recentOrders
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

export async function getRecentActivity() {
  try {
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes('ACCESS_ADMIN_DASHBOARD');
    
    if (!hasAccessAdminDashboard) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get recent activities
    const [recentUsers, recentOrders, recentProducts, recentApplications] = await Promise.all([
      // Recent users (last 5)
      db.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          image: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent orders (last 5)
      db.order.findMany({
        select: {
          id: true,
          totalAmount: true,
          currency: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              email: true
            }
          },
          product: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent products (last 5)
      db.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          status: true,
          createdAt: true,
          seller: {
            select: {
              shopName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent seller applications (last 5)
      db.sellerApplication.findMany({
        select: {
          id: true,
          applicationApproved: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return {
      recentUsers,
      recentOrders,
      recentProducts,
      recentApplications
    };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
}

// Admin management functions
export async function createAdmin(userId: string, role: string = "GENERAL_ADMIN") {
  try {
    const admin = await db.admin.create({
      data: {
        userId,
        role,
        notificationPreferences: [
          {
            type: "SELLER_APPLICATIONS",
            email: true,
            inApp: true
          },
          {
            type: "DISPUTES",
            email: true,
            inApp: true
          },
          {
            type: "SYSTEM_ALERTS",
            email: true,
            inApp: true
          }
        ],
        tasks: [] // Initialize with empty tasks array
      }
    });

    return { success: true, admin };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { success: false, error: "Failed to create admin" };
  }
}

export async function getAdminByUserId(userId: string) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId },
      include: { user: true }
    });
    return { success: true, admin };
  } catch (error) {
    console.error("Error fetching admin:", error);
    return { success: false, error: "Failed to fetch admin" };
  }
}

export async function updateAdminRole(userId: string, newRole: string) {
  try {
    const admin = await db.admin.update({
      where: { userId },
      data: { role: newRole }
    });
    return { success: true, admin };
  } catch (error) {
    console.error("Error updating admin role:", error);
    return { success: false, error: "Failed to update admin role" };
  }
}

export async function deactivateAdmin(userId: string) {
  try {
    const admin = await db.admin.update({
      where: { userId },
      data: { isActive: false }
    });
    return { success: true, admin };
  } catch (error) {
    console.error("Error deactivating admin:", error);
    return { success: false, error: "Failed to deactivate admin" };
  }
}

export async function updateAdminNotificationPreferences(userId: string, preferences: any[]) {
  try {
    const admin = await db.admin.update({
      where: { userId },
      data: { notificationPreferences: preferences }
    });
    return { success: true, admin };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: "Failed to update notification preferences" };
  }
}

export async function addAdminTask(userId: string, task: any) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId }
    });

    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const currentTasks = admin.tasks as any[] || [];
    const newTask = {
      id: generateTaskId(),
      ...task,
      createdAt: new Date().toISOString(),
      status: task.status || "PENDING"
    };

    const updatedTasks = [...currentTasks, newTask];

    const updatedAdmin = await db.admin.update({
      where: { userId },
      data: { tasks: updatedTasks }
    });

    return { success: true, admin: updatedAdmin };
  } catch (error) {
    console.error("Error adding admin task:", error);
    return { success: false, error: "Failed to add task" };
  }
}

export async function updateAdminTask(userId: string, taskId: string, updates: any) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId }
    });

    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const currentTasks = admin.tasks as any[] || [];
    const taskIndex = currentTasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      return { success: false, error: "Task not found" };
    }

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const updatedAdmin = await db.admin.update({
      where: { userId },
      data: { tasks: updatedTasks }
    });

    return { success: true, admin: updatedAdmin };
  } catch (error) {
    console.error("Error updating admin task:", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function removeAdminTask(userId: string, taskId: string) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId }
    });

    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const currentTasks = admin.tasks as any[] || [];
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);

    const updatedAdmin = await db.admin.update({
      where: { userId },
      data: { tasks: updatedTasks }
    });

    return { success: true, admin: updatedAdmin };
  } catch (error) {
    console.error("Error removing admin task:", error);
    return { success: false, error: "Failed to remove task" };
  }
}

// Helper function to generate unique task IDs
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to get admins who should receive email notifications for seller applications
export async function getAdminsForSellerApplicationNotification() {
  try {
    const admins = await db.admin.findMany({
      where: {
        isActive: true,
        user: {
          status: 'ACTIVE'
        },
        OR: [
          { role: ADMIN_ROLES.SUPER_ADMIN },
          { role: ADMIN_ROLES.SELLER_MANAGER }
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    });

    // Filter admins who have the specific notification preference
    const filteredAdmins = admins.filter(admin => {
      if (!admin.notificationPreferences) return false;
      
      const preferences = admin.notificationPreferences as string[];
      return preferences.includes(ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED);
    });

    return filteredAdmins;
  } catch (error) {
    console.error("Error fetching admins for seller application notification:", error);
    return [];
  }
}

// Helper function to set up admin notification preferences for seller applications TODO: Possibly remove at some point
export async function setupAdminSellerApplicationNotifications(userId: string) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId }
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Get current preferences or initialize empty array
    const currentPreferences = admin.notificationPreferences as string[] || [];
    
    // Add seller application notification if not already present
    if (!currentPreferences.includes(ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED)) {
      const updatedPreferences = [...currentPreferences, ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED];
      
      await db.admin.update({
        where: { userId },
        data: {
          notificationPreferences: updatedPreferences
        }
      });
    }

    return { success: "Seller application notifications enabled" };
  } catch (error) {
    console.error("Error setting up admin seller application notifications:", error);
    return { error: "Failed to set up notifications" };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: string,
  reason: string,
  updatedBy: string
) {
  try {
    const currentUserData = await currentUser();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_ROLES permission
    const hasManageRoles = currentUserData.permissions?.includes('MANAGE_ROLES');
    
    if (!hasManageRoles) {
      throw new Error("Forbidden: Insufficient permissions. MANAGE_ROLES permission required.");
    }

    // Validate the new role
    const validRoles = ["ADMIN", "MEMBER", "SELLER"];
    if (!validRoles.includes(newRole)) {
      return { error: "Invalid role" };
    }

    // Update the user's role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Log the role change (using console for now)
    console.log(`Role change logged: User ${updatedBy} changed user ${userId} role to ${newRole}. Reason: ${reason}`);

    // Update user session to reflect new role
    await updateUserSession(userId);

    // Emit WebSocket event for real-time session update
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/socket/session-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          updatedBy,
          reason: `Role changed to ${newRole}: ${reason}`,
        }),
      });

      if (response.ok) {
        console.log("WebSocket session update sent successfully");
      } else {
        console.log("WebSocket session update failed, but role was updated");
      }
    } catch (error) {
      console.log("WebSocket session update error:", error);
      // Continue anyway - the role was still updated successfully
    }

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: error instanceof Error ? error.message : "Failed to update user role" };
  }
}