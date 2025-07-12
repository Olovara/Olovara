import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Role } from "@/data/roles-and-permissions";

export async function getAuthUserId() {
    try {
        const session = await auth();
        console.log("Auth session:", {
            exists: !!session,
            userId: session?.user?.id,
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
            hasSellerProfile: !!dbUser?.seller,
            sellerApplicationAccepted: dbUser?.seller?.applicationAccepted
        });

        // Log the role from database
        console.log("User role from database:", {
            dbRole: dbUser?.role,
            userId: userId
        });

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
            email: session?.user?.email
        });

        if (!session?.user) {
            console.error("Authentication failed: No session found");
            throw new Error("Unauthorized: No session found");
        }

        // Fetch role from database since it's no longer stored in session
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
        
        if (!dbUser?.role) {
            console.error("Authentication failed: Role missing in database");
            throw new Error("Unauthorized: Role missing");
        }
        
        console.log("Database role check:", {
            dbRole: dbUser.role,
            hasSellerProfile: !!dbUser?.seller,
            sellerApplicationAccepted: dbUser?.seller?.applicationAccepted
        });

        return dbUser.role as Role;
    } catch (error) {
        console.error("getUserRole error:", error);
        throw error;
    }
}