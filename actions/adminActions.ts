import { db } from "@/lib/db"; // Use the global Prisma instance
import { User, AccountStatus } from "@prisma/client";
import { getAuthUserId, getUserRole } from "./authActions";
import { currentUser, currentUserWithPermissions } from "@/lib/auth";
import {
  ROLES,
  ADMIN_ROLES,
  ADMIN_NOTIFICATION_TYPES,
  INITIAL_SELLER_PERMISSIONS,
} from "@/data/roles-and-permissions";
import {
  sendSellerApplicationApprovedEmail,
  sendSellerApplicationRejectedEmail,
  sendSellerApplicationInformationRequestEmail,
} from "@/lib/mail";
import { decryptBirthdate } from "@/lib/encryption";
import { ObjectId } from "mongodb";
import {
  updateOnboardingStep,
  initializeOnboardingSteps,
} from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";
import { ProductInteractionService } from "@/lib/analytics";

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
  // Declare variables outside try block so they're accessible in catch
  let userId: string | null = null;

  try {
    userId = await getAuthUserId();

    const page = isNaN(parseInt(pageNumber)) ? 1 : parseInt(pageNumber);
    const limit = isNaN(parseInt(pageSize)) ? 12 : parseInt(pageSize);
    const skip = (page - 1) * limit;

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
    // Log to console (always happens)
    console.error("Error fetching users:", error);

    // Log to database - admin could email about "can't load users"
    logError({
      code: "ADMIN_GET_USERS_FAILED",
      userId: userId || undefined,
      route: "actions/adminActions",
      method: "getUsers",
      error,
      metadata: {
        role,
        status,
        pageNumber,
        pageSize,
        note: "Failed to fetch users",
      },
    });

    throw error; // Re-throw for caller to handle
  }
}

export async function getAllSellers() {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    console.log("Starting getAllSellers...");
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes(
      "VIEW_SELLER_APPLICATIONS"
    );

    if (!hasViewSellerApplications) {
      console.error(
        "Access denied: User does not have VIEW_SELLER_APPLICATIONS permission"
      );
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
            seller: {
              select: {
                productPhoto: true,
                workstationPhoto: true,
              },
            },
          },
        },
      },
    });
    console.log("Found applications:", {
      count: applications.length,
      firstApplication: applications[0]
        ? {
          id: applications[0].id,
          userId: applications[0].userId,
          username: applications[0].user?.username,
          email: applications[0].user?.email,
        }
        : null,
    });

    // Decrypt birthdate for each application
    const applicationsWithDecryptedBirthdate = applications.map((app) => {
      let birthdate = "N/A";
      try {
        birthdate = decryptBirthdate({
          encryptedBirthdate: app.encryptedBirthdate,
          birthdateIV: app.birthdateIV,
          birthdateSalt: app.birthdateSalt,
        });
      } catch (error) {
        console.error(
          "Error decrypting birthdate for application:",
          app.id,
          error
        );
        birthdate = "Error decrypting";
      }

      // Type assertion needed because Prisma select doesn't include seller in type inference
      const userWithSeller = app.user as typeof app.user & {
        seller?: { productPhoto: string | null; workstationPhoto: string | null } | null;
      };

      return {
        ...app,
        birthdate,
        productPhoto: userWithSeller?.seller?.productPhoto || null,
        workstationPhoto: userWithSeller?.seller?.workstationPhoto || null,
      };
    });

    return applicationsWithDecryptedBirthdate;
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in getAllSellers:", {
      error:
        error instanceof Error
          ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
          : error,
      timestamp: new Date().toISOString(),
    });

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      return [];
    }

    // Log to database - admin could email about "can't load all sellers"
    logError({
      code: "ADMIN_GET_ALL_SELLERS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getAllSellers",
      error,
      metadata: {
        note: "Failed to fetch all seller applications",
      },
    });

    return [];
  }
}

/**
 * Get all active sellers for admin product creation
 * Returns sellers who are approved, fully activated, and not suspended
 */
export async function getActiveSellersForProductCreation() {
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has CREATE_PRODUCTS_FOR_SELLERS permission
    const hasPermission = currentUserData.permissions?.includes(
      "CREATE_PRODUCTS_FOR_SELLERS"
    );

    if (!hasPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get all active sellers (approved, fully activated, not suspended)
    // Note: Filter user status in JS since Prisma/MongoDB has issues with enum null checks
    const sellers = await db.seller.findMany({
      where: {
        applicationAccepted: true,
        isFullyActivated: true,
      },
      select: {
        id: true,
        userId: true,
        shopName: true,
        shopNameSlug: true,
        shopTagLine: true,
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
        shopCountry: true,
        excludedCountries: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
            status: true,
          },
        },
      },
      orderBy: {
        shopName: "asc",
      },
    });

    // Filter out suspended/vacation users in JS
    const filteredSellers = sellers.filter((s) => {
      const status = s.user?.status;
      return !status || status === "ACTIVE";
    });

    return filteredSellers.map((seller) => ({
      id: seller.id,
      userId: seller.userId,
      shopName: seller.shopName,
      shopNameSlug: seller.shopNameSlug,
      shopTagLine: seller.shopTagLine,
      preferredCurrency: seller.preferredCurrency,
      preferredWeightUnit: seller.preferredWeightUnit,
      preferredDimensionUnit: seller.preferredDimensionUnit,
      preferredDistanceUnit: seller.preferredDistanceUnit,
      shopCountry: seller.shopCountry,
      excludedCountries: seller.excludedCountries || [],
      user: seller.user,
    }));
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in getActiveSellersForProductCreation:", {
      error:
        error instanceof Error
          ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
          : error,
      timestamp: new Date().toISOString(),
    });

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      return [];
    }

    // Log to database
    logError({
      code: "ADMIN_GET_ACTIVE_SELLERS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getActiveSellersForProductCreation",
      error,
      metadata: {
        note: "Failed to fetch active sellers for product creation",
      },
    });

    return [];
  }
}

