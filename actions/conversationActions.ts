"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Opens or creates a 1:1 DM between the logged-in seller and the buyer who submitted this custom order.
 */
export async function ensureConversationForCustomOrderSubmission(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { userId: true },
    });
    if (!seller) {
      return { error: "Seller profile not found" };
    }

    const submission = await db.customOrderSubmission.findFirst({
      where: { id: submissionId },
      select: {
        userId: true,
        form: { select: { sellerId: true } },
      },
    });

    if (!submission || submission.form.sellerId !== session.user.id) {
      return { error: "Submission not found" };
    }

    const buyerUserId = submission.userId;
    if (buyerUserId === seller.userId) {
      return { error: "You cannot message yourself" };
    }

    const buyer = await db.user.findUnique({
      where: { id: buyerUserId },
      select: { id: true },
    });
    if (!buyer) {
      return { error: "Buyer account not found" };
    }

    const candidates = await db.conversation.findMany({
      where: {
        AND: [
          { users: { some: { userId: buyerUserId } } },
          { users: { some: { userId: seller.userId } } },
        ],
      },
      include: { users: true },
    });

    const existingDm = candidates.find((c) => c.users.length === 2);
    if (existingDm) {
      return { data: { conversationId: existingDm.id } };
    }

    const conversation = await db.conversation.create({
      data: {
        users: {
          create: [{ userId: buyerUserId }, { userId: seller.userId }],
        },
      },
    });

    return { data: { conversationId: conversation.id } };
  } catch (error) {
    console.error("ensureConversationForCustomOrderSubmission:", error);
    return { error: "Could not open conversation" };
  }
}
