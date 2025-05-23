import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function getAuthUserId() {
    const session = await auth();

    if (!session) {
        console.error("Authentication failed: No session found");
        throw new Error("Unauthorized: No session found");
    }

    const userId = session.user?.id;

    if (!userId) {
        console.error("Authentication failed: User ID missing in session");
        throw new Error("Unauthorized: User ID missing");
    }

    return userId;
}

export async function getUserRole(): Promise<UserRole> {
    const session = await auth();

    if (!session?.user) {
        console.error("Authentication failed: No session found");
        throw new Error("Unauthorized: No session found");
    }

    const role = session.user.role;

    if (!role) {
        console.error("Authentication failed: Role missing in session");
        throw new Error("Unauthorized: Role missing");
    }

    return role;
}