export async function getApprovedSellers() {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes(
      "VIEW_SELLER_APPLICATIONS"
    );

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
            seller: {
              select: {
                productPhoto: true,
                workstationPhoto: true,
              },
            },
          },
        },
      },
    });

    // Decrypt birthdate for each application
    const applicationsWithDecryptedBirthdate = applications.map((app) => {
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
        console.error(
          "Error decrypting birthdate for application:",
          app.id,
          error
        );
        birthdate = "Error decrypting";
      }

      // Type assertion needed because Prisma select doesn't include seller in type inference
      const userWithSeller = app.user as typeof app.user & {
        seller?: { productPhoto: string | null; workstationPhoto: string | null } | null;
      };

      return {
        ...app,
        birthdate,
        productPhoto: userWithSeller?.seller?.productPhoto || null,
        workstationPhoto: userWithSeller?.seller?.workstationPhoto || null,
      };
    });

    return applicationsWithDecryptedBirthdate;
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching approved seller applications:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      return [];
    }

    // Log to database - admin could email about "can't load approved sellers"
    logError({
      code: "ADMIN_GET_APPROVED_SELLERS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getApprovedSellers",
      error,
      metadata: {
        note: "Failed to fetch approved seller applications",
      },
    });

    return [];
  }
}

export async function getUnapprovedSellers() {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    console.log("Starting getUnapprovedSellers...");
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_SELLER_APPLICATIONS permission
    const hasViewSellerApplications = currentUserData.permissions?.includes(
      "VIEW_SELLER_APPLICATIONS"
    );

    if (!hasViewSellerApplications) {
      console.error(
        "Access denied: User does not have VIEW_SELLER_APPLICATIONS permission"
      );
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
      firstApplication: applications[0]
        ? {
          id: applications[0].id,
          userId: applications[0].userId,
          username: applications[0].user?.username,
          email: applications[0].user?.email,
        }
        : null,
    });

    // Decrypt birthdate for each application
    const applicationsWithDecryptedBirthdate = applications.map((app) => {
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
        console.error(
          "Error decrypting birthdate for application:",
          app.id,
          error
        );
        birthdate = "Error decrypting";
      }

      // Type assertion needed because Prisma select doesn't include seller in type inference
      const userWithSeller = app.user as typeof app.user & {
        seller?: { productPhoto: string | null; workstationPhoto: string | null } | null;
      };

      return {
        ...app,
        birthdate,
        productPhoto: userWithSeller?.seller?.productPhoto || null,
        workstationPhoto: userWithSeller?.seller?.workstationPhoto || null,
      };
    });

    return applicationsWithDecryptedBirthdate;
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in getUnapprovedSellers:", {
      error:
        error instanceof Error
          ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
          : error,
      timestamp: new Date().toISOString(),
    });

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      return [];
    }

    // Log to database - admin could email about "can't load unapproved sellers"
    logError({
      code: "ADMIN_GET_UNAPPROVED_SELLERS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getUnapprovedSellers",
      error,
      metadata: {
        note: "Failed to fetch unapproved seller applications",
      },
    });

    return [];
  }
}

