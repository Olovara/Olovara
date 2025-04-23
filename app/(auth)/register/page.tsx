import RegisterForm from "@/components/auth/register-form";
import { Suspense } from "react";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center"></div>
      <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
      </Suspense>
    </div>
  );
}
