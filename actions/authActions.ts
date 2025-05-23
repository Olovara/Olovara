import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function getAuthUserId() {
    try {
        const session = await auth();
        console.log("Auth session:", {
            exists: !!session,
            userId: session?.user?.id,
            role: session?.user?.role,
            email: session?.user?.email
        });

        if (!session) {
            console.error("Authentication failed: No session found");
            throw new Error("Unauthorized: No session found");
        }

        const userId = session.user?.id;

        if (!userId) {
            console.error("Authentication failed: User ID missing in session");
            throw new Error("Unauthorized: User ID missing");
        }

        // Verify user exists in database
        const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        console.log("Database user check:", {
            exists: !!dbUser,
            role: dbUser?.role,
            sessionRole: session.user?.role
        });

        return userId;
    } catch (error) {
        console.error("getAuthUserId error:", error);
        throw error;
    }
}

export async function getUserRole(): Promise<UserRole> {
    try {
        const session = await auth();
        console.log("getUserRole session:", {
            exists: !!session,
            userId: session?.user?.id,
            role: session?.user?.role,
            email: session?.user?.email
        });

        if (!session?.user) {
            console.error("Authentication failed: No session found");
            throw new Error("Unauthorized: No session found");
        }

        const role = session.user.role;

        if (!role) {
            console.error("Authentication failed: Role missing in session");
            throw new Error("Unauthorized: Role missing");
        }

        // Verify role in database
        const dbUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });
        console.log("Database role check:", {
            sessionRole: role,
            dbRole: dbUser?.role,
            match: role === dbUser?.role
        });

        if (dbUser?.role !== role) {
            console.error("Role mismatch between session and database:", {
                sessionRole: role,
                dbRole: dbUser?.role
            });
        }

        return role;
    } catch (error) {
        console.error("getUserRole error:", error);
        throw error;
    }
}