"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Ellipsis, AlertTriangle } from "lucide-react";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  userId: string | null;
  encryptedBuyerEmail: string;
  buyerEmailIV: string;
  encryptedBuyerName: string;
  buyerNameIV: string;
  encryptedShippingAddress: string | null;
  shippingAddressIV: string | null;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  shippingCost: number | null;
  discount: any;
  isDigital: boolean;
  status: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
  shopName: string;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  seller: {
    id: string;
    userId: string;
    shopName: string;
  };
  // Decrypted fields (added by the order actions)
  buyerEmail?: string;
  buyerName?: string;
  shippingAddress?: any | null;
}

export function OrderActions({
  order,
}: {
  order: Order;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  if (!order) {
    return null;
  }

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleCancelOrder = async () => {
    setIsCancelDialogOpen(true);
  };

  const handleRefundOrder = async () => {
    setIsRefundDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    try {
      setLoading(true);
      // Use fetch to call the server action
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || "Failed to cancel order");
      } else {
        toast.success(result.success || "Order cancelled successfully");
        // Refresh the page to show updated order status
        window.location.reload();
      }
    } catch (error) {
      toast.error("An error occurred while cancelling the order");
    } finally {
      setLoading(false);
      setIsCancelDialogOpen(false);
    }
  };

  const confirmRefundOrder = async () => {
    try {
      setLoading(true);
      // Use fetch to call the server action
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || "Failed to refund order");
      } else {
        toast.success(result.success || "Order refunded successfully");
        // Refresh the page to show updated order status
        window.location.reload();
      }
    } catch (error) {
      toast.error("An error occurred while refunding the order");
    } finally {
      setLoading(false);
      setIsRefundDialogOpen(false);
    }
  };

  // Determine if refund is available based on order status
  const canRefund = order.paymentStatus === "PAID" && 
                    order.status !== "REFUNDED" && 
                    order.status !== "CANCELLED";

  // Determine if cancel is available based on order status
  const canCancel = order.status !== "CANCELLED" && 
                    order.status !== "COMPLETED" && 
                    order.status !== "REFUNDED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <Ellipsis className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            View Details
          </DropdownMenuItem>
          {canCancel && (
            <DropdownMenuItem onClick={handleCancelOrder}>
              Cancel Order
            </DropdownMenuItem>
          )}
          {canRefund && (
            <DropdownMenuItem onClick={handleRefundOrder}>
              Refund Order
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <OrderDetailsModal 
        order={{
          id: order.id,
          buyerEmail: order.buyerEmail || "",
          buyerName: order.buyerName || null,
          shopName: order.seller.shopName,
          productName: order.productName,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          shippingCost: order.shippingCost,
          discount: order.discount,
          isDigital: order.isDigital,
          status: order.status,
          paymentStatus: order.paymentStatus,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        }} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelOrder} 
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {loading ? "Processing..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Order Confirmation Dialog */}
      <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Refund Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this order? This will process a refund of ${order.totalAmount.toFixed(2)} to the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRefundOrder} 
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Processing..." : "Yes, Refund Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}