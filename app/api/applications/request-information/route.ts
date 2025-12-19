import { requestApplicationInformation } from "@/actions/adminActions";
import { logError } from "@/lib/error-logger";
import { auth } from "@/auth";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logContext: Record<string, any> = {
    requestId,
    endpoint: "/api/applications/request-information",
    timestamp: new Date().toISOString(),
  };

  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    console.log(`[API] Information request received`, logContext);
    session = await auth();
    body = await req.json();
    const { applicationId, requestMessage } = body;

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

    if (!requestMessage || requestMessage.trim().length === 0) {
      console.error(`[API] Missing or empty requestMessage`, {
        ...logContext,
        status: 400,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Request message cannot be empty",
        }),
        { status: 400 }
      );
    }

    logContext.applicationId = applicationId;
    console.log(`[API] Processing information request`, logContext);

    const result = await requestApplicationInformation(
      applicationId,
      requestMessage
    );

    if (result.success) {
      console.log(`[API] Information request completed successfully`, {
        ...logContext,
        status: 200,
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      console.error(`[API] Information request failed`, {
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

    console.error(`[API] Information request exception`, errorDetails);

    // Log to database - admin could email about "couldn't send information request"
    const userMessage = logError({
      code: "APPLICATION_REQUEST_INFO_FAILED",
      userId: session?.user?.id,
      route: "/api/applications/request-information",
      method: "POST",
      error,
      metadata: {
        applicationId: body?.applicationId,
        requestMessageLength: body?.requestMessage?.length,
        note: "Failed to send information request email",
      },
    });

    return new Response(
      JSON.stringify({ success: false, error: userMessage }),
      { status: 500 }
    );
  }
}
