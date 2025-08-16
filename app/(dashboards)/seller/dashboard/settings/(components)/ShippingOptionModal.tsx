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
import ShippingOptionForm from "@/components/forms/ShippingOptionForm";

export default function ShippingOptionModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Shipping Option
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Shipping Option</DialogTitle>
          </DialogHeader>
          <ShippingOptionForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
