import { auth } from "@/auth";
import MessagesDashboard from "@/components/shared/MessagesDashboard";

export default async function MessagesPage() {
  const session = await auth();
  console.log("Server-side session:", session);
  
  // Ensure we only pass the necessary session data to the client
  const safeSession = session ? {
    user: {
      id: session.user?.id,
      name: session.user?.name || null,
      email: session.user?.email || null,
      role: session.user?.role || null,
    },
    expires: session.expires
  } : null;

  console.log("Safe session being passed to client:", safeSession);

  return <MessagesDashboard session={safeSession} userType="seller" />;
}
  