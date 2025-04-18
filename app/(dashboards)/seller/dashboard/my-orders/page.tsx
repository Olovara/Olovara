import { getSellerOrders } from "@/actions/orders";
import { auth } from "@/auth"; // Adjust to your auth file path
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderActions } from "./OrderActions";
import Link from "next/link";

export const metadata = {
  title: "Seller - My Orders",
};

export default async function SellerMyOrders() {
  const session = await auth(); // Get session
  const userId = session?.user?.id; // Extract userId from session
  const userRole = session?.user?.role; // Extract user role from session

  if (!userId) {
    return <p>You must be logged in to view this page.</p>; // Simple fallback for unauthenticated users
  }

  if (userRole !== "SELLER") {
    return <p>You must be a seller to view this page.</p>; // Simple fallback for unauthorized users
  }

  const orders = await getSellerOrders(userId); // Fetch seller orders dynamically

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header and breadcrumbs */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/seller/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/seller/dashboard/orders">My Orders</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content */}
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Manage your orders and track their statuses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.buyerName || 'Anonymous'}</span>
                          <span className="text-sm text-muted-foreground">{order.buyerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                      ${(order.totalAmount ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <OrderActions order={order} />
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