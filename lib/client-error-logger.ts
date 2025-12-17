/**
 * Client-side error logger that sends errors to the server for persistence
 * Use this in client components ("use client") instead of logError()
 */
export async function logClientError(options: {
  code: string;
  message?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const { code, message, metadata } = options;

  // Always log to console first
  console.error(`[${code}] ${message || "Client error"}`, metadata);

  // Fire-and-forget API call - don't await or block UI
  fetch("/api/log-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, message, metadata }),
  }).catch((err) => {
    // Silently fail - don't break the app if logging fails
    console.error("[CLIENT_ERROR_LOGGER] Failed to send error to server:", err);
  });
}
