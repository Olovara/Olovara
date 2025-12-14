import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ id: null, role: null, permissions: [] });
    }

    // Fetch role and permissions from the database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, permissions: true },
    });

    return NextResponse.json({
      id: session.user.id,
      role: dbUser?.role || null,
      permissions: dbUser?.permissions || [],
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching user role:", error);

    // Log to database - user could email about "can't load role"
    const userMessage = logError({
      code: "AUTH_ROLE_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/auth/get-role",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch user role",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
