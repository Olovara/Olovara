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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, ListFilter, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { getAllUsers } from "@/actions/adminActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminDashboardUsers() {
  const users = await getAllUsers();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="text-xs" variant="outline">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="text-xs" variant="secondary">Suspended</Badge>;
      case 'VACATION':
        return <Badge className="text-xs" variant="destructive">Vacation</Badge>;
      default:
        return <Badge className="text-xs" variant="outline">Active</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="text-xs" variant="destructive">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge className="text-xs" variant="default">Admin</Badge>;
      case 'SELLER':
        return <Badge className="text-xs" variant="secondary">Seller</Badge>;
      case 'MEMBER':
        return <Badge className="text-xs" variant="outline">Member</Badge>;
      default:
        return <Badge className="text-xs" variant="outline">Member</Badge>;
    }
  };

  // Filter users by role
  const allUsers = users;
  const adminUsers = users.filter(user => user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const sellerUsers = users.filter(user => user.role === 'SELLER');
  const memberUsers = users.filter(user => user.role === 'MEMBER');

  // Helper function to render user table
  const renderUserTable = (filteredUsers: typeof users, title: string, description: string) => (
    <Card x-chunk="dashboard-05-chunk-3">
      <CardHeader className="px-7">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description} ({filteredUsers.length} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden sm:table-cell">
                Status
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Sign-up Date
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found in this category
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="bg-accent">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.username || "User"} />
                        <AvatarFallback>{user.username?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username || "No username"}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {user.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Link href={`/admin/dashboard/users/${user.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuItem>Suspend User</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <main>
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="sellers">Sellers</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-sm"
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Suspended</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Vacation</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Export</span>
            </Button>
          </div>
        </div>
        
        <TabsContent value="all">
          {renderUserTable(allUsers, "All Users", "All users on our platform")}
        </TabsContent>
        
        <TabsContent value="admins">
          {renderUserTable(adminUsers, "Administrators", "Admin and Super Admin users")}
        </TabsContent>
        
        <TabsContent value="sellers">
          {renderUserTable(sellerUsers, "Sellers", "Users with seller accounts")}
        </TabsContent>
        
        <TabsContent value="members">
          {renderUserTable(memberUsers, "Members", "Regular member users")}
        </TabsContent>
      </Tabs>
    </main>
  );
}