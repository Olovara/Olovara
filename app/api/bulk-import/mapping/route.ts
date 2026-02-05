/**
 * CSV Mapping API
 * Handles saving and retrieving CSV header mappings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import { autoMapHeaders, validateMapping } from "@/lib/bulk-import/mapping";
import { normalizeCsvHeaders } from "@/lib/bulk-import/normalize-header";

export const dynamic = "force-dynamic";

// GET - Get saved mappings or auto-generate mapping
export async function GET(request: NextRequest) {
  const session = await auth();
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawHeaders = searchParams.get("headers")?.split(",") || [];
    const decoded = rawHeaders.map((h) => {
      try {
        return decodeURIComponent(h);
      } catch {
        return h;
      }
    });
    const csvHeaders = normalizeCsvHeaders(decoded);
    const platformParam = searchParams.get("platform");
    // Handle empty string, "undefined" string, or actual undefined/null
    const sourcePlatform =
      platformParam &&
      platformParam.trim() !== "" &&
      platformParam !== "undefined" &&
      platformParam !== "null"
        ? platformParam.trim()
        : undefined;

    console.log(
      `[MAPPING API] Received request - Platform: "${sourcePlatform}", Headers: ${csvHeaders.length} headers`
    );
    if (sourcePlatform === "Wix") {
      console.log(
        `[MAPPING API] Wix platform detected! Checking for productOptionDescription headers...`
      );
      csvHeaders.forEach((h) => {
        if (/^productOptionDescription\d+$/i.test(h)) {
          console.log(
            `[MAPPING API] Found productOptionDescription header: "${h}"`
          );
        }
      });
    }

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

    // CRITICAL: For Wix, FORCE correct mapping of productOptionDescription1-6 to variation1Values-6Values
    // This fixes both saved mappings and auto-generated mappings
    console.log(
      `[MAPPING API] Before enforcement - sourcePlatform: "${sourcePlatform}", mapping keys:`,
      Object.keys(mapping)
    );
    if (sourcePlatform === "Wix") {
      console.log(
        `[MAPPING API] Wix platform confirmed! Starting enforcement...`
      );
      for (let i = 1; i <= 6; i++) {
        const headerPattern = new RegExp(`^productOptionDescription${i}$`, "i");
        const correctField = `variation${i}Values`;

        console.log(
          `[MAPPING API] Checking for productOptionDescription${i}...`
        );

        // Find the actual header in mapping keys (case-insensitive)
        const matchingHeader = Object.keys(mapping).find((k) =>
          headerPattern.test(k)
        );

        if (matchingHeader) {
          // Force the correct mapping - override anything that was set before
          if (mapping[matchingHeader] !== correctField) {
            console.log(
              `[MAPPING API] *** FORCING Wix mapping: "${matchingHeader}" → "${correctField}" (was: "${mapping[matchingHeader]}") ***`
            );
            mapping[matchingHeader] = correctField;
          } else {
            console.log(
              `[MAPPING API] Mapping already correct: "${matchingHeader}" → "${correctField}"`
            );
          }
        } else {
          // Header exists in CSV but not in mapping yet - find it and add the mapping
          const csvHeader = csvHeaders.find((h) => headerPattern.test(h));
          if (csvHeader) {
            console.log(
              `[MAPPING API] *** Adding missing Wix mapping: "${csvHeader}" → "${correctField}" ***`
            );
            mapping[csvHeader] = correctField;
          } else {
            console.log(
              `[MAPPING API] productOptionDescription${i} not found in CSV headers`
            );
          }
        }
      }
    } else {
      console.log(`[MAPPING API] Not Wix platform, skipping enforcement`);
    }

    // FINAL ENFORCEMENT: For Wix, FORCE correct mapping one more time after everything
    // This is the absolute last step to ensure correctness
    console.log(
      `[MAPPING API] Final enforcement check - sourcePlatform: "${sourcePlatform}"`
    );
    if (sourcePlatform === "Wix") {
      console.log(`[MAPPING API] Running FINAL enforcement for Wix...`);
      for (let i = 1; i <= 6; i++) {
        const headerPattern = new RegExp(`^productOptionDescription${i}$`, "i");
        const correctField = `variation${i}Values`;

        // Find ANY header matching the pattern (in mapping keys or CSV headers)
        const matchingHeader =
          Object.keys(mapping).find((k) => headerPattern.test(k)) ||
          csvHeaders.find((h) => headerPattern.test(h));

        if (matchingHeader) {
          // ABSOLUTELY FORCE the correct mapping - this is the final say
          const currentMapping = mapping[matchingHeader];
          if (currentMapping !== correctField) {
            console.log(
              `[MAPPING API] *** FINAL ENFORCEMENT: "${matchingHeader}" → "${correctField}" (was: "${currentMapping}") ***`
            );
            mapping[matchingHeader] = correctField;
          } else {
            console.log(
              `[MAPPING API] Final check - mapping already correct: "${matchingHeader}" → "${correctField}"`
            );
          }
        } else {
          console.log(
            `[MAPPING API] Final check - productOptionDescription${i} not found`
          );
        }
      }
      console.log(
        `[MAPPING API] Final mapping state:`,
        Object.entries(mapping).filter(([k]) =>
          /^productOptionDescription\d+$/i.test(k)
        )
      );
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
    let { mapping, sourcePlatform: platform, name, isDefault = false } = body;
    sourcePlatform = platform;

    if (!mapping || !sourcePlatform) {
      return NextResponse.json(
        { error: "Mapping and source platform required" },
        { status: 400 }
      );
    }

    // CRITICAL: For Wix, FORCE correct mapping of productOptionDescription1-6 before saving
    // This prevents incorrect mappings from being saved
    if (sourcePlatform === "Wix") {
      for (let i = 1; i <= 6; i++) {
        const headerPattern = new RegExp(`^productOptionDescription${i}$`, "i");
        const correctField = `variation${i}Values`;

        // Find and fix any productOptionDescription headers in the mapping
        for (const header of Object.keys(mapping)) {
          if (headerPattern.test(header) && mapping[header] !== correctField) {
            console.log(
              `[AUTO-MAP] Fixing mapping before save: "${header}" → "${correctField}" (was: "${mapping[header]}")`
            );
            mapping[header] = correctField;
          }
        }
      }
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
