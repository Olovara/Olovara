import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Tag, Calendar, DollarSign } from "lucide-react";
import DiscountCodeManager from "@/components/seller/DiscountCodeManager";
import ProductSalesManager from "@/components/seller/ProductSalesManager";
import { db } from "@/lib/db";

// Helper function to calculate sale statistics
async function getSaleStatistics(sellerId: string) {
  const products = await db.product.findMany({
    where: { userId: sellerId },
    select: {
      id: true,
      price: true,
      onSale: true,
      discount: true,
      saleStartDate: true,
      saleEndDate: true,
      saleStartTime: true,
      saleEndTime: true,
      numberSold: true,
    },
  });

  const discountCodes = await db.discountCode.findMany({
    where: { sellerId },
    select: {
      id: true,
      isActive: true,
      expiresAt: true,
      currentUses: true,
    },
  });

  const now = new Date();

  // Helper function to check if sale is currently active (checks both date AND time)
  const isSaleActive = (product: any) => {
    if (!product.onSale) return false;

    // Check sale start date/time
    if (product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(":").map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) return false;
    }

    // Check sale end date/time
    if (product.saleEndDate) {
      const saleEnd = new Date(product.saleEndDate);
      if (product.saleEndTime) {
        const [hours, minutes] = product.saleEndTime.split(":").map(Number);
        saleEnd.setHours(hours, minutes, 0, 0);
      }
      if (now > saleEnd) return false;
    }

    return true;
  };

  // Helper function to check if sale is scheduled (hasn't started yet)
  const isSaleScheduled = (product: any) => {
    if (!product.onSale) return false;

    if (product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(":").map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      return now < saleStart;
    }

    return false;
  };

  // Calculate active sales
  const activeSales = products.filter((product) => isSaleActive(product));

  // Calculate scheduled sales
  const scheduledSales = products.filter((product) => isSaleScheduled(product));

  // Calculate active discount codes
  const activeDiscountCodes = discountCodes.filter(
    (code) =>
      code.isActive && (!code.expiresAt || new Date(code.expiresAt) > now)
  );

  // Calculate revenue from sales (simplified - you might want to get this from orders)
  const revenueFromSales = activeSales.reduce((total, product) => {
    if (product.discount && product.numberSold > 0) {
      const discountAmount = (product.price * product.discount) / 100;
      const salePrice = product.price - discountAmount;
      return total + salePrice * product.numberSold;
    }
    return total;
  }, 0);

  return {
    activeSales: activeSales.length,
    discountCodes: activeDiscountCodes.length,
    scheduledSales: scheduledSales.length,
    revenueFromSales: revenueFromSales / 100, // Convert from cents to dollars
  };
}

export default async function SalesPromotionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch real statistics
  const stats = await getSaleStatistics(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales & Promotions</h1>
          <p className="text-muted-foreground">
            Manage your product sales and discount codes to boost your business
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Sales
                </p>
                <p className="text-2xl font-bold">{stats.activeSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Discount Codes
                </p>
                <p className="text-2xl font-bold">{stats.discountCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Scheduled Sales
                </p>
                <p className="text-2xl font-bold">{stats.scheduledSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue from Sales
                </p>
                <p className="text-2xl font-bold">
                  ${stats.revenueFromSales.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Product Sales
          </TabsTrigger>
          <TabsTrigger value="codes" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Discount Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <Suspense fallback={<div>Loading product sales...</div>}>
            <ProductSalesManager sellerId={session.user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="codes" className="space-y-6">
          <Suspense fallback={<div>Loading discount codes...</div>}>
            <DiscountCodeManager sellerId={session.user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Quick Actions (hidden for now) TODO: Unhide when its functionality is required */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you manage your promotions efficiently
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Plus className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Create Flash Sale</p>
              <p className="text-sm text-muted-foreground">Quick 24-hour sale</p>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Tag className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Generate Code</p>
              <p className="text-sm text-muted-foreground">New discount code</p>
            </div>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Calendar className="h-6 w-6" />
            <div className="text-center">
              <p className="font-medium">Schedule Sale</p>
              <p className="text-sm text-muted-foreground">Future promotion</p>
            </div>
          </Button>
        </CardContent>
      </Card>
      */}

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Tips</CardTitle>
          <CardDescription>
            Best practices to maximize your sales and customer engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Product Sales</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use clear, compelling sale descriptions</li>
                <li>• Set realistic time limits to create urgency</li>
                <li>• Monitor inventory during sales</li>
                <li>• Plan sales around holidays and seasons</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Discount Codes</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create memorable, easy-to-remember codes</li>
                <li>• Set usage limits to control costs</li>
                <li>• Use minimum order amounts strategically</li>
                <li>• Track performance and adjust accordingly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
