import { db } from "@/lib/db";

/**
 * QA Event Status Types
 * - started: User entered/initiated a step
 * - completed: User successfully completed a step
 * - failed: User encountered an error at this step
 */
export type QaEventStatus = "started" | "completed" | "failed";

/**
 * Options for logging QA events
 */
export interface LogQaEventOptions {
  userId: string;
  sessionId: string;
  event: string; // Event category like "PRODUCT_CREATE", "CHECKOUT"
  step?: string; // Specific step within the event (e.g., "IMAGES", "PRICING")
  status: QaEventStatus;
  route?: string; // Current route/page
  metadata?: Record<string, any>; // Additional context
}

/**
 * Logs a QA event for users with QA mode enabled
 *
 * CRITICAL RULES:
 * 1. This function is fire-and-forget - NEVER blocks requests
 * 2. Only logs if user has isQaUser = true
 * 3. Never throws - failures are silently ignored
 * 4. Async but not awaited - runs in background
 *
 * This is separate from error logs:
 * - Error logs = something broke (only failures)
 * - QA logs = what the user did (success + failure)
 *
 * @example
 * ```ts
 * logQaEvent({
 *   userId: user.id,
 *   sessionId: getSessionId(),
 *   event: "PRODUCT_CREATE",
 *   step: PRODUCT_STEPS.IMAGES,
 *   status: "completed",
 *   route: "/sell/new",
 *   metadata: { imageCount: 5, totalSize: 1024000 }
 * });
 * ```
 */
export function logQaEvent(options: LogQaEventOptions): void {
  const { userId, sessionId, event, step, status, route, metadata } = options;

  // Fire-and-forget: Never await, never throw
  // Use void to explicitly ignore the promise
  void Promise.resolve()
    .then(async () => {
      // First, check if user is a QA user
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { isQaUser: true },
      });

      // Only log if user has QA mode enabled
      if (!user?.isQaUser) {
        return;
      }

      // Add timeout to prevent slow DB writes from piling up
      return Promise.race([
        db.qaEvent.create({
          data: {
            userId,
            sessionId,
            event,
            step: step || null,
            status,
            route: route || null,
            metadata: metadata || null,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("QA log timeout")), 2000)
        ),
      ]);
    })
    .catch((error) => {
      // Silently fail - QA logging must never break the app
      console.error("[QA_LOG_FAILED]", {
        event,
        step,
        error: error instanceof Error ? error.message : String(error),
        note: "QA logging failed, but request continues normally",
      });
    });
}

/**
 * Helper to log step transitions
 *
 * @example
 * ```ts
 * logQaStep({
 *   userId: user.id,
 *   sessionId: getSessionId(),
 *   event: "PRODUCT_CREATE",
 *   step: PRODUCT_STEPS.DETAILS,
 *   status: "started",
 *   route: "/sell/new"
 * });
 * ```
 */
export function logQaStep(options: {
  userId: string;
  sessionId: string;
  event: string;
  step: string;
  status: QaEventStatus;
  route?: string;
  metadata?: Record<string, any>;
}): void {
  logQaEvent({
    userId: options.userId,
    sessionId: options.sessionId,
    event: options.event,
    step: options.step,
    status: options.status,
    route: options.route,
    metadata: options.metadata,
  });
}
