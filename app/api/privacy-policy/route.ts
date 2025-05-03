import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const policy = await db.privacyPolicy.findFirst();
  
  // If no policy exists, return empty content
  if (!policy) {
    return NextResponse.json({ content: { html: "", text: "" } });
  }

  // If content is a string, try to parse it as JSON
  if (typeof policy.content === 'string') {
    try {
      const parsed = JSON.parse(policy.content);
      return NextResponse.json({ content: parsed });
    } catch {
      // If parsing fails, return as plain text
      return NextResponse.json({ content: { html: policy.content, text: policy.content } });
    }
  }

  // If content is already an object, return as is
  return NextResponse.json(policy);
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
  
  // First, try to find existing policy
  const existingPolicy = await db.privacyPolicy.findFirst();
  
  if (existingPolicy) {
    // Update existing policy
    const updatedPolicy = await db.privacyPolicy.update({
      where: { id: existingPolicy.id },
      data: { content: formattedContent }
    });
    return NextResponse.json(updatedPolicy);
  } else {
    // Create new policy if none exist
    const newPolicy = await db.privacyPolicy.create({
      data: { content: formattedContent }
    });
    return NextResponse.json(newPolicy);
  }
}
