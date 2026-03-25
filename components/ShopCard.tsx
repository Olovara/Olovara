"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { FacebookIcon, InstagramIcon, PinterestIcon, TikTokIcon } from "./ui/social-icon";
import FollowButton from "@/components/FollowButton";

interface ShopCardProps {
  shop: {
    id: string;
    shopName: string;
    shopNameSlug: string;
    shopTagLine: string | null;
    totalSales: number;
    totalProducts: number;
    followerCount: number;
    acceptsCustom: boolean;
    facebookUrl: string | null;
    instagramUrl: string | null;
    pinterestUrl: string | null;
    tiktokUrl: string | null;
    products: {
      id: string;
    }[];
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  const socialLinks = [
    { url: shop.facebookUrl || undefined, icon: FacebookIcon, label: "Facebook" },
    { url: shop.instagramUrl || undefined, icon: InstagramIcon, label: "Instagram" },
    { url: shop.pinterestUrl || undefined, icon: PinterestIcon, label: "Pinterest" },
    { url: shop.tiktokUrl || undefined, icon: TikTokIcon, label: "TikTok" },
  ].filter((link) => link.url);

  return (
    <div className="bg-brand-light-neutral-50 rounded-lg shadow-sm border border-brand-dark-neutral-200 p-4 hover:shadow-md transition-shadow">
      <Link href={`/shops/${shop.shopNameSlug}`}>
        <div className="aspect-square relative mb-4">
          <div className="w-full h-full bg-brand-light-neutral-100 rounded-lg flex items-center justify-center border border-brand-dark-neutral-200/60">
            <span className="text-muted-foreground text-sm">Shop Image</span>
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-1 text-brand-dark-neutral-900">{shop.shopName}</h3>
        {shop.shopTagLine && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{shop.shopTagLine}</p>
        )}

        {socialLinks.length > 0 && (
          <div className="flex gap-2 mb-3">
            {socialLinks.slice(0, 3).map(({ url, icon: Icon, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-brand-light-neutral-100 hover:bg-brand-light-neutral-200 rounded transition-colors border border-brand-dark-neutral-200/80"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon className="h-3 w-3" />
              </a>
            ))}
            {socialLinks.length > 3 && (
              <span className="text-xs text-brand-dark-neutral-400 self-center">
                +{socialLinks.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{shop.totalProducts} products</span>
          <span>•</span>
          <span>{shop.totalSales} sales</span>
        </div>
      </Link>
      <div className="mt-4 flex flex-col gap-2">
        <FollowButton
          sellerId={shop.id}
          sellerName={shop.shopName}
          variant="outlinePrimary"
          size="sm"
          showCount={true}
          initialFollowerCount={shop.followerCount}
          className="w-full"
        />
        <Link href={`/shops/${shop.shopNameSlug}`} className="block">
          <Button variant="outlinePrimary" className="w-full" size="sm">
            Visit Shop
          </Button>
        </Link>
      </div>
    </div>
  );
}
