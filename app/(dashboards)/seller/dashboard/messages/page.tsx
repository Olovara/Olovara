import { auth } from "@/auth";
import MessagesDashboard from "@/components/shared/MessagesDashboard";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function MessagesPage() {
  const session = await auth();
  console.log("Server-side session:", session);
  
  // Redirect if not authenticated or no user ID
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user role from database
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  // Ensure we only pass the necessary session data to the client
  const safeSession = {
    user: {
      id: session.user.id, // Now guaranteed to be a string
      name: session.user.name || null,
      email: session.user.email || null,
      role: dbUser?.role || null,
    },
    expires: session.expires
  };

  console.log("Safe session being passed to client:", safeSession);

  return <MessagesDashboard session={safeSession} userType="seller" />;
}
  