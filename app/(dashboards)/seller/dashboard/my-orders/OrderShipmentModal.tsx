"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"] as const;

export function OrderShipmentModal({
  open,
  onOpenChange,
  orderId,
  initial,
  onSuccess,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string;
  initial?: {
    trackingNumber: string;
    carrier: string;
    shippingService: string;
    estimatedDeliveryDate: string;
  } | null;
  onSuccess?: () => void;
  /** ship = first mark shipped; edit = same modal for corrections */
  mode: "ship" | "edit";
}) {
  const [trackingNumber, setTracking] = useState(
    () => initial?.trackingNumber ?? "",
  );
  const [carrier, setCarrier] = useState(() => initial?.carrier ?? "USPS");
  const [shippingService, setService] = useState(
    () => initial?.shippingService ?? "",
  );
  const [eta, setEta] = useState(
    () => initial?.estimatedDeliveryDate ?? "",
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTracking(initial?.trackingNumber ?? "");
      setCarrier(initial?.carrier ?? "USPS");
      setService(initial?.shippingService ?? "");
      setEta(initial?.estimatedDeliveryDate ?? "");
    }
  }, [open, initial?.trackingNumber, initial?.carrier, initial?.shippingService, initial?.estimatedDeliveryDate]);

  const submit = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Enter a tracking number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "edit"
            ? {
                to: "SHIPPED",
                updateShipmentOnly: true,
                trackingNumber: trackingNumber.trim(),
                carrier,
                shippingService: shippingService.trim() || null,
                estimatedDeliveryDate: eta
                  ? new Date(eta).toISOString()
                  : null,
              }
            : {
                to: "SHIPPED",
                trackingNumber: trackingNumber.trim(),
                carrier,
                shippingService: shippingService.trim() || null,
                estimatedDeliveryDate: eta
                  ? new Date(eta).toISOString()
                  : null,
              },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not update shipment");
        return;
      }
      toast.success(
        mode === "edit" ? "Shipment details updated" : "Marked as shipped",
      );
      onOpenChange(false);
      onSuccess?.() ?? window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit tracking & carrier" : "Add shipment details"}
          </DialogTitle>
          <DialogDescription>
            Tracking links are built for USPS, UPS, FedEx, and DHL. Buyers are
            notified by email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="co-carrier">Carrier</Label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger id="co-carrier" className="w-full">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-tracking">Tracking number</Label>
            <Input
              id="co-tracking"
              value={trackingNumber}
              onChange={(e) => setTracking(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-service">Service (optional)</Label>
            <Input
              id="co-service"
              placeholder="e.g. Ground, Priority"
              value={shippingService}
              onChange={(e) => setService(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-eta">Estimated delivery (optional)</Label>
            <Input
              id="co-eta"
              type="date"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outlinePrimary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Saving…" : mode === "edit" ? "Save" : "Mark shipped"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
