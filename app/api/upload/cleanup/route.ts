import { auth } from "@/auth";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response("No images to cleanup", { status: 200 });
    }

    console.log('Cleaning up images:', images);

    // Extract file keys from the URLs
    const fileKeys = images
      .map((url: string) => {
        try {
          // Extract the file key from the uploadthing URL
          const matches = url.match(/\/uploadthing\/.*\/(.*?)$/);
          return matches ? matches[1] : null;
        } catch (e) {
          console.error("Invalid URL:", url);
          return null;
        }
      })
      .filter((key): key is string => Boolean(key));

    if (fileKeys.length > 0) {
      console.log('Deleting files with keys:', fileKeys);
      
      try {
        await utapi.deleteFiles(fileKeys);
        console.log('Files deleted successfully');
      } catch (error) {
        console.error("Error deleting files:", error);
        // Continue execution even if deletion fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Files deleted successfully",
      deletedKeys: fileKeys 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error cleaning up files:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
