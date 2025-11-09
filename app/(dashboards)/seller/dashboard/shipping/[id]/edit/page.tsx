"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ShippingOptionFormWrapper from "./(components)/EditShippingOptionFormWrapper";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

export default function EditShippingOptionPage() {
  const params = useParams();
  const [shippingOption, setShippingOption] = useState<ShippingOption | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShippingOption = async () => {
      try {
        const response = await fetch(`/api/shipping-options/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Shipping option not found");
          } else if (response.status === 401) {
            setError("You need to be logged in to edit this shipping option");
          } else {
            setError("Failed to fetch shipping option");
          }
          return;
        }

        const data = await response.json();
        setShippingOption(data);
      } catch (error) {
        console.error("Error fetching shipping option:", error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchShippingOption();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-red-500">
        {error}
      </div>
    );
  }

  if (!shippingOption) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        Shipping option not found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/seller/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/seller/dashboard/shipping">
              Shipping
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/seller/dashboard/shipping/${params.id}/edit`}
            >
              Edit
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div>
          <h3 className="text-lg font-medium">Edit Shipping Option</h3>
          <p className="text-sm text-muted-foreground">
            Update your shipping rates and delivery options.
          </p>
        </div>
        <ShippingOptionFormWrapper initialData={shippingOption} />
      </div>
    </div>
  );
}
