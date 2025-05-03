"use client";

import { Badge } from "@/components/ui/badge";
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
import { Ellipsis } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string | { html: string; text: string } | null;
  price: number;
  isDigital: boolean;
  status: string;
  images: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  numberSold: number;
  userId: string;
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  // Helper function to format date
  const formatDate = (date: Date | string) => {
    try {
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString();
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', date);
      return 'Invalid date';
    }
  };

  // Helper function to extract text from description
  const getDescriptionText = (description: string | { html: string; text: string } | null) => {
    if (!description) return 'No description';
    
    if (typeof description === 'string') {
      try {
        const parsed = JSON.parse(description);
        if (parsed && typeof parsed === 'object') {
          return parsed.text || parsed.html?.replace(/<[^>]*>?/gm, '') || 'No description';
        }
        return description;
      } catch {
        // If it's not JSON, try to strip HTML tags
        return description.replace(/<[^>]*>?/gm, '');
      }
    }
    
    // Handle description object
    if (description && typeof description === 'object') {
      return description.text || description.html?.replace(/<[^>]*>?/gm, '') || 'No description';
    }
    
    return 'No description';
  };

  // Debug log to check the data
  //console.log('Products data:', JSON.stringify(products, null, 2));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Sold</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          // Debug log for each product
          //console.log('Processing product:', product);
          
          return (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-md">
                    <Image
                      src={product.images[0] || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Link
                      href={`/seller/dashboard/products/edit/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {getDescriptionText(product.description)}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    product.isDigital === false
                      ? "default"
                      : product.isDigital === true
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {product.isDigital === true ? "Digital" : product.isDigital === false ? "Physical" : "Unknown"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    product.status === "ACTIVE"
                      ? "default"
                      : product.status === "HIDDEN"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {product.status || "UNKNOWN"}
                </Badge>
              </TableCell>
              <TableCell>${(product.price || 0).toFixed(2)}</TableCell>
              <TableCell>{product.numberSold || 0}</TableCell>
              <TableCell>
                {formatDate(product.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/seller/dashboard/products/edit/${product.id}`}>
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {/*TODO readd when analytics are added<DropdownMenuItem asChild>
                      <Link href={`/seller/dashboard/products/${product.id}/analytics`}>
                        Analytics
                      </Link>
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
} 