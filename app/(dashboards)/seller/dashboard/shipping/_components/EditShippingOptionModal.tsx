"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface EditShippingOptionModalProps {
  option: ShippingOption;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditShippingOptionModal({
  option,
  isOpen,
  onClose,
}: EditShippingOptionModalProps) {
  const router = useRouter();

  const handleSuccess = () => {
    onClose();
    // Refresh the page to show the updated shipping option
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipping Option</DialogTitle>
        </DialogHeader>
        <ShippingOptionForm initialData={option} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
