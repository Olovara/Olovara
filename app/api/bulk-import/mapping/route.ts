/**
 * CSV Mapping API
 * Handles saving and retrieving CSV header mappings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import { autoMapHeaders, validateMapping } from "@/lib/bulk-import/mapping";

export const dynamic = "force-dynamic";

// GET - Get saved mappings or auto-generate mapping
export async function GET(request: NextRequest) {
  const session = await auth();
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const csvHeaders = searchParams.get("headers")?.split(",") || [];
    const sourcePlatform = searchParams.get("platform") || undefined;

    if (csvHeaders.length === 0) {
      return NextResponse.json(
        { error: "CSV headers required" },
        { status: 400 }
      );
    }

    // Try to get saved mapping for this platform
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      include: {
        csvMappings: {
          where: {
            ...(sourcePlatform ? { sourcePlatform } : {}),
            isDefault: true,
          },
        },
      },
    });

    let mapping: Record<string, string> = {};

    if (seller?.csvMappings && seller.csvMappings.length > 0) {
      // Use saved mapping
      const savedMapping = seller.csvMappings[0];
      mapping = savedMapping.mapping as Record<string, string>;
    } else {
      // Auto-generate mapping
      mapping = autoMapHeaders(csvHeaders, sourcePlatform);
    }

    // Validate mapping
    const validation = validateMapping(mapping, csvHeaders);

    return NextResponse.json({
      success: true,
      mapping,
      validation,
    });
  } catch (error) {
    logError({
      code: "BULK_IMPORT_MAPPING_GENERATE_FAILED",
      userId: session?.user?.id,
      route: "/api/bulk-import/mapping",
      method: "GET",
      error,
      metadata: {
        note: "Failed to generate CSV header mapping",
      },
    });
    return NextResponse.json(
      {
        error: "Failed to generate mapping",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Save mapping
export async function POST(request: NextRequest) {
  const session = await auth();
  let sourcePlatform: string | undefined;
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mapping, sourcePlatform: platform, name, isDefault = false } = body;
    sourcePlatform = platform;

    if (!mapping || !sourcePlatform) {
      return NextResponse.json(
        { error: "Mapping and source platform required" },
        { status: 400 }
      );
    }

    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller account not found" },
        { status: 404 }
      );
    }

    // If this is set as default, unset other defaults for this platform
    if (isDefault) {
      await db.cSVMapping.updateMany({
        where: {
          sellerId: seller.userId,
          sourcePlatform,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create or update mapping
    const savedMapping = await db.cSVMapping.upsert({
      where: {
        sellerId_sourcePlatform_isDefault: {
          sellerId: seller.userId,
          sourcePlatform,
          isDefault,
        },
      },
      create: {
        sellerId: seller.userId,
        sourcePlatform,
        mapping,
        name,
        isDefault,
      },
      update: {
        mapping,
        name,
        isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      mappingId: savedMapping.id,
    });
  } catch (error) {
    logError({
      code: "BULK_IMPORT_MAPPING_SAVE_FAILED",
      userId: session?.user?.id,
      route: "/api/bulk-import/mapping",
      method: "POST",
      error,
      metadata: {
        note: "Failed to save CSV header mapping",
        sourcePlatform,
      },
    });
    return NextResponse.json(
      {
        error: "Failed to save mapping",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



