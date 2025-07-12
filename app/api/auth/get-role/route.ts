import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ id: null, role: null, permissions: [] });
  }

  // Fetch role and permissions from the database
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, permissions: true }
  });

  return NextResponse.json({ 
    id: session.user.id,
    role: dbUser?.role || null,
    permissions: dbUser?.permissions || []
  });
}
