import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateUniqueSKU } from "@/lib/sku-generator";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productName } = await req.json();

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
    console.error("Error generating SKU:", error);
    return NextResponse.json(
      { error: "Failed to generate SKU" },
      { status: 500 }
    );
  }
}
