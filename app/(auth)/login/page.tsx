import { AuthBackLink } from "@/components/auth/auth-back-link";
import LoginForm from "@/components/auth/login-form";
import Spinner from "@/components/spinner";
import { Suspense } from "react";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="flex w-full min-w-0 flex-col items-stretch justify-center">
      <AuthBackLink />
      <Suspense
        fallback={
          <div className="flex justify-center py-12" aria-busy="true">
            <Spinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
