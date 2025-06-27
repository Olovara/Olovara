import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ id: null, role: null, permissions: [] });
  }

  // Return the user ID, role and permissions to maintain compatibility with client-side code
  return NextResponse.json({ 
    id: session.user.id,
    role: session.user.role,
    permissions: session.user.permissions || []
  });
}
