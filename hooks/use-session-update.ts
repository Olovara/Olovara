"use client";

import { useSession } from "next-auth/react";
import { useCallback } from "react";

export const useSessionUpdate = () => {
  const { update } = useSession();

  const triggerSessionUpdate = useCallback(async (reason?: string) => {
    try {
      // Call the API to trigger server-side session update
      const response = await fetch('/api/auth/trigger-session-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger session update');
      }

      // Force client-side session refresh
      await update();

      return { success: true };
    } catch (error) {
      console.error('Error triggering session update:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update session' 
      };
    }
  }, [update]);

  const forceSessionRefresh = useCallback(async () => {
    try {
      await update();
      return { success: true };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh session' 
      };
    }
  }, [update]);

  return {
    triggerSessionUpdate,
    forceSessionRefresh,
  };
}; 