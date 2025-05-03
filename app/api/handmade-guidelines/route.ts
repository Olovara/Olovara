import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const guidelines = await db.handmadeGuidelines.findFirst();
  
  if (!guidelines) {
    return NextResponse.json({ content: { html: "", text: "" } });
  }

  let responseContent = { html: "", text: "" };

  // Check if the fetched content is usable
  if (guidelines.content && typeof guidelines.content === 'object' && guidelines.content !== null) {
    // Assume content is potentially an object like { html: any, text: any }
    let fetchedHtml = (guidelines.content as any).html;
    let fetchedText = (guidelines.content as any).text;

    // --- Attempt to fix double-stringified HTML ---
    if (typeof fetchedHtml === 'string') {
      try {
        // Check if it looks like the stringified JSON object
        if (fetchedHtml.trim().startsWith('{"html":')) {
          const parsed = JSON.parse(fetchedHtml);
          if (parsed && typeof parsed.html === 'string') {
            fetchedHtml = parsed.html; // Use the inner HTML
          }
        }
      } catch {
        // Ignore parsing error, keep fetchedHtml as is
      }
    }
    responseContent.html = typeof fetchedHtml === 'string' ? fetchedHtml : "";

    // --- Attempt to fix double-stringified Text ---
    if (typeof fetchedText === 'string') {
      try {
        // Check if it looks like the stringified JSON object
        if (fetchedText.trim().startsWith('{"html":')) {
          const parsed = JSON.parse(fetchedText);
          if (parsed && typeof parsed.text === 'string') {
            fetchedText = parsed.text;
          }
        }
      } catch {
        // Ignore parsing error, keep fetchedText as is
      }
    }
    responseContent.text = typeof fetchedText === 'string' ? fetchedText : "";

    // Ensure text content is derived from the *final* HTML content if text seems wrong/missing
    if (!responseContent.text && responseContent.html) {
      responseContent.text = responseContent.html.replace(/<[^>]*>?/gm, '');
    }
  } else if (typeof guidelines.content === 'string') {
    // Handle legacy case where content itself was just a string
    try {
      const parsed = JSON.parse(guidelines.content);
      if (parsed && typeof parsed.html === 'string') {
        responseContent.html = parsed.html;
        responseContent.text = parsed.text || parsed.html.replace(/<[^>]*>?/gm, '');
      } else {
        // If parsing fails or structure is wrong, treat original string as HTML
        responseContent.html = guidelines.content;
        responseContent.text = guidelines.content.replace(/<[^>]*>?/gm, '');
      }
    } catch {
      // If it's not JSON, treat the string as HTML
      responseContent.html = guidelines.content;
      responseContent.text = guidelines.content.replace(/<[^>]*>?/gm, '');
    }
  }

  return NextResponse.json({
    content: responseContent,
    updatedAt: guidelines.updatedAt
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { content } = await req.json();
  
  // Ensure content is in the correct format
  const formattedContent = {
    html: content.html || "",
    text: content.text || content.html?.replace(/<[^>]*>?/gm, '') || ""
  };
  
  // First, try to find existing guidelines
  const existingGuidelines = await db.handmadeGuidelines.findFirst();
  
  if (existingGuidelines) {
    // Update existing guidelines
    const updatedGuidelines = await db.handmadeGuidelines.update({
      where: { id: existingGuidelines.id },
      data: { content: formattedContent }
    });
    return NextResponse.json(updatedGuidelines);
  } else {
    // Create new guidelines if none exist
    const newGuidelines = await db.handmadeGuidelines.create({
      data: { content: formattedContent }
    });
    return NextResponse.json(newGuidelines);
  }
}
