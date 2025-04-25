import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Seller } from "@prisma/client";

interface ShopCardProps {
  shop: Seller & {
    products: {
      id: string;
    }[];
    totalProducts: number;
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <Link href={`/shops/${shop.shopNameSlug}`}>
        <div className="aspect-square relative mb-4">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Shop Image</span>
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-1">{shop.shopName}</h3>
        {shop.shopTagLine && (
          <p className="text-muted-foreground text-sm mb-4">{shop.shopTagLine}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{shop.totalProducts} products</span>
          <span>•</span>
          <span>{shop.totalSales} sales</span>
        </div>
      </Link>
      <div className="mt-4">
        <Link href={`/shops/${shop.shopNameSlug}`}>
          <Button variant="outline" className="w-full">
            Visit Shop
          </Button>
        </Link>
      </div>
    </div>
  );
} 