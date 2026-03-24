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
    orderInstructions?: string | null; // Order instructions from buyer
    createdAt: Date;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl border-brand-dark-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-brand-primary-900">
              Order Details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-brand-dark-neutral-600 sm:text-sm">
              Order ID: {order.id}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Order Status Section */}
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold text-brand-primary-800">Order Status</h3>
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
                <h3 className="text-lg font-semibold text-brand-primary-800">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Email</p>
                    <p className="font-medium">{order.buyerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Name</p>
                    <p className="font-medium">{order.buyerName || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Product Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-brand-primary-800">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Shop Name</p>
                    <p className="font-medium">{order.shopName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Product Name</p>
                    <p className="font-medium">{order.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Quantity</p>
                    <p className="font-medium">{order.quantity}</p>
                  </div>
                  {!order.isDigital && order.batchNumber && (
                    <div>
                      <p className="text-sm text-brand-dark-neutral-600">Batch Number</p>
                      <p className="font-medium font-mono text-sm">{order.batchNumber}</p>
                      <p className="mt-1 text-xs text-brand-warn-700">
                        Include this batch number on a card or tag with the product to fulfill GPSR requirements
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Shipping Information (if applicable) */}
              {!order.isDigital && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-brand-primary-800">Shipping Information</h3>
                    <div>
                      <p className="text-sm text-brand-dark-neutral-600">Shipping Address</p>
                      <p className="font-medium">{formatShippingAddress(order.shippingAddress)}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              
              {/* Order Instructions (if provided) */}
              {order.orderInstructions && order.orderInstructions.trim() && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-brand-primary-800">Order Instructions / Personalization</h3>
                    <div className="rounded-lg border border-brand-primary-200 bg-brand-primary-50 p-4">
                      <p className="whitespace-pre-wrap text-sm text-brand-primary-950">
                        {order.orderInstructions}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              
              {/* Payment Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-brand-primary-800">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Subtotal</p>
                    <p className="font-medium">${((order.totalAmount - (order.shippingCost || 0)) / 100).toFixed(2)}</p>
                  </div>
                  {!order.isDigital && (
                    <div>
                      <p className="text-sm text-brand-dark-neutral-600">Shipping Cost</p>
                      <p className="font-medium">${((order.shippingCost || 0) / 100).toFixed(2)}</p>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div>
                      <p className="text-sm text-brand-dark-neutral-600">Discount</p>
                      <p className="font-medium">-${(order.discount / 100).toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-brand-dark-neutral-600">Total Amount</p>
                    <p className="font-medium">${(order.totalAmount / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Order Date */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-brand-primary-800">Order Date</h3>
                <p>{format(new Date(order.createdAt), "PPP 'at' p")}</p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 sm:gap-0">
            {canCancel && (
              <Button 
                variant="outline" 
                onClick={handleCancelOrder}
                className="border-brand-warn-500 text-brand-warn-800 hover:bg-brand-warn-50"
              >
                Cancel Order
              </Button>
            )}
            {canRefund && (
              <Button 
                variant="outline" 
                onClick={handleRefundOrder}
                className="border-brand-error-500 text-brand-error-700 hover:bg-brand-error-50"
              >
                Refund Order
              </Button>
            )}
            <Button
              onClick={onClose}
              className="bg-brand-primary-700 text-white hover:bg-brand-primary-600"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-brand-warn-600" />
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
              className="bg-brand-warn-500 text-brand-warn-950 hover:bg-brand-warn-600"
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
              <AlertTriangle className="h-5 w-5 text-brand-error-600" />
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
              className="bg-brand-error-600 text-white hover:bg-brand-error-700"
            >
              {loading ? "Processing..." : "Yes, Refund Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 