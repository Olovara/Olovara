"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Order {
  buyerEmail: string;
  quantity: number,
  totalAmount: number,
  shippingCost: number,
  discount: number,
  isDigital: boolean,
  status: string,
  paymentStatus: string,
  shippingAddress: string,
}

export function OrderActions({
  order,
}: {
  order: Order;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!order) {
    return null; // Ensure we don't render if `application` is undefined
  }

  const [loading, setLoading] = useState(false); // State for loading
  const [error, setError] = useState<string | null>(null); // State for error message
  const [success, setSuccess] = useState<boolean | null>(null); // State for success message

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Information</DialogTitle>
          <DialogDescription>
            Detailed information about your order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <strong>Buyer Email:</strong> {order.buyerEmail || "N/A"}
          </div>
          <div>
            <strong>Quantity:</strong> {order.quantity || "N/A"}
          </div>
          <div>
            <strong>Order Total:</strong>{" "}
            {order.totalAmount || "N/A"}
          </div>
          <div>
            <strong>Shipping Cost:</strong> {order.shippingCost || "N/A"}
          </div>
          <div>
            <strong>Product Type:</strong> {order.isDigital || "N/A"}
          </div>
          <div>
            <strong>Payment Status:</strong> {order.paymentStatus || "N/A"}
          </div>
          <div>
            <strong>Shipping Address:</strong> {order.shippingAddress || "N/A"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
