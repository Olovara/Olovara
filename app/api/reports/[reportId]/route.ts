import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  // Extract reportId from params immediately to avoid scope issues
  const reportIdParam = params.reportId;
  let reportId: string | undefined = reportIdParam;

  try {
    session = await auth();

    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
      select: { id: true, role: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    body = await request.json();
    const { status, adminNotes, resolutionNotes } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      "PENDING",
      "UNDER_REVIEW",
      "RESOLVED",
      "DISMISSED",
      "ESCALATED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if report exists
    const existingReport = await db.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update the report
    const updatedReport = await db.report.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes: adminNotes?.trim() || null,
        resolutionNotes: resolutionNotes?.trim() || null,
        resolvedBy:
          status === "RESOLVED" || status === "DISMISSED"
            ? session.user.id
            : null,
        resolvedAt:
          status === "RESOLVED" || status === "DISMISSED" ? new Date() : null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Log the update
    console.log(
      `Report ${reportId} updated to status: ${status} by admin ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: "Report updated successfully",
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating report:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't update report"
    const userMessage = logError({
      code: "REPORT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/reports/[reportId]",
      method: "PATCH",
      error,
      metadata: {
        reportId,
        status: body?.status,
        note: "Failed to update report",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  // Extract reportId from params immediately to avoid scope issues
  const reportIdParam = params.reportId;
  let reportId: string | undefined = reportIdParam;

  try {
    session = await auth();

    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
      select: { id: true, role: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get the specific report
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching report:", error);

    // Log to database - admin could email about "can't load report"
    const userMessage = logError({
      code: "REPORT_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/reports/[reportId]",
      method: "GET",
      error,
      metadata: {
        reportId,
        note: "Failed to fetch report",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
