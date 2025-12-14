import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  updateWebsite,
  getWebsiteDetails,
  getSellerByUserId,
} from "@/lib/queries";
import { PublishWebsiteSchema } from "@/types/websiteBuilder";
import { logError } from "@/lib/error-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { websiteId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let websiteId: string | undefined = undefined;

  try {
    session = await auth();
    websiteId = params.websiteId;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    body = await request.json();
    const validatedData = PublishWebsiteSchema.parse(body);

    // Verify the website belongs to the seller
    const website = await getWebsiteDetails(websiteId);
    if (!website || website.sellerId !== seller.id) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const updatedWebsite = await updateWebsite(websiteId, validatedData);

    return NextResponse.json({ website: updatedWebsite });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error publishing website:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Log to database - user could email about "couldn't publish website"
    const userMessage = logError({
      code: "WEBSITE_PUBLISH_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/websites/[websiteId]/publish",
      method: "POST",
      error,
      metadata: {
        websiteId,
        note: "Failed to publish website",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
