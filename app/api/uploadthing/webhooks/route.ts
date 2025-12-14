import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/db"; // Your Prisma client
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// Define an interface matching Uploadthing's expected payload structure
// **Important:** Verify this structure against Uploadthing's documentation!
interface UploadthingFile {
  key: string; // This is the fileKey
  ufsUrl: string;
  name: string;
  size: number;
}

interface UploadthingWebhookPayloadData {
  file: UploadthingFile;
  metadata: Record<string, any> | null; // Adjust if you know the metadata structure
  // Add other fields Uploadthing might send
}

interface UploadthingWebhookPayload {
  event: string; // e.g., "upload.completed", "upload" - verify correct event name
  data: UploadthingWebhookPayloadData;
}

export async function POST(req: Request) {
  console.log("INFO: Uploadthing Webhook Received");

  // Declare variables outside try block so they're accessible in catch
  let payload: any = null;
  let evt: UploadthingWebhookPayload | null = null;

  const WEBHOOK_SECRET = process.env.UPLOADTHING_TOKEN;

  if (!WEBHOOK_SECRET) {
    console.error("ERROR: UPLOADTHING_SECRET environment variable not set");
    return new Response("Server configuration error: Webhook secret not set", {
      status: 500,
    });
  }

  // --- 1. Verify Signature ---
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error(
      "ERROR: Missing required Svix headers for webhook verification"
    );
    return new Response("Bad Request: Missing verification headers", {
      status: 400,
    });
  }

  try {
    payload = await req.json();
  } catch (e) {
    // Log to console (always happens)
    console.error("ERROR: Failed to parse webhook request body:", e);

    // Log to database - webhook parsing failures are system issues
    logError({
      code: "UPLOADTHING_WEBHOOK_PARSE_FAILED",
      userId: null,
      route: "/api/uploadthing/webhooks",
      method: "POST",
      error: e,
      metadata: {
        note: "Failed to parse UploadThing webhook JSON payload",
      },
    });

    return new Response("Bad Request: Invalid JSON payload", { status: 400 });
  }
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as UploadthingWebhookPayload; // Cast to your specific interface
    console.log("INFO: Webhook signature verified successfully");
  } catch (err) {
    // Log to console (always happens)
    console.error("ERROR: Webhook signature verification failed:", err);

    // Log to database - signature verification failures are security issues
    logError({
      code: "UPLOADTHING_WEBHOOK_VERIFICATION_FAILED",
      userId: null,
      route: "/api/uploadthing/webhooks",
      method: "POST",
      error: err,
      metadata: {
        note: "UploadThing webhook signature verification failed - possible security issue",
      },
    });

    return new Response("Unauthorized: Invalid signature", { status: 401 });
  }

  // --- 2. Process the Verified Event ---
  try {
    const { event, data } = evt;
    console.log(`INFO: Processing verified event type: ${event}`);
    console.log("DEBUG: Event data:", JSON.stringify(data, null, 2));

    // **Important:** Check Uploadthing docs for the exact event name for successful uploads
    const successEventName = "upload.completed"; // Or "upload", check UT docs!

    if (event === successEventName) {
      const fileKey = data?.file?.key;
      const fileUrl = data?.file?.ufsUrl;
      const userId = data?.metadata?.userId as string | undefined; // Extract userId

      if (!fileKey || !fileUrl) {
        console.error(
          "ERROR: Missing fileKey or fileUrl in webhook payload data.file"
        );
        return new Response("Bad Request: Payload missing required file data", {
          status: 400,
        });
      }

      if (!userId) {
        console.error(
          "ERROR: Missing userId in webhook metadata. Cannot create TemporaryUpload."
        );
        // You *must* have the userId to associate the upload correctly
        return new Response(
          "Bad Request: Payload missing required metadata (userId)",
          { status: 400 }
        );
      }

      console.log(
        `INFO: Extracted - File Key: ${fileKey}, File URL: ${fileUrl}, User ID: ${userId}`
      );

      try {
        // --- 3. Create TemporaryUpload Record (Idempotent Check) ---
        const existingRecord = await db.temporaryUpload.findFirst({
          where: {
            fileKey: fileKey,
            userId: userId,
          },
        });

        if (existingRecord) {
          console.warn(
            `WARN: TemporaryUpload record already exists for key: ${fileKey}. Ignoring duplicate webhook event.`
          );
          return new Response("Conflict: Record already exists", {
            status: 409,
          }); // Use 409 Conflict
        }

        const newTempUpload = await db.temporaryUpload.create({
          data: {
            fileKey: fileKey,
            fileUrl: fileUrl,
            userId: userId,
            // productId remains null initially
          },
        });
        console.log(
          "INFO: TemporaryUpload record created successfully:",
          newTempUpload.id
        );
      } catch (dbError) {
        // Log to console (always happens)
        console.error(
          "ERROR: Database error creating TemporaryUpload:",
          dbError
        );

        // Log to database - user could email about "upload completed but not recorded"
        const userMessage = logError({
          code: "UPLOADTHING_WEBHOOK_DB_FAILED",
          userId: userId,
          route: "/api/uploadthing/webhooks",
          method: "POST",
          error: dbError,
          metadata: {
            fileKey,
            fileUrl,
            event,
            note: "Failed to create TemporaryUpload record from webhook",
          },
        });

        // Consider specific error handling for duplicate keys if unique constraint fails unexpectedly
        return new Response(`Internal Server Error: ${userMessage}`, {
          status: 500,
        });
      }
    } else {
      console.log(`INFO: Ignoring event type: ${event}`);
    }

    // Always respond with 2xx to Uploadthing if processing is accepted (even if ignored)
    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    // Log to console (always happens)
    console.error(
      "ERROR: Unexpected error processing UploadThing webhook:",
      error
    );

    // Log to database - webhook processing failures are critical
    const userMessage = logError({
      code: "UPLOADTHING_WEBHOOK_PROCESSING_FAILED",
      userId: evt?.data?.metadata?.userId || null,
      route: "/api/uploadthing/webhooks",
      method: "POST",
      error,
      metadata: {
        event: evt?.event,
        fileKey: evt?.data?.file?.key,
        note: "Failed to process UploadThing webhook",
      },
    });

    // Still return 200 to UploadThing to prevent retries, but log the error
    return new Response("Webhook received but processing failed", {
      status: 200,
    });
  }
}

// Add GET handler for simple verification if needed
export async function GET() {
  return new Response("Uploadthing webhook endpoint is active.", {
    status: 200,
  });
}
