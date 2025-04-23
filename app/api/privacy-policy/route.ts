import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  const policy = await db.privacyPolicy.findFirst();
  return NextResponse.json(policy || { content: { ops: [] } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { content } = await req.json();
  
  // First, try to find existing guidelines
  const existingPolicy = await db.privacyPolicy.findFirst();
  
  if (existingPolicy) {
    // Update existing guidelines
    const updatedPolicy = await db.privacyPolicy.update({
      where: { id: existingPolicy.id },
      data: { content }
    });
    return NextResponse.json(updatedPolicy);
  } else {
    // Create new guidelines if none exist
    const newPolicy = await db.privacyPolicy.create({
      data: { content }
    });
    return NextResponse.json(newPolicy);
  }
}
