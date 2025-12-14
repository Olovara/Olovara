import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { logError } from "@/lib/error-logger";

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    body = await req.json();
    const { sellerId, userId } = body;

    // Find the seller to get their userId
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

    // Find existing conversation by checking UserConversation entries
    const existingConversation = await db.conversation.findFirst({
      where: {
        users: {
          every: {
            userId: {
              in: [userId, seller.userId],
            },
          },
        },
      },
      include: {
        users: true,
      },
    });

    let conversation;

    // If no conversation exists, create a new one
    if (!existingConversation) {
      // Verify both users exist
      const [user1, user2] = await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.user.findUnique({ where: { id: seller.userId } }),
      ]);

      if (!user1 || !user2) {
        throw new Error("One or both users not found");
      }

      // Create new conversation with UserConversation entries
      conversation = await db.conversation.create({
        data: {
          users: {
            create: [{ userId: userId }, { userId: seller.userId }],
          },
        },
      });
    } else {
      conversation = existingConversation;
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in conversation route:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't create/find conversation"
    const userMessage = logError({
      code: "CONVERSATION_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/messages/conversation",
      method: "POST",
      error,
      metadata: {
        sellerId: body?.sellerId,
        userId: body?.userId,
        note: "Failed to create or find conversation",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}
