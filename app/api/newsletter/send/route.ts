import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NewsletterSendSchema } from "@/schemas/NewsletterSchema";
import { Resend } from "resend";
import NewsletterEmail from "@/components/emails/NewsletterEmail";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user permissions and role from database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true, role: true },
    });

    // SUPER_ADMIN has all permissions, so bypass the check
    if (
      dbUser?.role !== "SUPER_ADMIN" &&
      !dbUser?.permissions?.includes("SEND_BROADCASTS")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions to send newsletters" },
        { status: 403 }
      );
    }

    body = await req.json();
    const validatedData = NewsletterSendSchema.parse(body);

    // Get subscribers based on target audience
    let subscribers;

    if (validatedData.testMode && validatedData.testEmails) {
      // Test mode - use provided test emails
      subscribers = validatedData.testEmails.map((email) => ({ email }));
    } else {
      // Get actual subscribers from database
      const whereClause: any = { isActive: true };

      if (validatedData.targetAudience === "active") {
        // Get subscribers who signed up more than 30 days ago
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        whereClause.createdAt = { lt: thirtyDaysAgo };
      } else if (validatedData.targetAudience === "new") {
        // Get subscribers who signed up in the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        whereClause.createdAt = { gte: thirtyDaysAgo };
      }

      const subscriberData = await db.newsletterSubscription.findMany({
        where: whereClause,
        select: { email: true },
      });

      subscribers = subscriberData;
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers found for the target audience" },
        { status: 400 }
      );
    }

    // If not sending immediately, store for later (you could add a newsletter queue table)
    if (!validatedData.sendImmediately) {
      return NextResponse.json(
        { error: "Scheduled sending not implemented yet" },
        { status: 400 }
      );
    }

    // Send emails
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

        const { data, error } = await resend.emails.send({
          from: "Yarnnu <newsletter@yarnnu.com>",
          to: [subscriber.email],
          subject: validatedData.subject,
          react: NewsletterEmail({
            subject: validatedData.subject,
            content: validatedData.content,
            previewText: validatedData.previewText,
            unsubscribeUrl,
          }),
        });

        if (error) {
          console.error(`Failed to send email to ${subscriber.email}:`, error);
          return { email: subscriber.email, success: false, error };
        }

        return { email: subscriber.email, success: true, data };
      } catch (error) {
        console.error(`Error sending email to ${subscriber.email}:`, error);
        return { email: subscriber.email, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      message: `Newsletter sent successfully!`,
      summary: {
        total: subscribers.length,
        successful: successful.length,
        failed: failed.length,
      },
      details: {
        successful: successful.map((r) => r.email),
        failed: failed.map((r) => ({ email: r.email, error: r.error })),
      },
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Newsletter sending error:", error);

    // Don't log validation errors - they're expected client-side issues
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: "Invalid newsletter data" },
        { status: 400 }
      );
    }

    // Log to database - admin could email about "couldn't send newsletter"
    const userMessage = logError({
      code: "NEWSLETTER_SEND_FAILED",
      userId: session?.user?.id,
      route: "/api/newsletter/send",
      method: "POST",
      error,
      metadata: {
        targetAudience: body?.targetAudience,
        testMode: body?.testMode,
        note: "Failed to send newsletter",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// GET endpoint to get subscriber statistics
export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user permissions and role from database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true, role: true },
    });

    // SUPER_ADMIN has all permissions, so bypass the check
    if (
      dbUser?.role !== "SUPER_ADMIN" &&
      !dbUser?.permissions?.includes("SEND_BROADCASTS")
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get subscriber statistics
    const [
      totalSubscribers,
      activeSubscribers,
      newSubscribers,
      recentSubscribers,
    ] = await Promise.all([
      db.newsletterSubscription.count(),
      db.newsletterSubscription.count({ where: { isActive: true } }),
      db.newsletterSubscription.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      db.newsletterSubscription.findMany({
        where: { isActive: true },
        select: { email: true, createdAt: true, source: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      statistics: {
        total: totalSubscribers,
        active: activeSubscribers,
        new: newSubscribers,
      },
      recentSubscribers,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Newsletter statistics error:", error);

    // Log to database - admin could email about "can't load newsletter statistics"
    const userMessage = logError({
      code: "NEWSLETTER_STATISTICS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/newsletter/send",
      method: "GET",
      error,
      metadata: {
        note: "Failed to get newsletter statistics",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
