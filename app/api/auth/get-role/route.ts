import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ role: null, permissions: [] });
  }

  // Return the role and permissions to maintain compatibility with client-side code
  return NextResponse.json({ 
    role: session.user.role,
    permissions: session.user.permissions || []
  });
}
