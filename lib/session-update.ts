import { db } from "@/lib/db";

export async function updateUserSession(userId: string) {
  try {
    // For JWT strategy, we update the user's data to trigger a JWT refresh
    // This will cause the JWT callback to run again on next request and fetch fresh permissions
    await db.user.update({
      where: { id: userId },
      data: {
        // Update a timestamp to trigger JWT refresh
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user session:", error);
    return { success: false, error: "Failed to update session" };
  }
}

// Function to force session refresh for a user
export async function forceSessionRefresh(userId: string) {
  try {
    // For JWT strategy, we can update the user's data to trigger a refresh
    // This will cause the JWT callback to run again on next request
    await db.user.update({
      where: { id: userId },
      data: {
        // Update a timestamp to trigger JWT refresh
        updatedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error forcing session refresh:", error);
    return { success: false, error: "Failed to refresh session" };
  }
} 