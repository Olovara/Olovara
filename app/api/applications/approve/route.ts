import { approveApplication } from "@/actions/adminActions";

export async function POST(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logContext: Record<string, any> = {
    requestId,
    endpoint: '/api/applications/approve',
    timestamp: new Date().toISOString(),
  };

  try {
    console.log(`[API] Approval request received`, logContext);
    
    const { applicationId } = await req.json(); // Extract data from the request body

    if (!applicationId) {
      console.error(`[API] Missing applicationId`, { ...logContext, status: 400 });
      return new Response(
        JSON.stringify({ success: false, error: "Missing applicationId" }),
        { status: 400 }
      );
    }

    logContext.applicationId = applicationId;
    console.log(`[API] Processing approval request`, logContext);

    const result = await approveApplication(applicationId);

    if (result.success) {
      console.log(`[API] Approval request completed successfully`, { ...logContext, status: 200 });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      console.error(`[API] Approval request failed`, { 
        ...logContext, 
        error: result.error,
        status: 400 
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
      status: 500
    };
    
    console.error(`[API] Approval request exception`, errorDetails);
    
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}