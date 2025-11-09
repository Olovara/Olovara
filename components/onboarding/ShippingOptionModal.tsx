"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import ShippingOptionForm from "@/components/forms/ShippingOptionForm";
import { toast } from "sonner";

interface ShippingOptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (shippingOptionId?: string) => void;
}

export default function ShippingOptionModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: ShippingOptionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = (shippingOptionId?: string) => {
    toast.success("Shipping option created successfully!");
    onOpenChange(false);
    onSuccess?.(shippingOptionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Create Your First Shipping Option
          </DialogTitle>
          <DialogDescription>
            Set up shipping rates for your products. This will help customers
            know how much shipping will cost.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <ShippingOptionForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
