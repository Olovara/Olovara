import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PurchaseActions } from "../../../../../actions/PurchaseActions";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getBuyerOrders } from "@/actions/orders";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { OrderStatus, PaymentStatus } from "@prisma/client";

interface Purchase {
  id: string;
  userId: string;
  sellerId: string;
  shopName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  productPrice: number;
  shippingCost: number;
  stripeFee: number;
  isDigital: boolean;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stripeSessionId: string;
  stripeTransferId: string | null;
  encryptedBuyerEmail: string;
  buyerEmailIV: string;
  encryptedBuyerName: string;
  buyerNameIV: string;
  encryptedShippingAddress: string;
  shippingAddressIV: string;
  discount: any | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    name: string;
    images: string[];
  };
  buyerEmail?: string;
  buyerName?: string;
  shippingAddress?: any | null;
}

export const metadata = {
  title: "Member - My Purchases",
};

export default async function MyPurchasesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  console.log("[DEBUG] Current user ID:", session.user.id);
  const purchases = await getBuyerOrders(session.user.id);
  console.log("[DEBUG] Found purchases:", purchases);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "PROCESSING":
        return "bg-blue-500";
      case "SHIPPED":
        return "bg-purple-500";
      case "DELIVERED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      case "REFUNDED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header and breadcrumbs */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/member/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/member/dashboard/my-purchases">My Purchases</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content */}
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>My Purchases</CardTitle>
            <CardDescription>
              View and manage your purchase history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">You haven&apos;t made any purchases yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.id.substring(0, 8)}...</TableCell>
                      <TableCell>{purchase.product.name}</TableCell>
                      <TableCell>{purchase.shopName || "Unknown Seller"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(purchase.status)}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatPrice(
                          purchase.totalAmount,
                          { isCents: true }
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <PurchaseActions purchase={purchase} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
