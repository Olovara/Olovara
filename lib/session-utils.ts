import { updateUserSession } from "./session-update";

/**
 * Triggers a complete session update including WebSocket notification
 * This should be used in server actions when user permissions or onboarding status changes
 */
export async function triggerCompleteSessionUpdate(
  userId: string, 
  updatedBy: string, 
  reason: string
) {
  try {
    // Update the user's session to trigger a refresh
    await updateUserSession(userId);

    // Trigger WebSocket notification for real-time updates
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/socket/session-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          updatedBy: updatedBy,
          reason: reason
        }),
      });
    } catch (websocketError) {
      console.error("WebSocket notification failed:", websocketError);
      // Don't fail the action if WebSocket fails
    }

    return { success: true };
  } catch (error) {
    console.error("Error triggering complete session update:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update session' 
    };
  }
}

/**
 * Triggers session update for the current user
 * This should be used when the current user completes an onboarding task
 */
export async function triggerCurrentUserSessionUpdate(reason: string) {
  try {
    // Get current user ID from environment or context
    // This is a simplified version - in practice you'd get this from the auth context
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/get-role`);
    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const currentUser = await response.json();
    
    return await triggerCompleteSessionUpdate(
      currentUser.id, 
      currentUser.id, 
      reason
    );
  } catch (error) {
    console.error("Error triggering current user session update:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update session' 
    };
  }
} 