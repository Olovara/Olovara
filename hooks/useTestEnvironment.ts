import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useTestEnvironment() {
  const { data: session } = useSession();
  const [canAccessTest, setCanAccessTest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTestAccess() {
      if (!session?.user?.id) {
        setCanAccessTest(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${session.user.id}/test-access`);
        if (response.ok) {
          const { canAccessTestEnvironment } = await response.json();
          setCanAccessTest(canAccessTestEnvironment);
        } else {
          setCanAccessTest(false);
        }
      } catch (error) {
        console.error("Error checking test environment access:", error);
        setCanAccessTest(false);
      } finally {
        setLoading(false);
      }
    }

    checkTestAccess();
  }, [session?.user?.id]);

  return {
    canAccessTest,
    loading,
    isTestUser: canAccessTest,
  };
} 