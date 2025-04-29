import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sellerId, userId } = await req.json();

    // Find the seller to get their userId
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true }
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
              in: [userId, seller.userId]
            }
          }
        }
      },
      include: {
        users: true
      }
    });

    let conversation;

    // If no conversation exists, create a new one
    if (!existingConversation) {
      // Verify both users exist
      const [user1, user2] = await Promise.all([
        db.user.findUnique({ where: { id: userId } }),
        db.user.findUnique({ where: { id: seller.userId } })
      ]);

      if (!user1 || !user2) {
        throw new Error("One or both users not found");
      }

      // Create new conversation with UserConversation entries
      conversation = await db.conversation.create({
        data: {
          users: {
            create: [
              { userId: userId },
              { userId: seller.userId }
            ]
          }
        }
      });
    } else {
      conversation = existingConversation;
    }

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Error in conversation route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 