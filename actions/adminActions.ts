import { db } from "@/lib/db"; // Use the global Prisma instance
import { User, AccountStatus } from "@prisma/client";
import { getAuthUserId, getUserRole } from "./authActions";
import { currentUser, currentUserWithPermissions } from "@/lib/auth";
import {
  ROLES, 
  ADMIN_ROLES,
  ADMIN_NOTIFICATION_TYPES,
  INITIAL_SELLER_PERMISSIONS
} from "@/data/roles-and-permissions";
import { sendSellerApplicationApprovedEmail, sendSellerApplicationRejectedEmail } from "@/lib/mail";
import { decryptBirthdate } from "@/lib/encryption";
import { ObjectId } from "mongodb";
import { updateOnboardingStep } from "@/lib/onboarding";

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
    const currentUserData = await currentUserWithPermissions();

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
        encryptedBirthdate: true,
        birthdateIV: true,
        birthdateSalt: true,
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
    
    // Decrypt birthdate for each application
    const applicationsWithDecryptedBirthdate = applications.map(app => {
      let birthdate = "N/A";
      try {
        birthdate = decryptBirthdate({
          encryptedBirthdate: app.encryptedBirthdate,
          birthdateIV: app.birthdateIV,
          birthdateSalt: app.birthdateSalt,
        });
      } catch (error) {
        console.error("Error decrypting birthdate for application:", app.id, error);
        birthdate = "Error decrypting";
      }
      
      return {
        ...app,
        birthdate,
      };
    });
    
    return applicationsWithDecryptedBirthdate;
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
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes('VIEW_SELLER_APPLICATIONS');
    
    if (!hasViewSellerApplications) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const applications = await db.sellerApplication.findMany({
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
        encryptedBirthdate: true,
        birthdateIV: true,
        birthdateSalt: true,
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
    
    // Decrypt birthdate for each application
    const applicationsWithDecryptedBirthdate = applications.map(app => {
      let birthdate = "N/A";
      try {
        if (app.encryptedBirthdate && app.birthdateIV && app.birthdateSalt) {
          birthdate = decryptBirthdate({
            encryptedBirthdate: app.encryptedBirthdate,
            birthdateIV: app.birthdateIV,
            birthdateSalt: app.birthdateSalt,
          });
        }
      } catch (error) {
        console.error("Error decrypting birthdate for application:", app.id, error);
        birthdate = "Error decrypting";
      }
      
      return {
        ...app,
        birthdate,
      };
    });
    
    return applicationsWithDecryptedBirthdate;
  } catch (error) {
    console.error("Error fetching approved seller applications:", error);
    return [];
  }
}

export async function getUnapprovedSellers() {
  try {
    console.log("Starting getUnapprovedSellers...");
    const currentUserData = await currentUserWithPermissions();

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
        encryptedBirthdate: true,
        birthdateIV: true,
        birthdateSalt: true,
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
    
    // Decrypt birthdate for each application
    const applicationsWithDecryptedBirthdate = applications.map(app => {
      let birthdate = "N/A";
      try {
        if (app.encryptedBirthdate && app.birthdateIV && app.birthdateSalt) {
          birthdate = decryptBirthdate({
            encryptedBirthdate: app.encryptedBirthdate,
            birthdateIV: app.birthdateIV,
            birthdateSalt: app.birthdateSalt,
          });
        }
      } catch (error) {
        console.error("Error decrypting birthdate for application:", app.id, error);
        birthdate = "Error decrypting";
      }
      
      return {
        ...app,
        birthdate,
      };
    });
    
    return applicationsWithDecryptedBirthdate;
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
    const currentUserData = await currentUserWithPermissions();

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

    // Get the seller ID from the userId
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!seller) {
      throw new Error("Seller record not found for user.");
    }

    const sellerId = seller.id;

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

    // Note: Session refresh is now handled by the client-side page reload
    // The user's role and permissions have been updated in the database
    // Mark application_approved step as completed
    await updateOnboardingStep(sellerId, "application_approved", true);

    console.log(`Seller application approved for user ${userId}. User role and permissions updated.`);

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

    const currentUserData = await currentUserWithPermissions();
    
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

    // Note: Session refresh is now handled by the client-side page reload
    // The user's role and permissions have been updated in the database
    console.log(`Seller application rejected for user ${userId}. User role and permissions updated.`);

    return { success: true };
  } catch (error) {
    console.error("Error rejecting application:", error);
    return { success: false, error: "Failed to reject application." };
  }
}

