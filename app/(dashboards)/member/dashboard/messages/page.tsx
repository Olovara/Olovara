import { auth } from "@/auth";
import MessagesDashboard from "@/components/shared/MessagesDashboard";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata = {
  title: "Member - Messages",
};

export default async function MemberMessages() {
  const session = await auth();
  
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

  return <MessagesDashboard session={safeSession} userType="member" />;
}
