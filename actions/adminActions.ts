import { db } from "@/lib/db"; // Use the global Prisma instance
import { User, AccountStatus } from "@prisma/client";
import { getAuthUserId, getUserRole } from "./authActions";
import { currentUser } from "@/lib/auth";
import { PERMISSIONS, getPermissionValue } from "@/data/roles-and-permissions";

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
        portfolio: true,
        interestInJoining: true,
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
        portfolio: true,
        interestInJoining: true,
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
        portfolio: true,
        interestInJoining: true,
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
    });

    if (!sellerApplication) {
      throw new Error("Seller application not found.");
    }

    const { userId } = sellerApplication;

    // Update all three in a transaction to ensure consistency
    await db.$transaction(async (tx) => {
      // Approve the seller application
      await tx.sellerApplication.update({
        where: { id: applicationId },
        data: { applicationApproved: true },
      });

      // Check if seller exists
      const existingSeller = await tx.seller.findUnique({
        where: { userId },
      });

      if (existingSeller) {
        // Update existing seller
        await tx.seller.update({
          where: { userId },
          data: { applicationAccepted: true },
        });
      } else {
        // Create new seller
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const tempShopName = `Temporary Shop ${timestamp}-${randomString}`;
        const tempShopSlug = `temporary-shop-${timestamp}-${randomString}`;

        await tx.seller.create({
          data: {
            shopName: tempShopName,
            shopNameSlug: tempShopSlug,
            applicationAccepted: true,
            // Required encrypted fields with temporary values
            encryptedBusinessName: "Temporary Business Name",
            businessNameIV: "temp-iv",
            businessNameSalt: "temp-salt",
            encryptedTaxId: "Temporary Tax ID",
            taxIdIV: "temp-iv",
            taxIdSalt: "temp-salt",
            taxCountry: "US", // Default to US, can be updated later
            user: {
              connect: {
                id: userId
              }
            }
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error approving application:", error);
    return { success: false, error: "Failed to approve application." };
  }
}

export async function rejectApplication(applicationId: string) {
  try {
    const currentUserData = await currentUser();
    
    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has APPROVE_SELLERS permission (same permission for approve/reject)
    const hasApproveSellersPermission = currentUserData.permissions?.includes('APPROVE_SELLERS');
    
    if (!hasApproveSellersPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    await db.sellerApplication.delete({
      where: { id: applicationId },
    });
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