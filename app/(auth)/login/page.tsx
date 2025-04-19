import LoginForm from "@/components/auth/login-form";
import { Suspense } from "react";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  <Suspense fallback={<div>Loading...</div>}>
    return <LoginForm />;
  </Suspense>;
}
