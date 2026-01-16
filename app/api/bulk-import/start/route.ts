/**
 * Start Bulk Import Job API
 * Creates a bulk import job and queues it for processing
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";
import { addBulkImportJob } from "@/lib/queues/bulk-import-queue";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";
import { BulkImportJobStatus } from "@prisma/client";
import { sanitizeRedisUrl } from "@/lib/utils/sanitize-redis-url";

export const dynamic = "force-dynamic";

const MAX_ROWS = 500;

export async function POST(request: NextRequest) {
  const session = await auth();
  let sourcePlatform: string | undefined;
  let csvData: any[] | undefined;
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      csvData: data, 
      mapping, 
      sourcePlatform: platform, 
      mappingId,
      primaryCategory,
      secondaryCategory,
      freeShipping,
      shippingOptionId,
      handlingFee,
    } = body;
    csvData = data;
    sourcePlatform = platform;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json(
        { error: "CSV data is required" },
        { status: 400 }
      );
    }

    if (!mapping || typeof mapping !== "object") {
      return NextResponse.json(
        { error: "Mapping is required" },
        { status: 400 }
      );
    }

    // Validate categories are provided
    if (!primaryCategory || !secondaryCategory) {
      return NextResponse.json(
        { error: "Primary and secondary categories are required" },
        { status: 400 }
      );
    }

    // Validate shipping
    if (freeShipping === undefined) {
      return NextResponse.json(
        { error: "Free shipping setting is required" },
        { status: 400 }
      );
    }

    if (!freeShipping && !shippingOptionId) {
      return NextResponse.json(
        { error: "Shipping option is required when free shipping is disabled" },
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

    // Limit to MAX_ROWS
    const rowsToProcess = csvData.slice(0, MAX_ROWS);
    const totalRows = rowsToProcess.length;

    // Warn if more rows were provided
    if (csvData.length > MAX_ROWS) {
      console.warn(
        `[BULK IMPORT] CSV has ${csvData.length} rows, only processing first ${MAX_ROWS}`
      );
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Create job record in database
    const job = await db.bulkImportJob.create({
      data: {
        jobId,
        sellerId: seller.userId,
        status: BulkImportJobStatus.QUEUED,
        totalRows,
        sourcePlatform,
        mappingId,
      },
    });

    // Add job to queue
    try {
      await addBulkImportJob({
        jobId,
        sellerId: seller.userId,
        csvData: rowsToProcess,
        mapping,
        sourcePlatform,
        mappingId,
        primaryCategory,
        secondaryCategory,
        freeShipping: freeShipping || false,
        shippingOptionId: freeShipping ? undefined : (shippingOptionId || undefined),
        handlingFee: handlingFee || 0,
      });
    } catch (queueError) {
      // If Redis is not available, update job status to FAILED
      // Sanitize error message to avoid exposing Redis URLs
      const errorMessage = queueError instanceof Error ? queueError.message : "Redis connection failed";
      const sanitizedError = errorMessage.replace(
        /redis:\/\/[^\s]+/g,
        (match) => sanitizeRedisUrl(match)
      );
      
      await db.bulkImportJob.update({
        where: { jobId },
        data: {
          status: BulkImportJobStatus.FAILED,
          finishedAt: new Date(),
          failedRows: [
            {
              rowNumber: 0,
              error: sanitizedError,
              rowData: {},
            },
          ] as any,
        },
      });

      return NextResponse.json(
        {
          error: "Redis is not available",
          message:
            "Bulk import requires Redis to be running. Please start Redis or configure REDIS_URL environment variable.",
          details: sanitizedError,
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      totalRows,
      warning:
        csvData.length > MAX_ROWS
          ? `Only the first ${MAX_ROWS} rows will be processed`
          : undefined,
    });
  } catch (error) {
    logError({
      code: "BULK_IMPORT_START_FAILED",
      userId: session?.user?.id,
      route: "/api/bulk-import/start",
      method: "POST",
      error,
      metadata: {
        note: "Failed to start bulk import job",
        sourcePlatform,
        totalRows: csvData?.length,
      },
    });
    return NextResponse.json(
      {
        error: "Failed to start bulk import",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



