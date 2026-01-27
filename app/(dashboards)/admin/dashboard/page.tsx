import { getDashboardStats, getRecentActivity } from "@/actions/adminActions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  PackagePlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  Eye
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin - Dashboard",
};

export default async function AdminDashboardHome() {
  // Server-side auth check - this is the REAL security layer
  // Middleware just prevents redirect loops, but this validates actual authentication
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    const [stats, recentActivity] = await Promise.all([
      getDashboardStats(),
      getRecentActivity()
    ]);

    const formatCurrency = (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount / 100); // Assuming amount is in cents
    };

    const formatDate = (date: Date | string) => {
      try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return format(dateObj, 'MMM dd, yyyy');
      } catch {
        return 'Invalid date';
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'COMPLETED':
          return <Badge variant="default">Completed</Badge>;
        case 'PROCESSING':
          return <Badge variant="secondary">Processing</Badge>;
        case 'PENDING':
          return <Badge variant="outline">Pending</Badge>;
        case 'CANCELLED':
          return <Badge variant="destructive">Cancelled</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    const getProductStatusBadge = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return <Badge variant="default">Active</Badge>;
        case 'HIDDEN':
          return <Badge variant="outline">Hidden</Badge>;
        case 'DISABLED':
          return <Badge variant="destructive">Disabled</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your marketplace performance
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.users.newThisMonth}</span> this month
              </p>
            </CardContent>
          </Card>

          {/* Total Sellers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sellers.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-orange-600">{stats.sellers.pendingApplications}</span> pending applications
              </p>
            </CardContent>
          </Card>

          {/* Total Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.products.newThisMonth}</span> this month
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.orders.total.toLocaleString()} orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.users.suspended.toLocaleString()} suspended
              </p>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders.recent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sellers.recentApplications.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reports.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-orange-600">{stats.reports.pending}</span> pending,{" "}
                <span className="text-red-600">{stats.reports.critical}</span> critical
              </p>
            </CardContent>
          </Card>

          {/* Total Product Views */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Product Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products.totalViews?.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">
                Across all products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Users
              </CardTitle>
              <CardDescription>
                Latest user registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.username || "User"} />
                    <AvatarFallback className="text-xs">
                      {user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.username || "No username"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || "No email"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                Latest marketplace orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {order.product?.name || "Unknown Product"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      by {order.user?.username || order.user?.email || "Unknown User"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Products and Applications */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Products
              </CardTitle>
              <CardDescription>
                Latest products added to the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.recentProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      by {product.seller?.shopName || "Unknown Shop"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(product.price, product.currency)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {getProductStatusBadge(product.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(product.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Seller Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Recent Applications
              </CardTitle>
              <CardDescription>
                Latest seller applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.recentApplications.map((application) => (
                <div key={application.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {application.user?.username || "No username"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {application.user?.email || "No email"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {application.applicationApproved ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                      <Badge variant={application.applicationApproved ? "default" : "outline"}>
                        {application.applicationApproved ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/admin/dashboard/users">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/admin/dashboard/seller-applications">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span className="text-sm font-medium">Seller Applications</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/admin/dashboard/products">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">Manage Products</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/admin/dashboard/orders">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-sm font-medium">View Orders</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your marketplace performance
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading dashboard data. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  }