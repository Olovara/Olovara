import { rejectApplication } from "@/actions/adminActions";

export async function POST(req: Request) {
  try {
    const { applicationId, rejectionReason } = await req.json(); // Extract data from the request body

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
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}