import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await auth();
    console.log("Session in conversations route:", session);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First, find all UserConversation entries for this user
    const userConversations = await db.userConversation.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        conversation: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    username: true
                  }
                }
              }
            },
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc'
        }
      }
    });

    console.log("Found user conversations:", userConversations);

    // Transform the data to a more usable format
    const transformedConversations = userConversations.map(uc => {
      const conversation = uc.conversation;
      // Find the other user in the conversation
      const otherUserConversation = conversation.users.find(
        userConv => userConv.userId !== session.user.id
      );
      
      const otherUser = otherUserConversation?.user;
      const lastMessage = conversation.messages[0];

      // Determine the other user's name
      let otherUserName = "Unknown User";
      if (otherUser) {
        if (otherUser.username) {
          otherUserName = otherUser.username;
        } else if (otherUser.email) {
          otherUserName = otherUser.email;
        }
      }

      return {
        id: conversation.id,
        lastMessage: lastMessage?.content || "No messages yet",
        lastMessageTime: lastMessage?.createdAt || conversation.createdAt,
        otherUser: {
          id: otherUser?.id || "unknown",
          email: otherUser?.email || "unknown",
          name: otherUserName
        }
      };
    });

    console.log("Transformed conversations:", transformedConversations);

    return NextResponse.json(transformedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 