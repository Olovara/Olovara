import { auth } from "@/auth";
import MessagesDashboard from "@/components/shared/MessagesDashboard";

export const metadata = {
  title: "Member - Messages",
};

export default async function MemberMessages() {
  const session = await auth();
  
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

  return <MessagesDashboard session={safeSession} userType="member" />;
}
