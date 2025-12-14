import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createWebsite,
  getWebsiteBySellerId,
  getSellerByUserId,
} from "@/lib/queries";
import { CreateWebsiteSchema } from "@/types/websiteBuilder";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const website = await getWebsiteBySellerId(seller.id);

    return NextResponse.json({ website });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching website:", error);

    // Log to database - user could email about "can't load my website"
    const userMessage = logError({
      code: "WEBSITE_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/websites",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch website",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(session.user.id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    body = await request.json();
    const validatedData = CreateWebsiteSchema.parse(body);

    // Check if seller already has a website
    const existingWebsite = await getWebsiteBySellerId(seller.id);
    if (existingWebsite) {
      return NextResponse.json(
        { error: "Website already exists" },
        { status: 400 }
      );
    }

    const website = await createWebsite(seller.id, validatedData);

    return NextResponse.json({ website }, { status: 201 });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating website:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Log to database - user could email about "couldn't create website"
    const userMessage = logError({
      code: "WEBSITE_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/websites",
      method: "POST",
      error,
      metadata: {
        note: "Failed to create website",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
