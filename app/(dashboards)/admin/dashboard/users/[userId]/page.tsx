import { getUserPermissions, addUserPermission, removeUserPermission } from "@/actions/adminActions";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { PermissionManager } from "@/components/admin/PermissionManager";
import { RoleManager } from "@/components/admin/RoleManager";
import { currentUser } from "@/lib/auth";

interface UserDetailsPageProps {
  params: {
    userId: string;
  };
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  try {
    const user = await getUserPermissions(params.userId);
    const currentUserData = await currentUser();

    if (!user) {
      notFound();
    }

    // Check if current user has permission to manage roles
    const canManageRoles = currentUserData?.permissions?.includes('MANAGE_ROLES');

    const formatDate = (date: Date | string | any) => {
      try {
        // Handle different date formats that might come from the database
        let dateObj: Date;
        
        if (date instanceof Date) {
          dateObj = date;
        } else if (typeof date === 'string') {
          dateObj = new Date(date);
        } else if (date && typeof date === 'object' && date.$date) {
          // Handle MongoDB date format
          dateObj = new Date(date.$date);
        } else {
          console.warn('Invalid date format:', date);
          return 'Invalid date';
        }
        
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid date value:', date);
          return 'Invalid date';
        }
        
        return format(dateObj, 'MMM dd, yyyy');
      } catch (error) {
        console.error('Error formatting date:', error, 'Date value:', date);
        return 'Invalid date';
      }
    };

    const getRoleBadge = (role: string) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return <Badge variant="destructive">Super Admin</Badge>;
        case 'ADMIN':
          return <Badge variant="default">Admin</Badge>;
        case 'SELLER':
          return <Badge variant="secondary">Seller</Badge>;
        case 'MEMBER':
          return <Badge variant="outline">Member</Badge>;
        default:
          return <Badge variant="outline">Member</Badge>;
      }
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'ACTIVE':
          return <Badge variant="default">Active</Badge>;
        case 'SUSPENDED':
          return <Badge variant="destructive">Suspended</Badge>;
        case 'VACATION':
          return <Badge variant="secondary">Vacation</Badge>;
        default:
          return <Badge variant="outline">Unknown</Badge>;
      }
    };

    const getStripeStatusBadge = (connected: boolean) => {
      return connected ? (
        <Badge variant="default">Connected</Badge>
      ) : (
        <Badge variant="outline">Not Connected</Badge>
      );
    };

    const getTaxVerificationBadge = (verified: boolean) => {
      return verified ? (
        <Badge variant="default">Verified</Badge>
      ) : (
        <Badge variant="outline">Not Verified</Badge>
      );
    };

    const userPermissions = user.permissions as any[] || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground">
              Manage user information and permissions
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.image || undefined} alt={user.username || "User"} />
                  <AvatarFallback className="text-lg">
                    {user.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user.username || "No username"}</h3>
                  <p className="text-muted-foreground">{user.email || "No email"}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Role:</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Account Status:</span>
                  {getStatusBadge(user.status || 'ACTIVE')}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">User ID:</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {user.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Joined:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permission Management Card */}
          <PermissionManager userId={user.id} userPermissions={userPermissions} />
        </div>

        {/* Role Management Card - Only show if user has permission */}
        {canManageRoles && (
          <div className="grid gap-6 md:grid-cols-2">
            <RoleManager 
              userId={user.id} 
              currentRole={user.role} 
              username={user.username || undefined}
              currentUser={currentUserData ? { 
                email: currentUserData.email as string | undefined, 
                id: currentUserData.id 
              } : undefined}
            />
          </div>
        )}

        {/* Seller Information Card - Only show if user has seller profile */}
        {user.seller && (
          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
              <CardDescription>
                Shop details and business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Shop Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Shop Details</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Seller ID:</span>
                      <span className="text-sm text-muted-foreground font-mono">
                        {user.seller.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Shop Name:</span>
                      <span className="text-sm text-muted-foreground">
                        {user.seller.shopName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Shop Slug:</span>
                      <span className="text-sm text-muted-foreground font-mono">
                        {user.seller.shopNameSlug}
                      </span>
                    </div>
                    {user.seller.shopTagLine && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Tag Line:</span>
                        <span className="text-sm text-muted-foreground">
                          {user.seller.shopTagLine}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Application Status:</span>
                      {user.seller.applicationAccepted ? (
                        <Badge variant="default">Accepted</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Stripe Connection:</span>
                      {getStripeStatusBadge(user.seller.stripeConnected)}
                    </div>
                    {user.seller.connectedAccountId && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Stripe Account ID:</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {user.seller.connectedAccountId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tax Verification:</span>
                      {getTaxVerificationBadge(user.seller.taxIdVerified)}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Business Statistics</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Sales:</span>
                      <span className="text-sm text-muted-foreground">
                        {user.seller.totalSales}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total Products:</span>
                      <span className="text-sm text-muted-foreground">
                        {user.seller.totalProducts}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Accepts Custom Orders:</span>
                      {user.seller.acceptsCustom ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tax Country:</span>
                      <span className="text-sm text-muted-foreground">
                        {user.seller.taxCountry}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Seller Since:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.seller.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.seller.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Values */}
              {(user.seller.isWomanOwned || user.seller.isMinorityOwned || user.seller.isLGBTQOwned || 
                user.seller.isVeteranOwned || user.seller.isSustainable || user.seller.isCharitable) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Business Values</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.seller.isWomanOwned && <Badge variant="secondary">Woman-Owned</Badge>}
                      {user.seller.isMinorityOwned && <Badge variant="secondary">Minority-Owned</Badge>}
                      {user.seller.isLGBTQOwned && <Badge variant="secondary">LGBTQ-Owned</Badge>}
                      {user.seller.isVeteranOwned && <Badge variant="secondary">Veteran-Owned</Badge>}
                      {user.seller.isSustainable && <Badge variant="secondary">Sustainable</Badge>}
                      {user.seller.isCharitable && <Badge variant="secondary">Charitable</Badge>}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Permissions Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Summary</CardTitle>
            <CardDescription>
              {userPermissions.length} custom permissions assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No custom permissions assigned. User only has role-based permissions.
                </p>
              ) : (
                <div className="space-y-1">
                  {userPermissions.map((perm: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {perm.permission}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(perm.grantedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading user details:", error);
    notFound();
  }
} 