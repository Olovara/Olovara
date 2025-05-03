import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const guidelines = await db.handmadeGuidelines.findFirst();
  
  // If no guidelines exist, return empty content
  if (!guidelines) {
    return NextResponse.json({ content: { html: "", text: "" } });
  }

  // If content is a string, try to parse it as JSON
  if (typeof guidelines.content === 'string') {
    try {
      const parsed = JSON.parse(guidelines.content);
      return NextResponse.json({ content: parsed });
    } catch {
      // If parsing fails, return as plain text
      return NextResponse.json({ content: { html: guidelines.content, text: guidelines.content } });
    }
  }

  // If content is already an object, return as is
  return NextResponse.json(guidelines);
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
