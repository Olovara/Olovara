import { db } from "@/lib/db"; // Use the global Prisma instance
import { User, UserRole, AccountStatus } from "@prisma/client";
import { getAuthUserId, getUserRole } from "./authActions";

interface GetUsersParams {
  role?: UserRole;
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

export async function getUnapprovedSellers() {
  try {
    const role = await getUserRole();

    if (role !== UserRole.ADMIN) throw new Error("Forbidden");

    return await db.sellerApplication.findMany({
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
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching seller applications:", error);
    return [];
  }
}

export async function approveApplication(applicationId: string) {
  try {
    // Verify that the current user is an admin
    const role = await getUserRole();
    if (role !== UserRole.ADMIN) {
      throw new Error("Forbidden");
    }

    // Retrieve the seller application to get the userId
    const sellerApplication = await db.sellerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!sellerApplication) {
      throw new Error("Seller application not found.");
    }

    const { userId } = sellerApplication;

    // Approve the seller application
    await db.sellerApplication.update({
      where: { id: applicationId },
      data: { applicationApproved: true },
    });

    // Update the user's role to 'SELLER'
    await db.user.update({
      where: { id: userId },
      data: { role: "SELLER" }, // Use the enum for role assignment
    });

    return { success: true };
  } catch (error) {
    console.error("Error approving application:", error);
    return { success: false, error: "Failed to approve application." };
  }
}

export async function rejectApplication(applicationId: string) {
  try {

    const role = await getUserRole();

    if (role !== 'ADMIN') throw new Error('Forbidden');

    await db.sellerApplication.delete({
      where: { id: applicationId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error rejecting application:", error);
    return { success: false, error: "Failed to reject application." };
  }
}