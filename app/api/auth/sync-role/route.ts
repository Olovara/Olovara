import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the current user from database
        const dbUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { 
                role: true,
                seller: {
                    select: {
                        id: true,
                        applicationAccepted: true
                    }
                }
            }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Log the current state
        console.log("Role sync check:", {
            sessionRole: session.user.role,
            dbRole: dbUser.role,
            userId: session.user.id
        });

        // If roles don't match, update the session
        if (dbUser.role !== session.user.role) {
            // Update the session with the database role
            session.user.role = dbUser.role;
            
            console.log("Role synchronized:", {
                oldRole: session.user.role,
                newRole: dbUser.role,
                userId: session.user.id
            });
        }

        return NextResponse.json({ 
            success: true,
            role: dbUser.role,
            hasSellerProfile: !!dbUser.seller,
            sellerApplicationAccepted: dbUser.seller?.applicationAccepted
        });
    } catch (error) {
        console.error("Role sync error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 