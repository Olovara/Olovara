import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let conversationId: string | null = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    conversationId = searchParams.get("conversation");

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    // Fetch messages for the conversation
    const messages = await db.message.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform messages to match the expected format
    const transformedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      sender: message.sender.username || message.sender.email || "Unknown User",
      senderId: message.sender.id,
      createdAt: message.createdAt,
      conversationId: message.conversationId,
    }));

    return NextResponse.json(transformedMessages);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching messages:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "can't load messages"
    const userMessage = logError({
      code: "MESSAGES_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/messages",
      method: "GET",
      error,
      metadata: {
        conversationId,
        note: "Failed to fetch messages",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}
