"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { logError } from "@/lib/error-logger";

/**
 * Toggle QA mode for a user
 * Only admins can enable/disable QA mode
 */
export async function toggleQaUserMode(userId: string): Promise<{
  success: boolean;
  error?: string;
  isQaUser?: boolean;
}> {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    // Check if user is admin
    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await db.admin.findUnique({
      where: { userId: currentUserId },
    });

    if (!admin) {
      return { success: false, error: "Only admins can manage QA mode" };
    }

    // Get current user state
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isQaUser: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Toggle QA mode
    const updated = await db.user.update({
      where: { id: userId },
      data: { isQaUser: !user.isQaUser },
      select: { isQaUser: true },
    });

    revalidatePath("/admin/dashboard/qa");

    return {
      success: true,
      isQaUser: updated.isQaUser,
    };
  } catch (error) {
    logError({
      code: "QA_TOGGLE_MODE_FAILED",
      userId: currentUserId,
      route: "actions/qa-management",
      method: "toggleQaUserMode",
      error,
      metadata: {
        targetUserId: userId,
        note: "Failed to toggle QA mode for user",
      },
    });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle QA mode",
    };
  }
}

/**
 * Get all QA users
 */
export async function getQaUsers(): Promise<
  | {
      success: true;
      users: Array<{
        id: string;
        email: string | null;
        username: string | null;
        createdAt: Date;
        _count: { qaEvents: number };
      }>;
    }
  | { success: false; error: string }
> {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await db.admin.findUnique({
      where: { userId: currentUserId },
    });

    if (!admin) {
      return { success: false, error: "Only admins can view QA users" };
    }

    const qaUsers = await db.user.findMany({
      where: { isQaUser: true },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            qaEvents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      users: qaUsers,
    };
  } catch (error) {
    logError({
      code: "QA_GET_USERS_FAILED",
      userId: currentUserId,
      route: "actions/qa-management",
      method: "getQaUsers",
      error,
      metadata: {
        note: "Failed to fetch QA users list",
      },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get QA users",
    };
  }
}

/**
 * Get QA events for a specific user
 */
export async function getUserQaEvents(
  userId: string,
  limit: number = 100
): Promise<{
  success: boolean;
  error?: string;
  events?: any[];
}> {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await db.admin.findUnique({
      where: { userId: currentUserId },
    });

    if (!admin) {
      return { success: false, error: "Only admins can view QA events" };
    }

    const events = await db.qaEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      success: true,
      events,
    };
  } catch (error) {
    logError({
      code: "QA_GET_USER_EVENTS_FAILED",
      userId: currentUserId,
      route: "actions/qa-management",
      method: "getUserQaEvents",
      error,
      metadata: {
        targetUserId: userId,
        limit,
        note: "Failed to fetch QA events for user",
      },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get QA events",
    };
  }
}

/**
 * Get QA events grouped by session
 */
export async function getQaEventsBySession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
  events?: any[];
}> {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await db.admin.findUnique({
      where: { userId: currentUserId },
    });

    if (!admin) {
      return { success: false, error: "Only admins can view QA events" };
    }

    const events = await db.qaEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" }, // Chronological order for replay
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      events,
    };
  } catch (error) {
    logError({
      code: "QA_GET_SESSION_EVENTS_FAILED",
      userId: currentUserId,
      route: "actions/qa-management",
      method: "getQaEventsBySession",
      error,
      metadata: {
        sessionId,
        note: "Failed to fetch QA events for session",
      },
    });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get session events",
    };
  }
}

/**
 * Get recent QA events across all users
 */
export async function getRecentQaEvents(limit: number = 50) {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await db.admin.findUnique({
      where: { userId: currentUserId },
    });

    if (!admin) {
      return { success: false, error: "Only admins can view QA events" };
    }

    const events = await db.qaEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      events,
    };
  } catch (error) {
    logError({
      code: "QA_GET_RECENT_EVENTS_FAILED",
      userId: currentUserId,
      route: "actions/qa-management",
      method: "getRecentQaEvents",
      error,
      metadata: {
        limit,
        note: "Failed to fetch recent QA events",
      },
    });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get recent events",
    };
  }
}

/**
 * Get QA statistics
 */
export async function getQaStats() {
  let currentUserId: string | undefined;
  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await db.admin.findUnique({
      where: { userId: currentUserId },
    });

    if (!admin) {
      return { success: false, error: "Only admins can view QA stats" };
    }

    const [totalUsers, totalEvents, failedEvents, uniqueSessions] =
      await Promise.all([
        db.user.count({ where: { isQaUser: true } }),
        db.qaEvent.count(),
        db.qaEvent.count({ where: { status: "failed" } }),
        db.qaEvent
          .groupBy({
            by: ["sessionId"],
            _count: true,
          })
          .then((result) => result.length),
      ]);

    // Get events by status
    const eventsByStatus = await db.qaEvent.groupBy({
      by: ["status"],
      _count: true,
    });

    // Get events by event type
    const eventsByType = await db.qaEvent.groupBy({
      by: ["event"],
      _count: true,
      orderBy: {
        _count: {
          event: "desc",
        },
      },
      take: 10,
    });

    return {
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        failedEvents,
        uniqueSessions,
        eventsByStatus: eventsByStatus.map((e) => ({
          status: e.status,
          count: e._count,
        })),
        eventsByType: eventsByType.map((e) => ({
          event: e.event,
          count: e._count,
        })),
      },
    };
  } catch (error) {
    logError({
      code: "QA_GET_STATS_FAILED",
      userId: currentUserId,
      route: "actions/qa-management",
      method: "getQaStats",
      error,
      metadata: {
        note: "Failed to fetch QA statistics",
      },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get QA stats",
    };
  }
}
