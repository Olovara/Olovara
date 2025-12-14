import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getSellerByUserId } from "@/lib/queries";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

// Schema for creating templates
const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "MINIMAL",
    "MODERN",
    "VINTAGE",
    "CREATIVE",
    "BUSINESS",
    "PORTFOLIO",
  ]),
  previewImage: z.string().url("Valid preview image URL required"),
  content: z.any(), // EditorElement[] structure
  isPremium: z.boolean().default(false),
  price: z.number().optional(),
});

// GET - Fetch all active templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isPremium = searchParams.get("isPremium");

    const where: any = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (isPremium !== null) {
      where.isPremium = isPremium === "true";
    }

    const templates = await db.websiteTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching templates:", error);

    // Log to database - user could email about "can't load templates"
    const userMessage = logError({
      code: "WEBSITE_TEMPLATES_FETCH_FAILED",
      userId: undefined, // Public route, no user required
      route: "/api/website-builder/templates",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch website templates",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// POST - Create new template (admin only)
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you'll need to implement this check)
    // For now, we'll allow any authenticated user to create templates
    // In production, add proper admin role checking

    body = await request.json();
    const validatedData = CreateTemplateSchema.parse(body);

    const template = await db.websiteTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        previewImage: validatedData.previewImage,
        content: validatedData.content,
        isPremium: validatedData.isPremium,
        price: validatedData.price,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating template:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Log to database - admin could email about "couldn't create template"
    const userMessage = logError({
      code: "WEBSITE_TEMPLATE_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/website-builder/templates",
      method: "POST",
      error,
      metadata: {
        templateName: body?.name,
        note: "Failed to create website template",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