export async function approveApplication(applicationId: string) {
  const startTime = Date.now();
  const logContext: Record<string, any> = {
    applicationId,
    timestamp: new Date().toISOString(),
    action: "approve_application",
  };
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    console.log(`[APPROVAL] Starting approval process`, logContext);

    // Validate that the applicationId is a valid ObjectID
    if (!ObjectId.isValid(applicationId)) {
      console.error(`[APPROVAL] Invalid application ID format`, {
        ...logContext,
        error: "Invalid ObjectID format",
      });
      throw new Error("Invalid application ID format");
    }

    // Verify that the current user has APPROVE_SELLERS permission
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      console.error(`[APPROVAL] Authentication failed`, {
        ...logContext,
        error: "Not authenticated",
      });
      throw new Error("Not authenticated");
    }

    // Don't log admin user details for security/privacy
    // Only log that authentication succeeded
    logContext.adminAuthenticated = true;

    // Check if user has APPROVE_SELLERS permission
    const hasApproveSellersPermission =
      currentUserData.permissions?.includes("APPROVE_SELLERS");

    if (!hasApproveSellersPermission) {
      console.error(`[APPROVAL] Permission denied`, {
        ...logContext,
        error: "Insufficient permissions",
        // Don't log permissions array for security
      });
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Log permission check without exposing admin details
    console.log(`[APPROVAL] Admin authenticated and authorized`, {
      ...logContext,
      hasApprovePermission: true,
    });

    // Retrieve the seller application to get the userId
    const sellerApplication = await db.sellerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!sellerApplication) {
      console.error(`[APPROVAL] Application not found`, { ...logContext });
      throw new Error("Seller application not found.");
    }

    const { userId } = sellerApplication;
    // Don't log seller email/username for privacy - only log IDs for debugging
    logContext.sellerUserId = userId;

    console.log(`[APPROVAL] Application found`, {
      ...logContext,
      applicationApproved: sellerApplication.applicationApproved,
    });

    // Get the seller ID from the userId
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!seller) {
      console.error(`[APPROVAL] Seller record not found`, { ...logContext });
      throw new Error("Seller record not found for user.");
    }

    const sellerId = seller.id;
    logContext.sellerId = sellerId;

    console.log(`[APPROVAL] Initializing onboarding steps`, { ...logContext });

    // Initialize onboarding steps first (if not already initialized)
    // This ensures the step exists before we try to update it
    try {
      await initializeOnboardingSteps(sellerId);
      console.log(`[APPROVAL] Onboarding steps initialized`, { ...logContext });
    } catch (initError) {
      console.error(`[APPROVAL] Failed to initialize onboarding steps`, {
        ...logContext,
        error:
          initError instanceof Error ? initError.message : String(initError),
        stack: initError instanceof Error ? initError.stack : undefined,
      });
      throw initError;
    }

    // Update application and seller in a transaction to ensure consistency
    console.log(`[APPROVAL] Starting database transaction`, { ...logContext });

    try {
      await db.$transaction(async (tx) => {
        // Approve the seller application
        console.log(`[APPROVAL] Updating seller application`, {
          ...logContext,
        });
        await tx.sellerApplication.update({
          where: { id: applicationId },
          data: { applicationApproved: true },
        });

        // Update the existing seller document to mark application as accepted
        console.log(`[APPROVAL] Updating seller record`, { ...logContext });
        await tx.seller.update({
          where: { userId },
          data: { applicationAccepted: true },
        });

        // Update the onboarding step inside the transaction for atomicity
        console.log(`[APPROVAL] Updating onboarding step`, { ...logContext });
        await tx.onboardingStep.upsert({
          where: {
            sellerId_stepKey: {
              sellerId,
              stepKey: "application_approved",
            },
          },
          update: {
            completed: true,
            completedAt: new Date(),
          },
          create: {
            sellerId,
            stepKey: "application_approved",
            completed: true,
            completedAt: new Date(),
          },
        });

        // Grant initial seller permissions (without product permissions)
        const sellerPermissions = INITIAL_SELLER_PERMISSIONS.map(
          (permission) => ({
            permission,
            grantedAt: new Date(),
            grantedBy: currentUserData.id,
            reason:
              "Application approved by admin - initial seller permissions",
            expiresAt: null,
          })
        );

        console.log(`[APPROVAL] Granting seller permissions`, {
          ...logContext,
          permissionsCount: sellerPermissions.length,
        });

        // Get current user permissions and merge
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { permissions: true },
        });

        if (user) {
          const currentPermissions = user.permissions as any[];
          const existingPermissionValues = currentPermissions.map(
            (p) => p.permission
          );
          const uniqueNewPermissions = sellerPermissions.filter(
            (p) => !existingPermissionValues.includes(p.permission)
          );
          const updatedPermissions = [
            ...currentPermissions,
            ...uniqueNewPermissions,
          ];

          console.log(`[APPROVAL] Updating user permissions`, {
            ...logContext,
            existingPermissionsCount: currentPermissions.length,
            newPermissionsCount: uniqueNewPermissions.length,
            totalPermissionsCount: updatedPermissions.length,
          });

          await tx.user.update({
            where: { id: userId },
            data: { permissions: updatedPermissions },
          });
        } else {
          console.warn(
            `[APPROVAL] User record not found for permission update`,
            { ...logContext }
          );
        }
      });

      const transactionDuration = Date.now() - startTime;
      console.log(`[APPROVAL] Transaction completed successfully`, {
        ...logContext,
        durationMs: transactionDuration,
      });
    } catch (transactionError) {
      const transactionDuration = Date.now() - startTime;
      console.error(`[APPROVAL] Transaction failed`, {
        ...logContext,
        error:
          transactionError instanceof Error
            ? transactionError.message
            : String(transactionError),
        stack:
          transactionError instanceof Error
            ? transactionError.stack
            : undefined,
        durationMs: transactionDuration,
      });
      throw transactionError;
    }

    // Recalculate isFullyActivated after transaction (this does additional queries)
    // Use the full updateOnboardingStep function to ensure isFullyActivated is recalculated
    console.log(`[APPROVAL] Recalculating isFullyActivated`, { ...logContext });
    try {
      await updateOnboardingStep(sellerId, "application_approved", true);
      console.log(`[APPROVAL] isFullyActivated recalculated successfully`, {
        ...logContext,
      });
    } catch (stepError) {
      console.error(
        `[APPROVAL] Failed to recalculate isFullyActivated (non-critical)`,
        {
          ...logContext,
          error:
            stepError instanceof Error ? stepError.message : String(stepError),
          stack: stepError instanceof Error ? stepError.stack : undefined,
          note: "Step was already updated in transaction, this is just for recalculation",
        }
      );
      // Don't fail the approval if this fails - the step was already updated in the transaction
      // This just ensures isFullyActivated is recalculated
    }

    // Send approval email to seller (outside of transaction to avoid blocking)
    console.log(`[APPROVAL] Sending approval email`, { ...logContext });
    try {
      if (sellerApplication.user.email) {
        await sendSellerApplicationApprovedEmail(
          sellerApplication.user.email,
          sellerApplication.user.username || "Seller"
        );
        console.log(`[APPROVAL] Approval email sent successfully`, {
          ...logContext,
          recipientEmail: sellerApplication.user.email,
        });
      } else {
        console.warn(`[APPROVAL] No email address for seller, skipping email`, {
          ...logContext,
        });
      }
    } catch (emailError) {
      console.error(`[APPROVAL] Failed to send approval email (non-critical)`, {
        ...logContext,
        error:
          emailError instanceof Error ? emailError.message : String(emailError),
        stack: emailError instanceof Error ? emailError.stack : undefined,
        recipientEmail: sellerApplication.user.email,
        note: "Approval succeeded, but email failed - seller should still be notified via dashboard",
      });
      // Don't fail the approval process if email fails
    }

    // Note: Session refresh is now handled by the client-side page reload
    // The user's role and permissions have been updated in the database
    const totalDuration = Date.now() - startTime;
    console.log(`[APPROVAL] Approval completed successfully`, {
      ...logContext,
      totalDurationMs: totalDuration,
      status: "SUCCESS",
    });

    return { success: true };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      totalDurationMs: totalDuration,
      status: "FAILED",
    };

    console.error(`[APPROVAL] Approval failed`, errorDetails);

    // Provide more specific error messages
    if (error instanceof Error) {
      // If it's a known error (validation, permission, etc.), return the specific message
      if (
        error.message.includes("Invalid") ||
        error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("not found")
      ) {
        return { success: false, error: error.message };
      }
    }

    // Log to database - admin could email about "couldn't approve application"
    const userMessage = logError({
      code: "ADMIN_APPROVE_APPLICATION_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "approveApplication",
      error,
      metadata: {
        applicationId,
        note: "Failed to approve seller application",
      },
    });

    // For unknown errors, return a generic message but log the full error
    return {
      success: false,
      error: userMessage,
    };
  }
}

