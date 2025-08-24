import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import FollowedSellersList from "@/components/FollowedSellersList";

export default async function FollowedSellersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Followed Sellers
          </h1>
          <p className="text-muted-foreground">
            Discover new products from your favorite sellers
          </p>
        </div>
        <Button asChild>
          <Link href="/products?followedSellers=true">
            <ExternalLink className="mr-2 h-4 w-4" />
            View All Products
          </Link>
        </Button>
      </div>

      <FollowedSellersList
        emptyStateMessage="Start following other sellers to see their latest products here"
        emptyStateButtonText="Browse Products"
        emptyStateButtonHref="/products"
      />
    </div>
  );
}
