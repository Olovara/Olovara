import { NextRequest, NextResponse } from "next/server";
import { getActiveSellersForProductCreation } from "@/actions/adminActions";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sellers/active
 * Get all active sellers for admin product creation
 */
export async function GET(req: NextRequest) {
  try {
    const sellers = await getActiveSellersForProductCreation();

    return NextResponse.json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    console.error("Error fetching active sellers:", error);

    const userMessage = logError({
      code: "ADMIN_GET_ACTIVE_SELLERS_API_FAILED",
      userId: undefined,
      route: "/api/admin/sellers/active",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch active sellers in API route",
      },
    });

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}