export async function rejectApplication(
  applicationId: string,
  rejectionReason?: string
) {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    // Validate that the applicationId is a valid ObjectID
    if (!ObjectId.isValid(applicationId)) {
      throw new Error("Invalid application ID format");
    }

    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has APPROVE_SELLERS permission (same permission for approve/reject)
    const hasApproveSellersPermission =
      currentUserData.permissions?.includes("APPROVE_SELLERS");

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
            username: true,
          },
        },
      },
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
        "ACCESS_MEMBER_DASHBOARD",
        "VIEW_USERS",
        "MANAGE_MESSAGES",
        "MANAGE_REVIEWS",
        "MANAGE_MEMBER_SETTINGS",
      ].map((permission) => ({
        permission,
        grantedAt: new Date(),
        grantedBy: currentUserData.id,
        reason: "Application rejected - restored member permissions",
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
          sellerApplication.user.username || "Seller",
          rejectionReason
        );
        console.log(
          `Rejection email sent to seller: ${sellerApplication.user.email}`
        );
      }
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
      // Don't fail the rejection process if email fails
    }

    // Note: Session refresh is now handled by the client-side page reload
    // The user's role and permissions have been updated in the database
    console.log(
      `Seller application rejected for user ${userId}. User role and permissions updated.`
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error rejecting application:", error);

    // Don't log validation/authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Invalid") ||
        error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions") ||
        error.message.includes("not found"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - admin could email about "couldn't reject application"
    const userMessage = logError({
      code: "ADMIN_REJECT_APPLICATION_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "rejectApplication",
      error,
      metadata: {
        applicationId,
        rejectionReason,
        note: "Failed to reject seller application",
      },
    });

    return { success: false, error: userMessage };
  }
}

// Request additional information from seller about their application
// NOTE: This function ONLY sends an email - it does NOT modify the application status
// The application remains in its current state (pending/approved/rejected)
export async function requestApplicationInformation(
  applicationId: string,
  requestMessage: string
) {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    // Validate that the applicationId is a valid ObjectID
    if (!ObjectId.isValid(applicationId)) {
      throw new Error("Invalid application ID format");
    }

    // Validate request message
    if (!requestMessage || requestMessage.trim().length === 0) {
      throw new Error("Request message cannot be empty");
    }

    if (requestMessage.length > 50000) {
      throw new Error(
        "Request message is too long. Please keep it under 50,000 characters."
      );
    }

    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has APPROVE_SELLERS permission (same permission for requesting info)
    const hasApproveSellersPermission =
      currentUserData.permissions?.includes("APPROVE_SELLERS");

    if (!hasApproveSellersPermission) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get the seller application to find the userId and user info
    const sellerApplication = await db.sellerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!sellerApplication) {
      throw new Error("Seller application not found.");
    }

    // Validate that the user has an email
    if (!sellerApplication.user.email) {
      throw new Error(
        "Seller email not found. Cannot send information request."
      );
    }

    // Send information request email to seller
    await sendSellerApplicationInformationRequestEmail(
      sellerApplication.user.email,
      sellerApplication.user.username || "Seller",
      requestMessage.trim()
    );

    console.log(
      `Information request email sent to seller: ${sellerApplication.user.email}`
    );

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error requesting application information:", error);

    // Don't log validation/authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Invalid") ||
        error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions") ||
        error.message.includes("not found") ||
        error.message.includes("cannot be empty") ||
        error.message.includes("too long"))
    ) {
      return { success: false, error: error.message };
    }

    // Log to database - admin could email about "couldn't send information request"
    const userMessage = logError({
      code: "ADMIN_REQUEST_APPLICATION_INFO_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "requestApplicationInformation",
      error,
      metadata: {
        applicationId,
        requestMessageLength: requestMessage?.length,
        note: "Failed to send information request email",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function getAllUsers() {
  // Declare variables outside try block so they're accessible in catch
  let user: any = null;

  try {
    user = await currentUserWithPermissions();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user has VIEW_USERS permission
    const hasViewUsersPermission = user.permissions?.includes("VIEW_USERS");

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
        isQaUser: true, // Include QA mode status
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching all users:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      return [];
    }

    // Log to database - admin could email about "can't load all users"
    logError({
      code: "ADMIN_GET_ALL_USERS_FAILED",
      userId: user?.id,
      route: "actions/adminActions",
      method: "getAllUsers",
      error,
      metadata: {
        note: "Failed to fetch all users",
      },
    });

    return [];
  }
}

export async function getUserPermissions(userId: string) {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    // Validate that the userId is a valid ObjectID
    if (!ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_PERMISSIONS permission
    const hasManagePermissions =
      currentUserData.permissions?.includes("MANAGE_PERMISSIONS");

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
            shopValues: true,
            valuesPreferNotToSay: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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

    console.log(
      `Permission ${permission} added to user ${userId} by ${grantedBy}`
    );

    return {
      success: true,
      message: `Permission "${permission}" has been granted to the user.`,
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error adding user permission:", error);

    // Log to database - admin could email about "couldn't add permission"
    const userMessage = logError({
      code: "ADMIN_ADD_USER_PERMISSION_FAILED",
      userId: grantedBy,
      route: "actions/adminActions",
      method: "addUserPermission",
      error,
      metadata: {
        targetUserId: userId,
        permission,
        reason,
        note: "Failed to add user permission",
      },
    });

    return {
      success: false,
      error: userMessage,
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

    console.log(
      `Permission ${permission} removed from user ${userId} by ${removedBy}`
    );

    return {
      success: true,
      message: `Permission "${permission}" has been removed from the user.`,
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error removing user permission:", error);

    // Log to database - admin could email about "couldn't remove permission"
    const userMessage = logError({
      code: "ADMIN_REMOVE_USER_PERMISSION_FAILED",
      userId: removedBy,
      route: "actions/adminActions",
      method: "removeUserPermission",
      error,
      metadata: {
        targetUserId: userId,
        permission,
        note: "Failed to remove user permission",
      },
    });

    return {
      success: false,
      error: userMessage,
    };
  }
}

// Dashboard Statistics Functions
export async function getDashboardStats() {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes(
      "ACCESS_ADMIN_DASHBOARD"
    );

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
      criticalReports,
      totalProductViews,
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
        where: { applicationApproved: false },
      }),

      // Active users
      db.user.count({
        where: { status: "ACTIVE" },
      }),

      // Suspended users
      db.user.count({
        where: { status: "SUSPENDED" },
      }),

      // Total revenue (sum of all completed orders)
      db.order.aggregate({
        where: {
          status: "COMPLETED",
          paymentStatus: "PAID",
        },
        _sum: { totalAmount: true },
      }),

      // Recent orders (last 7 days)
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      }),

      // Total reports
      db.report.count(),

      // Pending reports
      db.report.count({
        where: { status: "PENDING" },
      }),

      // Critical reports
      db.report.count({
        where: { severity: "CRITICAL" },
      }),

      // Total product views across all products
      ProductInteractionService.getTotalProductViews(),
    ]);

    // Get user growth (users created in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = await db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get product growth (products created in last 30 days)
    const newProductsThisMonth = await db.product.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get recent seller applications (last 7 days)
    const recentSellerApplications = await db.sellerApplication.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth,
      },
      sellers: {
        total: totalSellers,
        pendingApplications: pendingSellerApplications,
        recentApplications: recentSellerApplications,
      },
      products: {
        total: totalProducts,
        newThisMonth: newProductsThisMonth,
        totalViews: totalProductViews,
      },
      orders: {
        total: totalOrders,
        recent: recentOrders,
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        critical: criticalReports,
      },
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching dashboard stats:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      throw error; // Re-throw expected errors
    }

    // Log to database - admin could email about "can't load dashboard stats"
    logError({
      code: "ADMIN_GET_DASHBOARD_STATS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getDashboardStats",
      error,
      metadata: {
        note: "Failed to fetch admin dashboard statistics",
      },
    });

    throw error;
  }
}

