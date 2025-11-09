"use client";

import { useRouter } from "next/navigation";
import ShippingOptionForm from "@/components/forms/ShippingOptionForm";

interface CountryRate {
  countryCode: string;
  price: number;
  currency: string;
}

interface ShippingRate {
  id: string;
  zone: string;
  isInternational: boolean;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem: number | null;
  isFreeShipping: boolean;
  countryRates: CountryRate[];
}

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
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
