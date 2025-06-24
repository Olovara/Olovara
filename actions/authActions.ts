import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Role } from "@/data/roles-and-permissions";

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

        // Verify user exists in database and get full user data
        const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { 
                role: true,
                seller: {
                    select: {
                        id: true,
                        applicationAccepted: true
                    }
                }
            }
        });
        
        console.log("Database user check:", {
            exists: !!dbUser,
            role: dbUser?.role,
            sessionRole: session.user?.role,
            hasSellerProfile: !!dbUser?.seller,
            sellerApplicationAccepted: dbUser?.seller?.applicationAccepted
        });

        // If there's a role mismatch, log it
        if (dbUser?.role !== session.user?.role) {
            console.error("Role mismatch detected:", {
                sessionRole: session.user?.role,
                dbRole: dbUser?.role,
                userId: userId
            });
        }

        return userId;
    } catch (error) {
        console.error("getAuthUserId error:", error);
        throw error;
    }
}

export async function getUserRole(): Promise<Role> {
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

        // Verify role in database with seller profile check
        const dbUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { 
                role: true,
                seller: {
                    select: {
                        id: true,
                        applicationAccepted: true
                    }
                }
            }
        });
        
        console.log("Database role check:", {
            sessionRole: role,
            dbRole: dbUser?.role,
            match: role === dbUser?.role,
            hasSellerProfile: !!dbUser?.seller,
            sellerApplicationAccepted: dbUser?.seller?.applicationAccepted
        });

        if (dbUser?.role !== role) {
            console.error("Role mismatch between session and database:", {
                sessionRole: role,
                dbRole: dbUser?.role,
                userId: session.user.id
            });
        }

        return role;
    } catch (error) {
        console.error("getUserRole error:", error);
        throw error;
    }
}