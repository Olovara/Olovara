"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipping Option</DialogTitle>
        </DialogHeader>
        <ShippingOptionForm initialData={option} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}
