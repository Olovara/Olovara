import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { Permission, PERMISSIONS } from "@/data/roles-and-permissions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ hasPermission: false }, { status: 401 });
    }

    const permission = req.nextUrl.searchParams.get("permission") as Permission;

    if (!permission || !Object.values(PERMISSIONS).includes(permission)) {
      return NextResponse.json(
        { error: "Invalid permission parameter" },
        { status: 400 }
      );
    }

    const userHasPermission = await hasPermission(session.user.id, permission);

    return NextResponse.json({ hasPermission: userHasPermission });
  } catch (error) {
    console.error("Error checking permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 