/**
 * Export Failed Rows API
 * Returns failed rows as CSV for seller to fix and reupload
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await auth();
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = params;

    // Get job from database
    const job = await db.bulkImportJob.findUnique({
      where: { jobId },
      include: {
        seller: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify job belongs to seller
    if (job.seller.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get failed rows
    const failedRows = (job.failedRows as any[]) || [];

    if (failedRows.length === 0) {
      return NextResponse.json(
        { error: "No failed rows to export" },
        { status: 404 }
      );
    }

    // Get all unique headers from failed rows
    const allHeaders = new Set<string>();
    failedRows.forEach((fr) => {
      if (fr.rowData && typeof fr.rowData === "object") {
        Object.keys(fr.rowData).forEach((key) => allHeaders.add(key));
      }
    });
    allHeaders.add("_ERROR");
    allHeaders.add("_ROW_NUMBER");
    
    const headers = Array.from(allHeaders);

    // Build CSV content
    let csvContent = headers.join(",") + "\n";

    for (const fr of failedRows) {
      const row: any = { ...fr.rowData };
      row._ERROR = fr.error || "";
      row._ROW_NUMBER = fr.rowNumber || "";
      
      // Escape CSV values
      const csvRow = headers.map((header) => {
        const value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      
      csvContent += csvRow.join(",") + "\n";
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="failed-rows-${jobId}.csv"`,
      },
    });
  } catch (error) {
    logError({
      code: "BULK_IMPORT_FAILED_ROWS_EXPORT_FAILED",
      userId: session?.user?.id,
      route: "/api/bulk-import/failed-rows/[jobId]",
      method: "GET",
      error,
      metadata: {
        note: "Failed to export failed rows as CSV",
        jobId: params.jobId,
      },
    });
    return NextResponse.json(
      {
        error: "Failed to export failed rows",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