export async function getRecentActivity() {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes(
      "ACCESS_ADMIN_DASHBOARD"
    );

    if (!hasAccessAdminDashboard) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Get recent activities
    const [recentUsers, recentOrders, recentProducts, recentApplications] =
      await Promise.all([
        // Recent users (last 5)
        db.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            image: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
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
                email: true,
              },
            },
            product: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
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
                shopName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
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
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return {
      recentUsers,
      recentOrders,
      recentProducts,
      recentApplications,
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching recent activity:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      throw error; // Re-throw expected errors
    }

    // Log to database - admin could email about "can't load recent activity"
    logError({
      code: "ADMIN_GET_RECENT_ACTIVITY_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getRecentActivity",
      error,
      metadata: {
        note: "Failed to fetch recent activity",
      },
    });

    throw error;
  }
}

// Admin management functions
export async function createAdmin(
  userId: string,
  role: string = "GENERAL_ADMIN"
) {
  try {
    const admin = await db.admin.create({
      data: {
        userId,
        role,
        notificationPreferences: [
          {
            type: "SELLER_APPLICATIONS",
            email: true,
            inApp: true,
          },
          {
            type: "DISPUTES",
            email: true,
            inApp: true,
          },
          {
            type: "SYSTEM_ALERTS",
            email: true,
            inApp: true,
          },
        ],
        tasks: [], // Initialize with empty tasks array
      },
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
      include: { user: true },
    });
    return { success: true, admin };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching admin:", error);

    // Log to database - admin could email about "can't load admin"
    const userMessage = logError({
      code: "ADMIN_GET_ADMIN_BY_USER_ID_FAILED",
      userId: undefined, // System function
      route: "actions/adminActions",
      method: "getAdminByUserId",
      error,
      metadata: {
        targetUserId: userId,
        note: "Failed to fetch admin by user ID",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function updateAdminRole(userId: string, newRole: string) {
  try {
    const admin = await db.admin.update({
      where: { userId },
      data: { role: newRole },
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
      data: { isActive: false },
    });
    return { success: true, admin };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deactivating admin:", error);

    // Log to database - admin could email about "couldn't deactivate admin"
    const userMessage = logError({
      code: "ADMIN_DEACTIVATE_ADMIN_FAILED",
      userId: undefined, // System function
      route: "actions/adminActions",
      method: "deactivateAdmin",
      error,
      metadata: {
        targetUserId: userId,
        note: "Failed to deactivate admin",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function updateAdminNotificationPreferences(
  userId: string,
  preferences: any[]
) {
  try {
    const admin = await db.admin.update({
      where: { userId },
      data: { notificationPreferences: preferences },
    });
    return { success: true, admin };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return {
      success: false,
      error: "Failed to update notification preferences",
    };
  }
}

export async function addAdminTask(userId: string, task: any) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId },
    });

    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const currentTasks = (admin.tasks as any[]) || [];
    const newTask = {
      id: generateTaskId(),
      ...task,
      createdAt: new Date().toISOString(),
      status: task.status || "PENDING",
    };

    const updatedTasks = [...currentTasks, newTask];

    const updatedAdmin = await db.admin.update({
      where: { userId },
      data: { tasks: updatedTasks },
    });

    return { success: true, admin: updatedAdmin };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error adding admin task:", error);

    // Log to database - admin could email about "couldn't add task"
    const userMessage = logError({
      code: "ADMIN_ADD_TASK_FAILED",
      userId: undefined, // System function
      route: "actions/adminActions",
      method: "addAdminTask",
      error,
      metadata: {
        targetUserId: userId,
        taskTitle: task?.title,
        note: "Failed to add admin task",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function updateAdminTask(
  userId: string,
  taskId: string,
  updates: any
) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId },
    });

    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const currentTasks = (admin.tasks as any[]) || [];
    const taskIndex = currentTasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return { success: false, error: "Task not found" };
    }

    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedAdmin = await db.admin.update({
      where: { userId },
      data: { tasks: updatedTasks },
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
      where: { userId },
    });

    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    const currentTasks = (admin.tasks as any[]) || [];
    const updatedTasks = currentTasks.filter((task) => task.id !== taskId);

    const updatedAdmin = await db.admin.update({
      where: { userId },
      data: { tasks: updatedTasks },
    });

    return { success: true, admin: updatedAdmin };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error removing admin task:", error);

    // Log to database - admin could email about "couldn't remove task"
    const userMessage = logError({
      code: "ADMIN_REMOVE_TASK_FAILED",
      userId: undefined, // System function
      route: "actions/adminActions",
      method: "removeAdminTask",
      error,
      metadata: {
        targetUserId: userId,
        taskId,
        note: "Failed to remove admin task",
      },
    });

    return { success: false, error: userMessage };
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
          status: "ACTIVE",
        },
        OR: [
          { role: ADMIN_ROLES.SUPER_ADMIN },
          { role: ADMIN_ROLES.SELLER_MANAGER },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            status: true,
          },
        },
      },
    });

    console.log(
      `Found ${adminTableAdmins.length} active admins in Admin table with SUPER_ADMIN or SELLER_MANAGER role`
    );

    // Debug: Let's also check what admins exist without the status filter
    const allAdminsInTable = await db.admin.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            status: true,
          },
        },
      },
    });

    console.log(`Total admins in Admin table: ${allAdminsInTable.length}`);
    allAdminsInTable.forEach((admin) => {
      console.log(
        `Admin record: userId=${admin.userId}, role=${admin.role}, isActive=${admin.isActive}, userStatus=${admin.user?.status}`
      );
    });

    // Test simpler queries to isolate the issue
    const superAdminAdmins = await db.admin.findMany({
      where: { role: "SUPER_ADMIN" },
    });
    console.log(`Admins with SUPER_ADMIN role: ${superAdminAdmins.length}`);

    const activeAdmins = await db.admin.findMany({
      where: { isActive: true },
    });
    console.log(`Active admins: ${activeAdmins.length}`);

    // Let's also check if we can find your specific admin record by userId
    const yourAdminRecord = await db.admin.findUnique({
      where: { userId: "681948f56125257664f88194" },
    });
    console.log(`Your specific admin record:`, yourAdminRecord);

    // And let's check if the user exists
    const yourUserRecord = await db.user.findUnique({
      where: { id: "681948f56125257664f88194" },
    });
    console.log(
      `Your user record:`,
      yourUserRecord
        ? {
          id: yourUserRecord.id,
          username: yourUserRecord.username,
          email: yourUserRecord.email,
          role: yourUserRecord.role,
          status: yourUserRecord.status,
        }
        : null
    );

    // Also get users with SUPER_ADMIN role from the User table (for backward compatibility)
    const superAdminUsers = await db.user.findMany({
      where: {
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    console.log(
      `Found ${superAdminUsers.length} users with SUPER_ADMIN role in User table`
    );

    // Combine both sources
    const allAdmins = [
      ...adminTableAdmins,
      ...superAdminUsers.map((user) => ({
        userId: user.id,
        role: "SUPER_ADMIN",
        isActive: true,
        user: {
          email: user.email,
          username: user.username,
        },
      })),
    ];

    console.log(`Total admins found: ${allAdmins.length}`);

    // Filter admins who have the specific notification preference enabled for email
    const filteredAdmins = allAdmins.filter((admin) => {
      console.log(`Checking admin ${admin.userId} (role: ${admin.role})`);

      // For users from User table (no Admin record), always include them
      if (
        !("notificationPreferences" in admin) ||
        !admin.notificationPreferences
      ) {
        console.log(
          `Admin ${admin.userId} has no notification preferences - including as fallback`
        );
        return true; // Include super admins even without specific preferences
      }

      const preferences = admin.notificationPreferences as any[];
      console.log(
        `Admin ${admin.userId} has ${preferences.length} notification preferences:`,
        preferences
      );

      // Look for the specific notification type with email enabled
      const sellerAppNotification = preferences.find((pref) => {
        console.log(`Checking preference:`, pref);
        return (
          pref.notificationType ===
          ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED
        );
      });

      console.log(
        `Seller app notification found for admin ${admin.userId}:`,
        sellerAppNotification
      );

      if (
        sellerAppNotification &&
        (sellerAppNotification.emailEnabled || sellerAppNotification.email)
      ) {
        console.log(
          `Admin ${admin.userId} has seller application email notifications enabled`
        );
        return true;
      } else {
        console.log(
          `Admin ${admin.userId} does not have seller application email notifications enabled`
        );
        console.log(
          `Email enabled check:`,
          sellerAppNotification?.emailEnabled,
          sellerAppNotification?.email
        );
        return false;
      }
    });

    console.log(
      `Found ${filteredAdmins.length} admins with seller application email notifications enabled`
    );

    // Fallback: If no admins have specific notification preferences,
    // send to all SUPER_ADMIN users as a critical notification
    if (filteredAdmins.length === 0) {
      console.log(
        "No admins with specific notification preferences found, falling back to all SUPER_ADMIN users"
      );
      const superAdmins = allAdmins.filter(
        (admin) => admin.role === ADMIN_ROLES.SUPER_ADMIN
      );
      console.log(
        `Found ${superAdmins.length} SUPER_ADMIN users for fallback notification`
      );
      return superAdmins;
    }

    return filteredAdmins;
  } catch (error) {
    console.error(
      "Error fetching admins for seller application notification:",
      error
    );
    return [];
  }
}

// Helper function to set up admin notification preferences for seller applications TODO: Possibly remove at some point
export async function setupAdminSellerApplicationNotifications(userId: string) {
  try {
    const admin = await db.admin.findUnique({
      where: { userId },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Get current preferences or initialize empty array
    const currentPreferences =
      (admin.notificationPreferences as string[]) || [];

    // Add seller application notification if not already present
    if (
      !currentPreferences.includes(
        ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED
      )
    ) {
      const updatedPreferences = [
        ...currentPreferences,
        ADMIN_NOTIFICATION_TYPES.SELLER_APPLICATION_SUBMITTED,
      ];

      await db.admin.update({
        where: { userId },
        data: {
          notificationPreferences: updatedPreferences,
        },
      });
    }

    return { success: "Seller application notifications enabled" };
  } catch (error) {
    // Log to console (always happens)
    console.error(
      "Error setting up admin seller application notifications:",
      error
    );

    // Log to database - admin could email about "couldn't setup notifications"
    const userMessage = logError({
      code: "ADMIN_SETUP_NOTIFICATIONS_FAILED",
      userId: undefined, // System function
      route: "actions/adminActions",
      method: "setupAdminSellerApplicationNotifications",
      error,
      metadata: {
        targetUserId: userId,
        note: "Failed to setup admin seller application notifications",
      },
    });

    return { error: userMessage };
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
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has MANAGE_CONTENT permission
    const hasManageContent =
      currentUserData.permissions?.includes("MANAGE_CONTENT");

    if (!hasManageContent) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { helpDescription: { contains: search, mode: "insensitive" } },
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
        orderBy: { createdAt: "desc" },
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
    // Log to console (always happens)
    console.error("Error fetching contact submissions:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      throw error; // Re-throw expected errors
    }

    // Log to database - admin could email about "can't load contact submissions"
    logError({
      code: "ADMIN_GET_CONTACT_SUBMISSIONS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getContactSubmissions",
      error,
      metadata: {
        search,
        reason,
        page,
        note: "Failed to fetch contact submissions",
      },
    });

    throw error;
  }
}

export async function getContactSubmissionById(id: string) {
  try {
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      // Log the error but don't throw - let the page handle redirect
      console.error(
        "[getContactSubmissionById] Not authenticated - session may have expired"
      );
      return null;
    }

    // Check if user has MANAGE_CONTENT permission
    const hasManageContent =
      currentUserData.permissions?.includes("MANAGE_CONTENT");

    if (!hasManageContent) {
      console.error(
        "[getContactSubmissionById] Insufficient permissions - user lacks MANAGE_CONTENT"
      );
      return null;
    }

    const submission = await db.contactUs.findUnique({
      where: { id },
    });

    return submission;
  } catch (error) {
    console.error(
      "[getContactSubmissionById] Error fetching contact submission:",
      {
        error: error instanceof Error ? error.message : String(error),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        submissionId: id,
        timestamp: new Date().toISOString(),
      }
    );
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
    const { ROLE_PERMISSIONS, createRolePermissions } = await import(
      "@/data/roles-and-permissions"
    );

    // Update user role
    await db.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        permissions: createRolePermissions(newRole as any, updatedBy),
      },
    });

    // If the new role is ADMIN or SUPER_ADMIN, create or update Admin document
    if (newRole === "ADMIN" || newRole === "SUPER_ADMIN") {
      try {
        // Check if admin record already exists
        const existingAdmin = await db.admin.findUnique({
          where: { userId },
        });

        if (existingAdmin) {
          // Update existing admin record
          await db.admin.update({
            where: { userId },
            data: {
              role: newRole,
              isActive: true,
            },
          });
          console.log(
            `Admin record updated for user ${userId} with role ${newRole}`
          );
        } else {
          // Create new admin record
          await createAdmin(userId, newRole);
          console.log(
            `Admin record created for user ${userId} with role ${newRole}`
          );
        }
      } catch (adminError) {
        console.error("Error creating/updating admin record:", adminError);
        // Don't fail the entire operation if admin record creation fails
      }
    } else {
      // If role is not ADMIN or SUPER_ADMIN, deactivate any existing admin record
      try {
        const existingAdmin = await db.admin.findUnique({
          where: { userId },
        });

        if (existingAdmin) {
          await db.admin.update({
            where: { userId },
            data: { isActive: false },
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
    // Log to console (always happens)
    console.error("Error updating user role:", error);

    // Log to database - admin could email about "couldn't update user role"
    const userMessage = logError({
      code: "ADMIN_UPDATE_USER_ROLE_FAILED",
      userId: updatedBy,
      route: "actions/adminActions",
      method: "updateUserRole",
      error,
      metadata: {
        targetUserId: userId,
        newRole,
        reason,
        note: "Failed to update user role",
      },
    });

    return {
      success: false,
      error: userMessage,
    };
  }
}

// Error Logs Functions
interface GetErrorLogsParams {
  page?: number;
  limit?: number;
  level?: string;
  code?: string;
  userId?: string;
  route?: string;
}

export async function getErrorLogs({
  page = 1,
  limit = 50,
  level,
  code,
  userId,
  route,
}: GetErrorLogsParams = {}) {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;
  let where: any = {};

  try {
    // Validate input parameters
    const validatedPage = Math.max(1, Math.floor(page || 1));
    const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit || 50))); // Max 100 per page

    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes(
      "ACCESS_ADMIN_DASHBOARD"
    );

    if (!hasAccessAdminDashboard) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    // Build where clause dynamically with error handling
    try {
      if (level) {
        // Validate level is one of the allowed values
        const validLevels = ["info", "warn", "error", "fatal"];
        if (validLevels.includes(level.toLowerCase())) {
          where.level = level.toLowerCase();
        } else {
          console.warn(`Invalid error level provided: ${level}`);
        }
      }

      if (code) {
        // Sanitize code input to prevent injection
        const sanitizedCode = code.trim().substring(0, 100); // Limit length
        where.code = { contains: sanitizedCode, mode: "insensitive" };
      }

      if (userId) {
        // Validate userId format (should be ObjectId for MongoDB)
        const sanitizedUserId = userId.trim();
        where.userId = sanitizedUserId;
      }

      if (route) {
        // Sanitize route input
        const sanitizedRoute = route.trim().substring(0, 500); // Limit length
        where.route = { contains: sanitizedRoute, mode: "insensitive" };
      }
    } catch (filterError) {
      // Log filter building error but continue with empty where clause
      console.error("Error building where clause for error logs:", filterError);
      logError({
        code: "ADMIN_ERROR_LOGS_FILTER_BUILD_FAILED",
        userId: currentUserData?.id,
        route: "actions/adminActions",
        method: "getErrorLogs",
        error: filterError,
        metadata: {
          page: validatedPage,
          limit: validatedLimit,
          level,
          code,
          userId,
          route,
          note: "Failed to build filter clause, using empty filter",
        },
      });
      // Continue with empty where clause
      where = {};
    }

    // Get total count and error logs with individual error handling
    let total = 0;
    let errorLogs: any[] = [];

    try {
      [total, errorLogs] = await Promise.all([
        db.errorLog.count({ where }),
        db.errorLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (validatedPage - 1) * validatedLimit,
          take: validatedLimit,
        }),
      ]);
    } catch (dbError) {
      // Log database query error specifically
      console.error("Database query error when fetching error logs:", dbError);
      logError({
        code: "ADMIN_ERROR_LOGS_DB_QUERY_FAILED",
        userId: currentUserData?.id,
        route: "actions/adminActions",
        method: "getErrorLogs",
        error: dbError,
        metadata: {
          page: validatedPage,
          limit: validatedLimit,
          whereClause: JSON.stringify(where),
          note: "Database query failed when fetching error logs",
        },
      });
      throw dbError; // Re-throw to be caught by outer catch
    }

    return {
      errorLogs,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit),
      },
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching error logs:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      throw error; // Re-throw expected errors
    }

    // Log to database - admin could email about "can't load error logs"
    logError({
      code: "ADMIN_GET_ERROR_LOGS_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getErrorLogs",
      error,
      metadata: {
        page: page || 1,
        limit: limit || 50,
        level,
        code,
        userId,
        route,
        whereClause: JSON.stringify(where),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        note: "Failed to fetch error logs",
      },
    });

    throw error;
  }
}

