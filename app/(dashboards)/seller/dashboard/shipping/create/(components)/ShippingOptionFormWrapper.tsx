"use client";

import { useRouter } from "next/navigation";
import ShippingOptionForm from "@/components/forms/ShippingOptionForm";

export default function ShippingOptionFormWrapper() {
  const router = useRouter();

  const handleSuccess = () => {
    // Navigate back to shipping page after successful creation
    router.push("/seller/dashboard/shipping");
  };

  return <ShippingOptionForm onSuccess={handleSuccess} />;
}

