import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, type } = body;

    if (!title || !description || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the user's role from the database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const suggestion = await db.suggestion.create({
      data: {
        title,
        description,
        userId: session.user.id,
        type,
        role: user.role,
      },
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("[SUGGESTIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 