// Get all products with full information for social media post creation
// This function returns all product data including images and URLs without requiring clicks
export async function getProductsForSocialMedia({
  search = "",
  status = "ACTIVE",
  page = 1,
  limit = 20,
}: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      throw new Error("Not authenticated");
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes(
      "ACCESS_ADMIN_DASHBOARD"
    );

    if (!hasAccessAdminDashboard) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Get products with all necessary fields for social media
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          shortDescription: true,
          shortDescriptionBullets: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          status: true,
          tags: true,
          materialTags: true,
          primaryCategory: true,
          secondaryCategory: true,
          tertiaryCategory: true,
          onSale: true,
          discount: true,
          stock: true,
          isDigital: true,
          sku: true,
          createdAt: true,
          seller: {
            select: {
              shopName: true,
              shopNameSlug: true,
              shopTagLine: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.product.count({ where: whereClause }),
    ]);

    // Generate product URLs and format data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://olovara.com";
    const formattedProducts = products.map((product) => {
      // Generate product URL
      const productUrl = `${baseUrl}/product/${product.id}`;

      // Format price
      const formattedPrice = (product.price / 100).toFixed(2);
      const salePrice =
        product.onSale && product.discount
          ? ((product.price * (100 - product.discount)) / 100 / 100).toFixed(2)
          : null;

      // Extract text from description JSON
      let descriptionText = "";
      if (product.description) {
        if (typeof product.description === "string") {
          descriptionText = product.description;
        } else {
          // Try to extract text from JSON structure
          const desc = product.description as any;
          if (desc.text) {
            descriptionText = desc.text;
          } else if (desc.html) {
            // Strip HTML tags
            descriptionText = desc.html.replace(/<[^>]*>/g, "");
          } else {
            descriptionText = JSON.stringify(desc);
          }
        }
      }

      return {
        ...product,
        productUrl,
        formattedPrice,
        salePrice,
        descriptionText,
        // All image URLs are already in the images array
        imageUrls: product.images || [],
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching products for social media:", error);

    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      throw error;
    }

    logError({
      code: "ADMIN_GET_PRODUCTS_FOR_SOCIAL_MEDIA_FAILED",
      userId: currentUserData?.id,
      route: "actions/adminActions",
      method: "getProductsForSocialMedia",
      error,
      metadata: {
        search,
        status,
        page,
        limit,
        note: "Failed to fetch products for social media posts",
      },
    });

    throw error;
  }
}