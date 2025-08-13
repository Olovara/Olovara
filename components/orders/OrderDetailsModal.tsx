"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
import { AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderDetailsModalProps {
  order: {
    id: string;
    buyerEmail: string;
    buyerName?: string | null;
    shopName: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    shippingCost?: number | null;
    discount?: number | null;
    isDigital: boolean;
    status: string;
    paymentStatus: string;
    shippingAddress?: any | null;
    batchNumber?: string | null;
    createdAt: Date;
  };
  isOpen: boolean;
  onClose: () => void;
  isSeller?: boolean;
}

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  isSeller = false,
}: OrderDetailsModalProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  // Format the shipping address if it exists
  const formatShippingAddress = (address: any) => {
    if (!address) return "N/A";
    
    try {
      // If it's a string, try to parse it as JSON
      const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
      
      return `${addressObj.line1 || ''}, ${addressObj.line2 || ''}, ${addressObj.city || ''}, ${addressObj.state || ''}, ${addressObj.postal_code || ''}, ${addressObj.country || ''}`;
    } catch (error) {
      return "Invalid address format";
    }
  };

  const handleCancelOrder = () => {
    setIsCancelDialogOpen(true);
  };

  const handleRefundOrder = () => {
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
        // Close the modal and refresh the page
        onClose();
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
        // Close the modal and refresh the page
        onClose();
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

  // Transform the purchase data to match the OrderDetailsModal interface
  const orderForModal = {
    id: order.id,
    buyerEmail: order.buyerEmail || "",
    buyerName: order.buyerName || null,
    shopName: order.shopName || "Unknown Seller",
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
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Order Details</DialogTitle>
            <DialogDescription>
              Order ID: {order.id}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Order Status Section */}
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-medium">Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={order.status === "PENDING" ? "outline" : "default"}>
                    {order.status}
                  </Badge>
                  <Badge variant={order.paymentStatus === "PAID" ? "default" : "destructive"}>
                    {order.paymentStatus}
                  </Badge>
                  <Badge variant={order.isDigital ? "secondary" : "outline"}>
                    {order.isDigital ? "Digital Product" : "Physical Product"}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              {/* Customer Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{order.buyerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{order.buyerName || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Product Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Shop Name</p>
                    <p className="font-medium">{order.shopName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Product Name</p>
                    <p className="font-medium">{order.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{order.quantity}</p>
                  </div>
                  {!order.isDigital && order.batchNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Batch Number</p>
                      <p className="font-medium font-mono text-sm">{order.batchNumber}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Shipping Information (if applicable) */}
              {!order.isDigital && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Shipping Information</h3>
                    <div>
                      <p className="text-sm text-muted-foreground">Shipping Address</p>
                      <p className="font-medium">{formatShippingAddress(order.shippingAddress)}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              
              {/* Payment Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="font-medium">${((order.totalAmount - (order.shippingCost || 0)) / 100).toFixed(2)}</p>
                  </div>
                  {!order.isDigital && (
                    <div>
                      <p className="text-sm text-muted-foreground">Shipping Cost</p>
                      <p className="font-medium">${((order.shippingCost || 0) / 100).toFixed(2)}</p>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Discount</p>
                      <p className="font-medium">-${(order.discount / 100).toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium">${(order.totalAmount / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Order Date */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Order Date</h3>
                <p>{format(new Date(order.createdAt), "PPP 'at' p")}</p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 sm:gap-0">
            {isSeller && canCancel && (
              <Button 
                variant="outline" 
                onClick={handleCancelOrder}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                Cancel Order
              </Button>
            )}
            {isSeller && canRefund && (
              <Button 
                variant="outline" 
                onClick={handleRefundOrder}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Refund Order
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      {isSeller && (
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
      )}

      {/* Refund Order Confirmation Dialog */}
      {isSeller && (
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
      )}
    </>
  );
} 