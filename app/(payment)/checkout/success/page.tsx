import { auth } from "@/auth";
import CheckoutSuccessClient from "./CheckoutSuccessClient";

export default async function CheckoutSuccessPage() {
  const session = await auth();
  const userRole = session?.user?.role || "MEMBER";
  
  return <CheckoutSuccessClient userRole={userRole} />;
} 