export async function getAllUsers() {
  try {
    const user = await currentUserWithPermissions();

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

    const currentUserData = await currentUserWithPermissions();

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
            shopCountry: true,
            isWomanOwned: true,
            isMinorityOwned: true,
            isLGBTQOwned: true,
            isVeteranOwned: true,
            isSustainable: true,
            isCharitable: true,
            valuesPreferNotToSay: true,
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

export async function addUserPermission(
  userId: string,
  permission: string,
  reason: string,
  grantedBy: string
) {
  try {
    // Add permission to user
    await db.user.update({
      where: { id: userId },
      data: {
        permissions: {
          push: {
            permission,
            grantedAt: new Date(),
            grantedBy,
            reason,
            expiresAt: null,
          },
        },
      },
    });

    console.log(`Permission ${permission} added to user ${userId} by ${grantedBy}`);

    return {
      success: true,
      message: `Permission "${permission}" has been granted to the user.`,
    };
  } catch (error) {
    console.error("Error adding user permission:", error);
    return {
      success: false,
      error: "Failed to add permission",
    };
  }
}

export async function removeUserPermission(
  userId: string,
  permission: string,
  removedBy: string
) {
  try {
    // Get current user permissions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Filter out the permission to remove
    const updatedPermissions = (user.permissions as any[]).filter(
      (p: any) => p.permission !== permission
    );

    // Update user permissions
    await db.user.update({
      where: { id: userId },
      data: {
        permissions: updatedPermissions as any,
      },
    });

    console.log(`Permission ${permission} removed from user ${userId} by ${removedBy}`);

    return {
      success: true,
      message: `Permission "${permission}" has been removed from the user.`,
    };
  } catch (error) {
    console.error("Error removing user permission:", error);
    return {
      success: false,
      error: "Failed to remove permission",
    };
  }
}

// Dashboard Statistics Functions
export async function getDashboardStats() {
  try {
    const currentUserData = await currentUserWithPermissions();

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
      recentOrders,
      totalReports,
      pendingReports,
      criticalReports
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
      }),
      
      // Total reports
      db.report.count(),
      
      // Pending reports
      db.report.count({
        where: { status: 'PENDING' }
      }),
      
      // Critical reports
      db.report.count({
        where: { severity: 'CRITICAL' }
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
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        critical: criticalReports
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

export async function getRecentActivity() {
  try {
    const currentUserData = await currentUserWithPermissions();

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
    console.log("Fetching admins for seller application notification...");
    
    // First, get admins from the Admin table
    // NOTE: Currently Admin table queries return 0 results, likely due to database environment/migration issues
    // The User table fallback is working correctly for current super admin accounts
    const adminTableAdmins = await db.admin.findMany({
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
            username: true,
            status: true
          }
        }
      }
    });

    console.log(`Found ${adminTableAdmins.length} active admins in Admin table with SUPER_ADMIN or SELLER_MANAGER role`);
    
    // Debug: Let's also check what admins exist without the status filter
    const allAdminsInTable = await db.admin.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            status: true
          }
        }
      }
    });
    
    console.log(`Total admins in Admin table: ${allAdminsInTable.length}`);
    allAdminsInTable.forEach(admin => {
      console.log(`Admin record: userId=${admin.userId}, role=${admin.role}, isActive=${admin.isActive}, userStatus=${admin.user?.status}`);
    });
    
    // Test simpler queries to isolate the issue
    const superAdminAdmins = await db.admin.findMany({
      where: { role: 'SUPER_ADMIN' }
    });
    console.log(`Admins with SUPER_ADMIN role: ${superAdminAdmins.length}`);
    
    const activeAdmins = await db.admin.findMany({
      where: { isActive: true }
    });
    console.log(`Active admins: ${activeAdmins.length}`);
    
    // Let's also check if we can find your specific admin record by userId
    const yourAdminRecord = await db.admin.findUnique({
      where: { userId: '681948f56125257664f88194' }
    });
    console.log(`Your specific admin record:`, yourAdminRecord);
    
    // And let's check if the user exists
    const yourUserRecord = await db.user.findUnique({
      where: { id: '681948f56125257664f88194' }
    });
    console.log(`Your user record:`, yourUserRecord ? {
      id: yourUserRecord.id,
      username: yourUserRecord.username,
      email: yourUserRecord.email,
      role: yourUserRecord.role,
      status: yourUserRecord.status
    } : null);

    // Also get users with SUPER_ADMIN role from the User table (for backward compatibility)
    const superAdminUsers = await db.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        username: true
      }
    });

    console.log(`Found ${superAdminUsers.length} users with SUPER_ADMIN role in User table`);

    // Combine both sources
    const allAdmins = [
      ...adminTableAdmins,
      ...superAdminUsers.map(user => ({
        userId: user.id,
        role: 'SUPER_ADMIN',
        isActive: true,
        user: {
          email: user.email,
          username: user.username
        }
      }))
    ];

    console.log(`Total admins found: ${allAdmins.length}`);

    // Filter admins who have the specific notification preference enabled for email
    const filteredAdmins = allAdmins.filter(admin => {
      console.log(`Checking admin ${admin.userId} (role: ${admin.role})`);
      
      // For users from User table (no Admin record), always include them
      if (!('notificationPreferences' in admin) || !admin.notificationPreferences) {
        console.log(`Admin ${admin.userId} has no notification preferences - including as fallback`);
        return true; // Include super admins even without specific preferences
      }
      
      const preferences = admin.notificationPreferences as any[];
      console.log(`Admin ${admin.userId} has ${preferences.length} notification preferences:`, preferences);
      
      // Look for the specific notification type with email enabled
      const sellerAppNotification = preferences.find(pref => {
        console.log(`Checking preference:`, pref);
        return pref.notificationType === ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED;
      });
      
      console.log(`Seller app notification found for admin ${admin.userId}:`, sellerAppNotification);
      
      if (sellerAppNotification && (sellerAppNotification.emailEnabled || sellerAppNotification.email)) {
        console.log(`Admin ${admin.userId} has seller application email notifications enabled`);
        return true;
      } else {
        console.log(`Admin ${admin.userId} does not have seller application email notifications enabled`);
        console.log(`Email enabled check:`, sellerAppNotification?.emailEnabled, sellerAppNotification?.email);
        return false;
      }
    });

    console.log(`Found ${filteredAdmins.length} admins with seller application email notifications enabled`);
    
    // Fallback: If no admins have specific notification preferences, 
    // send to all SUPER_ADMIN users as a critical notification
    if (filteredAdmins.length === 0) {
      console.log("No admins with specific notification preferences found, falling back to all SUPER_ADMIN users");
      const superAdmins = allAdmins.filter(admin => admin.role === ADMIN_ROLES.SUPER_ADMIN);
      console.log(`Found ${superAdmins.length} SUPER_ADMIN users for fallback notification`);
      return superAdmins;
    }
    
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

