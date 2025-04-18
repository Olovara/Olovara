"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Ellipsis, AlertTriangle } from "lucide-react";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
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

interface Purchase {
  id: string;
  userId: string | null;
  buyerEmail: string;
  buyerName: string | null;
  sellerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  shippingCost: number | null;
  discount: number | null;
  isDigital: boolean;
  status: string;
  paymentStatus: string;
  shippingAddress: any | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    images: string[];
  };
  seller: {
    id: string;
    userId: string;
    shopName: string;
    // Add other seller properties as needed
  };
}

export function PurchaseActions({
  purchase,
}: {
  purchase: Purchase;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!purchase) {
    return null;
  }

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleCancelPurchase = async () => {
    setIsCancelDialogOpen(true);
  };

  const confirmCancelPurchase = async () => {
    try {
      setLoading(true);
      // Use fetch to call the server action
      const response = await fetch(`/api/orders/${purchase.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || "Failed to cancel purchase");
      } else {
        toast.success(result.success || "Purchase cancelled successfully");
        // Refresh the page to show updated purchase status
        window.location.reload();
      }
    } catch (error) {
      toast.error("An error occurred while cancelling the purchase");
    } finally {
      setLoading(false);
      setIsCancelDialogOpen(false);
    }
  };

  // Determine if cancel is available based on purchase status
  const canCancel = purchase.status !== "CANCELLED" && 
                    purchase.status !== "COMPLETED" && 
                    purchase.status !== "REFUNDED";

  // Transform the purchase data to match the OrderDetailsModal interface
  const orderForModal = {
    ...purchase,
    product: {
      id: purchase.productId,
      name: purchase.productName,
      images: purchase.product?.images || [], // Use product from the purchase if available
    },
    seller: {
      id: purchase.sellerId,
      name: purchase.seller?.shopName || "Unknown Seller", // Use shopName from the seller
    },
    buyer: purchase.buyerName ? {
      id: purchase.userId || "",
      name: purchase.buyerName,
      email: purchase.buyerEmail,
    } : undefined,
  };

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
            <DropdownMenuItem onClick={handleCancelPurchase}>
              Cancel Purchase
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <OrderDetailsModal 
        order={orderForModal} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Cancel Purchase Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Cancel Purchase
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this purchase? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancelPurchase} 
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {loading ? "Processing..." : "Yes, Cancel Purchase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 