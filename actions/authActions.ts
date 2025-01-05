import { auth } from "@/auth";

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

export async function getUserRole() {
    const session = await auth();

    const role = session?.user.role;

    if (!role) throw new Error('Not in role');

    return role;
}