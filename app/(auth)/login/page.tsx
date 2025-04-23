import LoginForm from "@/components/auth/login-form";
import { Suspense } from "react";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center"></div>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
