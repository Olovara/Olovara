import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const guidelines = await db.handmadeGuidelines.findFirst();
  return NextResponse.json(guidelines || { content: { ops: [] } });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { content } = await req.json();
  const updatedGuidelines = await db.handmadeGuidelines.upsert({
    where: { id: "guidelines_id" },
    update: { content },
    create: { content },
  });

  return NextResponse.json(updatedGuidelines);
}
