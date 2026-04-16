/**
 * CSV Upload API
 * Handles CSV file upload and returns preview data
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import Papa from "papaparse";
import { normalizeCsvHeader } from "@/lib/bulk-import/normalize-header";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const MAX_PREVIEW_ROWS = 10; // Show first 10 rows in preview

export async function POST(request: NextRequest) {
  const session = await auth();
  try {
    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller account not found" },
        { status: 404 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV file" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV with normalized headers (BOM, trim, collapse spaces)
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => normalizeCsvHeader(header),
    });

    if (parseResult.errors.length > 0) {
      console.error("[CSV UPLOAD] Parse errors:", parseResult.errors);
      return NextResponse.json(
        {
          error: "Failed to parse CSV",
          details: parseResult.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const rows = parseResult.data as any[];
    const headers = parseResult.meta.fields || [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    // Check row limit
    if (rows.length > 500) {
      return NextResponse.json(
        {
          error: "CSV contains more than 500 rows. Please split the file or only the first 500 rows will be processed.",
          warning: true,
          totalRows: rows.length,
        },
        { status: 200 } // Still return success but with warning
      );
    }

    // Return preview data
    return NextResponse.json({
      success: true,
      headers,
      totalRows: rows.length,
      previewRows: rows.slice(0, MAX_PREVIEW_ROWS),
      warning: rows.length > 500 ? "Only the first 500 rows will be processed" : undefined,
    });
  } catch (error) {
    logError({
      code: "BULK_IMPORT_CSV_UPLOAD_FAILED",
      userId: session?.user?.id,
      route: "/api/bulk-import/upload",
      method: "POST",
      error,
      metadata: {
        note: "Failed to process CSV file upload",
      },
    });
    return NextResponse.json(
      {
        error: "Failed to process CSV file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


