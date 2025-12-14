import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    body = await req.json();
    const { title, description, type } = body;

    if (!title || !description || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the user's role from the database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const suggestion = await db.suggestion.create({
      data: {
        title,
        description,
        userId: session.user.id,
        type,
        role: user.role,
      },
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    // Log to console (always happens)
    console.error("[SUGGESTIONS_POST]", error);

    // Don't log validation errors - they're expected client-side issues
    // (Missing required fields is already handled with 400 status)

    // Log to database - user could email about "couldn't submit suggestion"
    const userMessage = logError({
      code: "SUGGESTION_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/suggestions",
      method: "POST",
      error,
      metadata: {
        title: body?.title,
        type: body?.type,
        note: "Failed to create suggestion",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}
