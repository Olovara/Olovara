import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateUniqueSKU } from "@/lib/sku-generator";
import { logError } from "@/lib/error-logger";

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await req.json();
    const { productName } = body;

    if (
      !productName ||
      typeof productName !== "string" ||
      productName.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const sku = await generateUniqueSKU(productName.trim(), session.user.id);

    return NextResponse.json({ sku });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error generating SKU:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't generate SKU"
    const userMessage = logError({
      code: "SKU_GENERATION_FAILED",
      userId: session?.user?.id,
      route: "/api/products/generate-sku",
      method: "POST",
      error,
      metadata: {
        productName: body?.productName,
        note: "Failed to generate SKU",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
