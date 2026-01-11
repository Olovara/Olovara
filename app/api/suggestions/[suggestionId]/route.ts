import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";
import { ObjectId } from "mongodb";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { suggestionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let suggestionId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Extract suggestionId from params
    suggestionId = params.suggestionId;

    // Validate that the suggestionId is a valid ObjectID
    if (!ObjectId.isValid(suggestionId)) {
      return new NextResponse("Invalid suggestion ID format", { status: 400 });
    }

    // Check if the suggestion exists and belongs to the user
    const suggestion = await db.suggestion.findUnique({
      where: { id: suggestionId },
      select: { userId: true },
    });

    if (!suggestion) {
      return new NextResponse("Suggestion not found", { status: 404 });
    }

    // Only allow the owner to delete their own suggestion
    if (suggestion.userId !== session.user.id) {
      return new NextResponse(
        "Forbidden - You can only delete your own suggestions",
        { status: 403 }
      );
    }

    // Delete all upvotes and the suggestion atomically using a transaction
    // This ensures data consistency - if one fails, both operations are rolled back
    await db.$transaction([
      // Delete all upvotes associated with this suggestion first (cascade delete)
      db.upvote.deleteMany({
        where: { suggestionId },
      }),
      // Delete the suggestion
      db.suggestion.delete({
        where: { id: suggestionId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Suggestion deleted successfully",
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("[SUGGESTIONS_DELETE]", error);

    // Log to database - user could email about "couldn't delete suggestion"
    const userMessage = logError({
      code: "SUGGESTION_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/suggestions/[suggestionId]",
      method: "DELETE",
      error,
      metadata: {
        suggestionId,
        note: "Failed to delete suggestion",
      },
    });

    return new NextResponse(userMessage, { status: 500 });
  }
}
