import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import { currentUserWithPermissions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET endpoint for admins to retrieve error logs (with pagination and filtering)
export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let where: any = {};

  try {
    session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions using the same method as the action
    const currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has ACCESS_ADMIN_DASHBOARD permission
    const hasAccessAdminDashboard = currentUserData.permissions?.includes(
      "ACCESS_ADMIN_DASHBOARD"
    );

    if (!hasAccessAdminDashboard) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const level = searchParams.get("level");
    const code = searchParams.get("code");
    const userId = searchParams.get("userId");
    const route = searchParams.get("route");

    // Validate input parameters
    const validatedPage = Math.max(1, Math.floor(page || 1));
    const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit || 50))); // Max 100 per page

    // Build where clause dynamically with error handling
    try {
      if (level) {
        // Validate level is one of the allowed values
        const validLevels = ["info", "warn", "error", "fatal"];
        if (validLevels.includes(level.toLowerCase())) {
          where.level = level.toLowerCase();
        } else {
          console.warn(`Invalid error level provided: ${level}`);
        }
      }

      if (code) {
        // Sanitize code input to prevent injection
        const sanitizedCode = code.trim().substring(0, 100); // Limit length
        where.code = { contains: sanitizedCode, mode: "insensitive" };
      }

      if (userId) {
        // Validate userId format (should be ObjectId for MongoDB)
        const sanitizedUserId = userId.trim();
        where.userId = sanitizedUserId;
      }

      if (route) {
        // Sanitize route input
        const sanitizedRoute = route.trim().substring(0, 500); // Limit length
        where.route = { contains: sanitizedRoute, mode: "insensitive" };
      }
    } catch (filterError) {
      // Log filter building error but continue with empty where clause
      console.error("Error building where clause for error logs:", filterError);
      logError({
        code: "ADMIN_ERROR_LOGS_FILTER_BUILD_FAILED",
        userId: currentUserData?.id,
        route: "/api/error-logs",
        method: "GET",
        error: filterError,
        metadata: {
          page: validatedPage,
          limit: validatedLimit,
          level,
          code,
          userId,
          route,
          note: "Failed to build filter clause, using empty filter",
        },
      });
      // Continue with empty where clause
      where = {};
    }

    // Get total count and error logs with individual error handling
    let total = 0;
    let errorLogs: any[] = [];

    try {
      [total, errorLogs] = await Promise.all([
        db.errorLog.count({ where }),
        db.errorLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (validatedPage - 1) * validatedLimit,
          take: validatedLimit,
        }),
      ]);
    } catch (dbError) {
      // Log database query error specifically
      console.error("Database query error when fetching error logs:", dbError);
      logError({
        code: "ADMIN_ERROR_LOGS_DB_QUERY_FAILED",
        userId: currentUserData?.id,
        route: "/api/error-logs",
        method: "GET",
        error: dbError,
        metadata: {
          page: validatedPage,
          limit: validatedLimit,
          whereClause: JSON.stringify(where),
          note: "Database query failed when fetching error logs",
        },
      });
      throw dbError; // Re-throw to be caught by outer catch
    }

    return NextResponse.json({
      errorLogs,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit),
      },
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching error logs:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions") ||
        error.message.includes("Unauthorized"))
    ) {
      // Return error response for expected errors
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Forbidden") ? 403 : 401 }
      );
    }

    // Log to database - admin could email about "can't load error logs"
    logError({
      code: "ADMIN_GET_ERROR_LOGS_FAILED",
      userId: session?.user?.id,
      route: "/api/error-logs",
      method: "GET",
      error,
      metadata: {
        whereClause: JSON.stringify(where),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        note: "Failed to fetch error logs",
      },
    });

    return NextResponse.json(
      { error: "Failed to fetch error logs" },
      { status: 500 }
    );
  }
}
