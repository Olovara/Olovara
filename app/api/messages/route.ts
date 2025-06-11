import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation");

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    // Fetch messages for the conversation
    const messages = await db.message.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform messages to match the expected format
    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      sender: message.sender.username || message.sender.email || "Unknown User",
      senderId: message.sender.id,
      createdAt: message.createdAt,
      conversationId: message.conversationId
    }));

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 