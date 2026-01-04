/**
 * Get Bulk Import Job Status API
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

    return NextResponse.json({
      success: true,
      job: {
        jobId: job.jobId,
        status: job.status,
        totalRows: job.totalRows,
        processed: job.processed,
        successCount: job.successCount,
        needsInventoryReviewCount: job.needsInventoryReviewCount || 0,
        failedRows: job.failedRows,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        sourcePlatform: job.sourcePlatform,
      },
    });
  } catch (error) {
    logError({
      code: "BULK_IMPORT_STATUS_FAILED",
      userId: session?.user?.id,
      route: "/api/bulk-import/status/[jobId]",
      method: "GET",
      error,
      metadata: {
        note: "Failed to get bulk import job status",
        jobId: params.jobId,
      },
    });
    return NextResponse.json(
      {
        error: "Failed to get job status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



