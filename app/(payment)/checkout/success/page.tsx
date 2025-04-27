import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CheckoutSuccessClient from "./CheckoutSuccessClient";

export default async function CheckoutSuccessPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return <CheckoutSuccessClient userRole={session.user.role} />;
} 