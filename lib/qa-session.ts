/**
 * Session ID management for QA tracking
 *
 * This generates and stores a unique session ID in localStorage
 * that persists across page reloads for the same browser session.
 *
 * The session ID is used to replay user flows in order.
 */

const QA_SESSION_KEY = "qaSessionId";

/**
 * Gets or creates a QA session ID
 *
 * If no session ID exists, creates a new one and stores it.
 * If one exists, returns it.
 *
 * This should be called:
 * - On page load (client-side)
 * - Before making API requests
 * - When logging QA events
 *
 * @returns Session ID string (UUID format)
 */
export function getQaSessionId(): string {
  // Only run on client-side
  if (typeof window === "undefined") {
    return "";
  }

  try {
    // Check if session ID already exists
    let sessionId = localStorage.getItem(QA_SESSION_KEY);

    if (!sessionId) {
      // Generate new session ID (UUID v4)
      sessionId = crypto.randomUUID();
      localStorage.setItem(QA_SESSION_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    // If localStorage fails, generate a temporary ID (won't persist)
    console.warn(
      "[QA_SESSION] Failed to access localStorage, using temporary ID"
    );
    return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

/**
 * Resets the QA session ID
 *
 * Use this when you want to start a new session
 * (e.g., after logout/login)
 */
export function resetQaSessionId(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(QA_SESSION_KEY);
  } catch (error) {
    console.warn("[QA_SESSION] Failed to reset session ID");
  }
}
