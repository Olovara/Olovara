import { rejectApplication } from "@/actions/adminActions";
import { logError } from "@/lib/error-logger";
import { auth } from "@/auth";

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    body = await req.json();
    const { applicationId, rejectionReason } = body;

    if (!applicationId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing applicationId" }),
        { status: 400 }
      );
    }

    const result = await rejectApplication(applicationId, rejectionReason);

    if (result.success) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 400 }
      );
    }
  } catch (error) {
    // Log to console (always happens)
    console.error(error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - admin could email about "couldn't reject application"
    const userMessage = logError({
      code: "APPLICATION_REJECT_FAILED",
      userId: session?.user?.id,
      route: "/api/applications/reject",
      method: "POST",
      error,
      metadata: {
        applicationId: body?.applicationId,
        rejectionReason: body?.rejectionReason,
        note: "Failed to reject application",
      },
    });

    return new Response(
      JSON.stringify({ success: false, error: userMessage }),
      { status: 500 }
    );
  }
}
