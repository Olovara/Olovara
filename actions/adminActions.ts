import { db } from "@/lib/db"; // Use the global Prisma instance
import { User } from "@prisma/client";
import { getAuthUserId, getUserRole } from "./authActions";

interface GetUsersParams {
    role?: string;
    status?: string;
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
    pageNumber = '1',
    pageSize = '12'
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
            orderBy: { createdAt: 'desc' },
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

        if (role !== 'ADMIN') throw new Error('Forbidden');

        return db.sellerApplication.findMany({
            where: {
                applicationApproved: false
            }
        })

    } catch (error) {
        console.log(error);
        throw error;
    }
}