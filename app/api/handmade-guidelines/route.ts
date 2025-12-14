import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

const defaultGuidelines = {
  html: `
    <h1>Handmade Guidelines</h1>
    <p>Last updated: ${new Date().toLocaleDateString()}</p>

    <h2>1. What Makes a Product Handmade?</h2>
    <p>A handmade product is one that is made by hand, with minimal use of machines or automation. The maker should be directly involved in the creation process.</p>

    <h2>2. Quality Standards</h2>
    <ul>
      <li>Products should be well-crafted and durable</li>
      <li>Materials should be of good quality</li>
      <li>Finishing should be neat and professional</li>
    </ul>

    <h2>3. Documentation</h2>
    <p>We encourage sellers to document their making process with photos or videos to showcase the handmade nature of their products.</p>

    <h2>4. Prohibited Items</h2>
    <p>The following items are not considered handmade and are not allowed:</p>
    <ul>
      <li>Mass-produced items</li>
      <li>Items made entirely by machine</li>
      <li>Items assembled from pre-made components without significant modification</li>
    </ul>

    <h2>5. Contact Us</h2>
    <p>If you have any questions about these guidelines, please contact us at:</p>
    <ul>
      <li>Email: guidelines@yarnnu.com</li>
      <li>Address: [Your Business Address]</li>
    </ul>
  `,
  text: `Handmade Guidelines - Last updated: ${new Date().toLocaleDateString()}

1. What Makes a Product Handmade?
A handmade product is one that is made by hand, with minimal use of machines or automation. The maker should be directly involved in the creation process.

2. Quality Standards
- Products should be well-crafted and durable
- Materials should be of good quality
- Finishing should be neat and professional

3. Documentation
We encourage sellers to document their making process with photos or videos to showcase the handmade nature of their products.

4. Prohibited Items
The following items are not considered handmade and are not allowed:
- Mass-produced items
- Items made entirely by machine
- Items assembled from pre-made components without significant modification

5. Contact Us
If you have any questions about these guidelines, please contact us at:
- Email: guidelines@yarnnu.com
- Address: [Your Business Address]`,
};

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Try to get existing guidelines
    const guidelines = await db.handmadeGuidelines.findFirst();

    if (!guidelines) {
      // If no guidelines exist, return default guidelines
      return NextResponse.json({
        content: defaultGuidelines,
        updatedAt: new Date(),
      });
    }

    // Process the content
    let responseContent = { html: "", text: "" };

    if (guidelines.content && typeof guidelines.content === "object") {
      const content = guidelines.content as any;
      responseContent.html = content.html || defaultGuidelines.html;
      responseContent.text = content.text || defaultGuidelines.text;
    } else {
      // If content is not in expected format, return default guidelines
      return NextResponse.json({
        content: defaultGuidelines,
        updatedAt: guidelines.updatedAt,
      });
    }

    return NextResponse.json({
      content: responseContent,
      updatedAt: guidelines.updatedAt,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in GET /api/handmade-guidelines:", error);

    // Log to database - user could email about "can't load guidelines"
    logError({
      code: "HANDMADE_GUIDELINES_FETCH_FAILED",
      userId: undefined, // Public route
      route: "/api/handmade-guidelines",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch handmade guidelines",
      },
    });

    // Return default guidelines in case of error
    return NextResponse.json({
      content: defaultGuidelines,
      updatedAt: new Date(),
    });
  }
}

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch user permissions from database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true },
    });

    if (!dbUser?.permissions?.includes("MANAGE_POLICIES")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    body = await req.json();
    const { content } = body;

    // Ensure content is in the correct format
    const formattedContent = {
      html: content?.html || "",
      text: content?.text || content?.html?.replace(/<[^>]*>?/gm, "") || "",
    };

    // First, try to find existing guidelines
    const existingGuidelines = await db.handmadeGuidelines.findFirst();

    if (existingGuidelines) {
      // Update existing guidelines
      const updatedGuidelines = await db.handmadeGuidelines.update({
        where: { id: existingGuidelines.id },
        data: {
          content: formattedContent,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updatedGuidelines);
    } else {
      // Create new guidelines if none exist
      const newGuidelines = await db.handmadeGuidelines.create({
        data: {
          content: formattedContent,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(newGuidelines);
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error in POST /api/handmade-guidelines:", error);

    // Log to database - admin could email about "couldn't update guidelines"
    const userMessage = logError({
      code: "HANDMADE_GUIDELINES_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/handmade-guidelines",
      method: "POST",
      error,
      metadata: {
        note: "Failed to update handmade guidelines",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
