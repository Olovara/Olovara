"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ShippingProfileForm from "@/components/forms/ShippingProfileForm";

interface ShippingRate {
  id: string;
  zone: string;
  isInternational: boolean;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem: number | null;
  serviceLevel: string | null;
  isFreeShipping: boolean;
}

interface ShippingProfile {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
  sellerId: string;
  rates: ShippingRate[];
  createdAt: Date;
  updatedAt: Date;
}

interface EditShippingProfileModalProps {
  profile: ShippingProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditShippingProfileModal({
  profile,
  isOpen,
  onClose,
}: EditShippingProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipping Profile</DialogTitle>
        </DialogHeader>
        <ShippingProfileForm 
          initialData={profile} 
          onSuccess={onClose} 
        />
      </DialogContent>
    </Dialog>
  );
} 