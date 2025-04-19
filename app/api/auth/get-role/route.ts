import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ role: null });
  }

  // Return the role as a string to maintain compatibility with client-side code
  return NextResponse.json({ role: session.user.role });
}
