import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reportType,
      targetId,
      targetName,
      category,
      subReason,
      description,
      evidence,
      reporterName,
      reporterEmail,
    } = body;

    // Validate required fields
    if (!reportType || !targetId || !targetName || !category || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate report type
    if (!["SELLER", "PRODUCT"].includes(reportType)) {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      "INAPPROPRIATE_CONTENT",
      "COPYRIGHT_INFRINGEMENT", 
      "MISLEADING_INFORMATION",
      "POOR_QUALITY",
      "FAKE_PRODUCTS",
      "HARASSMENT",
      "SPAM",
      "OTHER"
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Get user session if authenticated
    const session = await auth();
    const reporterId = session?.user?.id || null;

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || null;
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || "unknown";

    // Validate target exists
    if (reportType === "SELLER") {
      const seller = await db.seller.findUnique({
        where: { userId: targetId },
        select: { id: true }
      });
      if (!seller) {
        return NextResponse.json(
          { error: "Seller not found" },
          { status: 404 }
        );
      }
    } else if (reportType === "PRODUCT") {
      const product = await db.product.findUnique({
        where: { id: targetId },
        select: { id: true }
      });
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate reports (same user, same target, within 24 hours)
    if (reporterId) {
      const existingReport = await db.report.findFirst({
        where: {
          reporterId,
          targetId,
          reportType,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
          }
        }
      });

      if (existingReport) {
        return NextResponse.json(
          { error: "You have already reported this item within the last 24 hours" },
          { status: 429 }
        );
      }
    }

    // Create the report
    const report = await db.report.create({
      data: {
        reporterId,
        reportType,
        targetId,
        targetName,
        reason: category, // Map category to reason field
        category,
        subReason: subReason || null,
        description: description.trim(),
        evidence: evidence?.trim() || null,
        reporterName: reporterName?.trim() || null,
        reporterEmail: reporterEmail?.trim() || null,
        ipAddress,
        userAgent,
        severity: getSeverityForCategory(category),
      },
    });

    // Log the report creation
    console.log(`Report created: ${report.id} for ${reportType} ${targetId}`);

    return NextResponse.json(
      { 
        success: true, 
        reportId: report.id,
        message: "Report submitted successfully" 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to determine severity based on category
function getSeverityForCategory(category: string): string {
  const severityMap: Record<string, string> = {
    INAPPROPRIATE_CONTENT: "HIGH",
    COPYRIGHT_INFRINGEMENT: "HIGH",
    MISLEADING_INFORMATION: "MEDIUM",
    POOR_QUALITY: "MEDIUM",
    FAKE_PRODUCTS: "CRITICAL",
    HARASSMENT: "CRITICAL",
    SPAM: "LOW",
    OTHER: "MEDIUM"
  };

  return severityMap[category] || "MEDIUM";
}

// GET endpoint for admins to retrieve reports (with pagination and filtering)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
      select: { id: true, role: true }
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const reportType = searchParams.get("reportType");

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (reportType) where.reportType = reportType;

    // Get reports with pagination
    const reports = await db.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const total = await db.report.count({ where });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 