interface GetContactSubmissionsParams {
  search?: string;
  reason?: string;
  page?: number;
}

interface ContactSubmissionsResponse {
  data: Array<{
    id: string;
    name: string;
    email: string;
    reason: string;
    helpDescription: string;
    createdAt: Date;
  }>;
  total: number;
  totalPages: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
}

export async function getContactSubmissions({
  search = "",
  reason = "",
  page = 1,
}: GetContactSubmissionsParams): Promise<ContactSubmissionsResponse> {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_CONTENT permission
    const hasManageContent = currentUserData.permissions?.includes('MANAGE_CONTENT');
    
    if (!hasManageContent) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { helpDescription: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (reason && reason !== "all") {
      whereClause.reason = reason;
    }

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      db.contactUs.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.contactUs.count({ where: whereClause }),
    ]);

    // Get stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [thisMonth, thisWeek, today] = await Promise.all([
      db.contactUs.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      db.contactUs.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      db.contactUs.count({
        where: { createdAt: { gte: startOfDay } },
      }),
    ]);

    return {
      data: submissions,
      total,
      totalPages: Math.ceil(total / pageSize),
      thisMonth,
      thisWeek,
      today,
    };
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    throw error;
  }
}

export async function getContactSubmissionById(id: string) {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_CONTENT permission
    const hasManageContent = currentUserData.permissions?.includes('MANAGE_CONTENT');
    
    if (!hasManageContent) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const submission = await db.contactUs.findUnique({
      where: { id },
    });

    return submission;
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    return null;
  }
}

export async function updateUserRole(
  userId: string,
  newRole: string,
  reason: string,
  updatedBy: string
) {
  try {
    // Get role permissions
    const { ROLE_PERMISSIONS, createRolePermissions } = await import("@/data/roles-and-permissions");
    
    // Update user role
    await db.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        permissions: createRolePermissions(newRole as any, updatedBy),
      },
    });

    // If the new role is ADMIN or SUPER_ADMIN, create or update Admin document
    if (newRole === 'ADMIN' || newRole === 'SUPER_ADMIN') {
      try {
        // Check if admin record already exists
        const existingAdmin = await db.admin.findUnique({
          where: { userId }
        });

        if (existingAdmin) {
          // Update existing admin record
          await db.admin.update({
            where: { userId },
            data: {
              role: newRole,
              isActive: true
            }
          });
          console.log(`Admin record updated for user ${userId} with role ${newRole}`);
        } else {
          // Create new admin record
          await createAdmin(userId, newRole);
          console.log(`Admin record created for user ${userId} with role ${newRole}`);
        }
      } catch (adminError) {
        console.error("Error creating/updating admin record:", adminError);
        // Don't fail the entire operation if admin record creation fails
      }
    } else {
      // If role is not ADMIN or SUPER_ADMIN, deactivate any existing admin record
      try {
        const existingAdmin = await db.admin.findUnique({
          where: { userId }
        });

        if (existingAdmin) {
          await db.admin.update({
            where: { userId },
            data: { isActive: false }
          });
          console.log(`Admin record deactivated for user ${userId}`);
        }
      } catch (adminError) {
        console.error("Error deactivating admin record:", adminError);
        // Don't fail the entire operation if admin record deactivation fails
      }
    }

    console.log(`User ${userId} role updated to ${newRole} by ${updatedBy}`);

    return {
      success: true,
      message: `User role has been updated to "${newRole}".`,
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: "Failed to update user role",
    };
  }
}