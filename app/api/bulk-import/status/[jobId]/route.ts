/**
 * Get Bulk Import Job Status API
 * When status is QUEUED, also checks Redis queue so we can hint if the worker isn't running.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import { getJobStatus } from "@/lib/queues/bulk-import-queue";

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

    // If job is stuck in QUEUED, check Redis so we can hint about the worker
    let workerHint: string | undefined;
    if (job.status === "QUEUED") {
      try {
        const queueJob = await getJobStatus(jobId);
        if (!queueJob) {
          workerHint =
            "Job not found in the queue. Start the bulk import worker (e.g. run 'yarn dev' which starts it, or in another terminal run 'yarn worker').";
        } else if (queueJob.state === "waiting" || queueJob.state === "delayed") {
          workerHint =
            "Job is in the queue waiting for the worker. If this persists, ensure the worker is running (yarn dev or yarn worker).";
        }
      } catch {
        workerHint =
          "Could not check queue. Ensure Redis is running and the bulk import worker is started (yarn dev or yarn worker).";
      }
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
      ...(workerHint && { workerHint }),
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



