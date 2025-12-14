import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getSellerByUserId, getWebsiteBySellerId } from "@/lib/queries";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// POST - Apply template to a website
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let templateId: string | undefined = undefined;

  try {
    session = await auth();
    templateId = params.templateId;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get the template
    const template = await db.websiteTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if template is premium and user has access
    if (template.isPremium) {
      // TODO: Check if user has Studio plan or purchased this template
      // For now, we'll allow it
    }

    // Get seller's website
    const website = await getWebsiteBySellerId(seller.id);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Get the homepage
    const homepage = await db.websitePage.findFirst({
      where: {
        websiteId: website.id,
        isHomepage: true,
      },
    });

    if (!homepage) {
      return NextResponse.json(
        { error: "Homepage not found" },
        { status: 404 }
      );
    }

    // Apply template content to homepage
    await db.websitePage.update({
      where: { id: homepage.id },
      data: {
        content: JSON.stringify(template.content),
        updatedAt: new Date(),
      },
    });

    // Update website theme
    await db.website.update({
      where: { id: website.id },
      data: {
        theme: template.name,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Template applied successfully",
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error applying template:", error);

    // Log to database - user could email about "couldn't apply template"
    const userMessage = logError({
      code: "WEBSITE_TEMPLATE_APPLY_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/templates/[templateId]/apply",
      method: "POST",
      error,
      metadata: {
        templateId,
        note: "Failed to apply website template",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
