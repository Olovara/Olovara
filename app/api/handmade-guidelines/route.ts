import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const guidelines = await db.handmadeGuidelines.findFirst();
  return NextResponse.json(guidelines || { content: { ops: [] } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { content } = await req.json();
  
  // First, try to find existing guidelines
  const existingGuidelines = await db.handmadeGuidelines.findFirst();
  
  if (existingGuidelines) {
    // Update existing guidelines
    const updatedGuidelines = await db.handmadeGuidelines.update({
      where: { id: existingGuidelines.id },
      data: { content }
    });
    return NextResponse.json(updatedGuidelines);
  } else {
    // Create new guidelines if none exist
    const newGuidelines = await db.handmadeGuidelines.create({
      data: { content }
    });
    return NextResponse.json(newGuidelines);
  }
}
