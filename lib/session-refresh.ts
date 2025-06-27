import { signIn } from "next-auth/react";

/**
 * Triggers a session refresh for a specific user
 * This function should be called after updating user permissions or roles
 */
export async function refreshUserSession(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, update the session on the server
    const response = await fetch(`/api/users/${userId}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update session');
    }

    // If the user is updating their own session, trigger a client-side refresh
    const currentUserResponse = await fetch('/api/auth/get-role');
    if (currentUserResponse.ok) {
      const currentUser = await currentUserResponse.json();
      
      if (currentUser.id === userId) {
        // This is the current user, trigger client-side refresh
        await signIn("credentials", { redirect: false });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error refreshing user session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh session' 
    };
  }
}

/**
 * Force refresh the current user's session
 * This is useful when the current user's permissions have been updated
 */
export async function refreshCurrentUserSession(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user ID
    const response = await fetch('/api/auth/get-role');
    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const currentUser = await response.json();
    
    // Refresh the session
    return await refreshUserSession(currentUser.id);
  } catch (error) {
    console.error('Error refreshing current user session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to refresh session' 
    };
  }
} 