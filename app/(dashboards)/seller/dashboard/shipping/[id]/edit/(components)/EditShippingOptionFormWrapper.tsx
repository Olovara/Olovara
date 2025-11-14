"use client";

import { useRouter } from "next/navigation";
import ShippingOptionForm from "@/components/forms/ShippingOptionForm";

interface ShippingRate {
  id: string;
  type: "zone" | "country";
  zone?: string;
  countryCode?: string;
  price: number;
  additionalItem: number | null;
  isFreeShipping: boolean;
}

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
  defaultShipping?: number | null;
  defaultShippingCurrency?: string;
  sellerId: string;
  rates: ShippingRate[];
  createdAt: Date;
  updatedAt: Date;
}

interface EditShippingOptionFormWrapperProps {
  initialData: ShippingOption;
}

export default function EditShippingOptionFormWrapper({
  initialData,
}: EditShippingOptionFormWrapperProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // Navigate back to shipping page after successful update
    router.push("/seller/dashboard/shipping");
  };

  return (
    <ShippingOptionForm initialData={initialData} onSuccess={handleSuccess} />
  );
}
