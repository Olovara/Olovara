"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateWishlist } from "@/actions/wishlistActions";
import { toast } from "sonner";

interface WishlistSettingsModalProps {
  wishlist: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function WishlistSettingsModal({
  wishlist,
  open,
  onOpenChange,
  onSuccess,
}: WishlistSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: wishlist.name || "",
    description: wishlist.description || "",
    privacy: wishlist.privacy || "PRIVATE",
    allowPurchases: wishlist.allowPurchases || false,
    hideOnPurchase: wishlist.hideOnPurchase || false,
    isDefault: wishlist.isDefault || false,
  });

  // Update form data when wishlist changes
  useEffect(() => {
    if (wishlist) {
      setFormData({
        name: wishlist.name || "",
        description: wishlist.description || "",
        privacy: wishlist.privacy || "PRIVATE",
        allowPurchases: wishlist.allowPurchases || false,
        hideOnPurchase: wishlist.hideOnPurchase || false,
        isDefault: wishlist.isDefault || false,
      });
    }
  }, [wishlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateWishlist({
        wishlistId: wishlist.id,
        ...formData,
      });

      if (result.success) {
        toast.success("Wishlist updated successfully!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update wishlist");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Wishlist Settings</DialogTitle>
          <DialogDescription>
            Update your wishlist settings and preferences
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Wishlist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Birthday 2025, Christmas, Crochet Goals"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell people what this wishlist is for..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy">Privacy</Label>
            <Select
              value={formData.privacy}
              onValueChange={(value: "PRIVATE" | "PUBLIC" | "SHAREABLE") =>
                setFormData({ ...formData, privacy: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">
                  <div className="flex items-center gap-2">
                    <span>🔒 Private</span>
                    <span className="text-xs text-muted-foreground">
                      Only you can see this wishlist
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="PUBLIC">
                  <div className="flex items-center gap-2">
                    <span>🌐 Public</span>
                    <span className="text-xs text-muted-foreground">
                      Anyone can find and view this wishlist
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="SHAREABLE">
                  <div className="flex items-center gap-2">
                    <span>🔗 Shareable</span>
                    <span className="text-xs text-muted-foreground">
                      Only accessible via link or QR code
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Set as Default Wishlist</Label>
                <p className="text-sm text-muted-foreground">
                  This will be your default wishlist for quick adds
                </p>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Direct Purchases</Label>
                <p className="text-sm text-muted-foreground">
                  Let others buy items directly from your wishlist (registry
                  mode)
                </p>
              </div>
              <Switch
                checked={formData.allowPurchases}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowPurchases: checked })
                }
              />
            </div>

            {formData.allowPurchases && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hide Purchased Items</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide items once they&apos;re purchased (surprise mode)
                  </p>
                </div>
                <Switch
                  checked={formData.hideOnPurchase}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hideOnPurchase: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? "Updating..." : "Update Wishlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
