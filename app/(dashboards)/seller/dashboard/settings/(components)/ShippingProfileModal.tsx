"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import ShippingProfileForm from "@/components/forms/ShippingProfileForm";

export default function ShippingProfileModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Shipping Profile
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Shipping Profile</DialogTitle>
          </DialogHeader>
          <ShippingProfileForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
