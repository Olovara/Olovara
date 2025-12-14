import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  updateWebsitePage,
  deleteWebsitePage,
  getWebsitePageDetails,
  getSellerByUserId,
} from "@/lib/queries";
import { UpdateWebsitePageSchema } from "@/types/websiteBuilder";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let pageId: string | undefined = undefined;

  try {
    session = await auth();
    pageId = params.pageId;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    body = await request.json();
    const validatedData = UpdateWebsitePageSchema.parse(body);

    // Verify the page belongs to the seller
    const page = await getWebsitePageDetails(pageId);
    if (!page || page.website.sellerId !== seller.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const updatedPage = await updateWebsitePage(pageId, validatedData);

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating page:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Log to database - user could email about "couldn't update page"
    const userMessage = logError({
      code: "WEBSITE_PAGE_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/pages/[pageId]",
      method: "PUT",
      error,
      metadata: {
        pageId,
        note: "Failed to update website page",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let pageId: string | undefined = undefined;

  try {
    session = await auth();
    pageId = params.pageId;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Verify the page belongs to the seller
    const page = await getWebsitePageDetails(pageId);
    if (!page || page.website.sellerId !== seller.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await deleteWebsitePage(pageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deleting page:", error);

    // Log to database - user could email about "couldn't delete page"
    const userMessage = logError({
      code: "WEBSITE_PAGE_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/pages/[pageId]",
      method: "DELETE",
      error,
      metadata: {
        pageId,
        note: "Failed to delete website page",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
