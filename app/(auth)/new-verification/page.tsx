import NewVerificationForm from "@/components/auth/new-verification-form";
import { Suspense } from "react";

export const metadata = {
  title: "Verification",
};

export default function NewVerificationPage() {
  <Suspense fallback={<div>Loading...</div>}>
    return <NewVerificationForm />;
  </Suspense>;
}
