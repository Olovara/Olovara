"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";

interface Purchase {
  id: string;
  userId: string | null;
  encryptedBuyerEmail: string;
  buyerEmailIV: string;
  encryptedBuyerName: string;
  buyerNameIV: string;
  encryptedShippingAddress: string | null;
  shippingAddressIV: string | null;
  sellerId: string;
  productId: string | null;
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
  product: {
    name: string;
    images: string[];
  } | null;
  seller?: {
    userId: string;
    shopName: string;
  } | null;
  shopName: string;
  // Decrypted fields (added by the order actions)
  buyerEmail?: string;
  buyerName?: string;
  shippingAddress?: any | null;
  batchNumber?: string | null;
}

export function PurchaseActions({
  purchase,
}: {
  purchase: Purchase;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!purchase) {
    return null;
  }

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  // Transform the purchase data to match the OrderDetailsModal interface
  const orderForModal = {
    id: purchase.id,
    buyerEmail: purchase.buyerEmail || "",
    buyerName: purchase.buyerName || null,
    shopName: purchase.shopName || "Unknown Seller",
    productName: purchase.productName,
    quantity: purchase.quantity,
    totalAmount: purchase.totalAmount,
    shippingCost: purchase.shippingCost,
    discount: purchase.discount,
    isDigital: purchase.isDigital,
    status: purchase.status,
    paymentStatus: purchase.paymentStatus,
    shippingAddress: purchase.shippingAddress,
    batchNumber: purchase.batchNumber,
    createdAt: purchase.createdAt,
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
        </DropdownMenuContent>
      </DropdownMenu>

      <OrderDetailsModal 
        order={orderForModal} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        isSeller={false}
      />
    </>
  );
} 