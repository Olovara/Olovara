"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  Share2,
  Trash2,
  Eye,
  Lock,
  Globe,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserWishlists, deleteWishlist } from "@/actions/wishlistActions";
import { toast } from "sonner";
import { ShareWishlistModal } from "./ShareWishlistModal";
import { WishlistItemCard } from "./WishlistItemCard";
import { CreateWishlistModal } from "./CreateWishlistModal";
import { WishlistSettingsModal } from "./WishlistSettingsModal";

export function WishlistDashboard() {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWishlist, setSelectedWishlist] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load wishlists
  const loadWishlists = async () => {
    setIsLoading(true);
    try {
      const result = await getUserWishlists();
      if (result.success && result.wishlists) {
        setWishlists(result.wishlists);
      } else {
        toast.error("Failed to load wishlists");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlists();
  }, []);

  // Handle wishlist deletion
  const handleDeleteWishlist = async (wishlistId: string) => {
    if (!confirm("Are you sure you want to delete this wishlist?")) return;

    try {
      const result = await deleteWishlist(wishlistId);
      if (result.success) {
        toast.success("Wishlist deleted");
        loadWishlists();
      } else {
        toast.error("Failed to delete wishlist");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // Get privacy icon
  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "PRIVATE":
        return <Lock className="h-4 w-4" />;
      case "PUBLIC":
        return <Globe className="h-4 w-4" />;
      case "SHAREABLE":
        return <Share2 className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  // Get privacy label
  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case "PRIVATE":
        return "Private";
      case "PUBLIC":
        return "Public";
      case "SHAREABLE":
        return "Shareable";
      default:
        return "Private";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Wishlists</h1>
          <p className="text-muted-foreground">
            Create and manage your wishlists
          </p>
        </div>
        <CreateWishlistModal
          onWishlistCreated={loadWishlists}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Wishlist
            </Button>
          }
        />
      </div>

      {/* Wishlists Grid */}
      {wishlists.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No wishlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first wishlist to start saving products you love
            </p>
            <CreateWishlistModal
              onWishlistCreated={loadWishlists}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Wishlist
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlists.map((wishlist) => (
            <Card
              key={wishlist.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {wishlist.name}
                      {wishlist.isDefault && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    {wishlist.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {wishlist.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedWishlist(wishlist);
                        setShowShareModal(true);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedWishlist(wishlist);
                        setShowSettingsModal(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {!wishlist.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWishlist(wishlist.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {getPrivacyIcon(wishlist.privacy)}
                  <span className="text-xs text-muted-foreground">
                    {getPrivacyLabel(wishlist.privacy)}
                  </span>
                  {wishlist.allowPurchases && (
                    <Badge variant="outline" className="text-xs">
                      Registry
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {wishlist.items.length} items
                    </span>
                    {wishlist.analytics && (
                      <span className="text-muted-foreground">
                        {wishlist.analytics.totalViews} views
                      </span>
                    )}
                  </div>

                  {/* Preview of items */}
                  <div className="space-y-2">
                    {wishlist.items.slice(0, 3).map((item: any) => (
                      <WishlistItemCard
                        key={item.id}
                        item={item}
                        wishlist={wishlist}
                        onUpdate={loadWishlists}
                        compact
                      />
                    ))}
                    {wishlist.items.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{wishlist.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}

      {selectedWishlist && (
        <>
          <WishlistSettingsModal
            wishlist={selectedWishlist}
            open={showSettingsModal}
            onOpenChange={setShowSettingsModal}
            onSuccess={loadWishlists}
          />
          <ShareWishlistModal
            wishlist={selectedWishlist}
            open={showShareModal}
            onOpenChange={setShowShareModal}
          />
        </>
      )}
    </div>
  );
}
