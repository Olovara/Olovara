import { PrismaClient } from "@prisma/client";
import { getAuthUserId } from "./authActions";

const prisma = new PrismaClient();

export async function getUserInfoForNav() {
    try {
        const userId = await getAuthUserId();

        if (!userId) {
            throw new Error("User is not authenticated");
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                username: true,
                image: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    } catch (error) {
        console.error("Error fetching user info for nav:", error);
        throw error;
    }
}