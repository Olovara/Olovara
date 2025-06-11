import { useSession } from "next-auth/react";
import { useCallback } from "react";

export const useSyncRole = () => {
    const { data: session, update } = useSession();

    const syncRole = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/sync-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to sync role');
            }

            const data = await response.json();
            
            // Update the session with the new role
            if (data.success && session?.user) {
                await update({
                    ...session,
                    user: {
                        ...session.user,
                        role: data.role
                    }
                });
            }

            return data;
        } catch (error) {
            console.error('Error syncing role:', error);
            throw error;
        }
    }, [session, update]);

    return { syncRole };
}; 