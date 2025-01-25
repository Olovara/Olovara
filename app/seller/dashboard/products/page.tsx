import { getSellerProducts } from "@/actions/product";
import { auth } from "@/auth"; // Adjust to your auth file path
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function ProductsPage() {
  const session = await auth(); // Get session
  const userId = session?.user?.id; // Extract userId from session

  if (!userId) {
    return <p>You must be logged in to view this page.</p>; // Simple fallback for unauthenticated users
  }

  const products = await getSellerProducts(userId); // Fetch products dynamically

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Header and breadcrumbs */}
      <header>...</header>

      {/* Main Content */}
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Tabs defaultValue="all">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="archived" className="hidden sm:flex">
                Archived
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Manage your products and view their sales performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">
                        Image
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Price
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Total Sales
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created at
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={product.name}
                            src={product.images[0] || "/placeholder.svg"}
                            width={64}
                            height={64}
                            className="rounded-md"
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.isDigital ? "Digital" : "Physical"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          ${product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.numberSold || 0}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(product.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Ellipsis className="h-5 w-5"/>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Link
                                  href={`/seller/dashboard/products/edit/${product.id}`}
                                >
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
