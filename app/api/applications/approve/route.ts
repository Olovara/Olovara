import { approveApplication } from "@/actions/adminActions";
import { logError } from "@/lib/error-logger";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logContext: Record<string, any> = {
    requestId,
    endpoint: "/api/applications/approve",
    timestamp: new Date().toISOString(),
  };

  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    console.log(`[API] Approval request received`, logContext);
    session = await auth();
    body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      console.error(`[API] Missing applicationId`, {
        ...logContext,
        status: 400,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Missing applicationId" }),
        { status: 400 }
      );
    }

    logContext.applicationId = applicationId;
    console.log(`[API] Processing approval request`, logContext);

    const result = await approveApplication(applicationId);

    if (result.success) {
      console.log(`[API] Approval request completed successfully`, {
        ...logContext,
        status: 200,
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      console.error(`[API] Approval request failed`, {
        ...logContext,
        error: result.error,
        status: 400,
      });
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 400 }
      );
    }
  } catch (error) {
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      status: 500,
    };

    console.error(`[API] Approval request exception`, errorDetails);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't approve application"
    const userMessage = logError({
      code: "APPLICATION_APPROVE_FAILED",
      userId: session?.user?.id,
      route: "/api/applications/approve",
      method: "POST",
      error,
      metadata: {
        applicationId: body?.applicationId,
        note: "Failed to approve application",
      },
    });

    return new Response(
      JSON.stringify({ success: false, error: userMessage }),
      { status: 500 }
    );
  }
}
