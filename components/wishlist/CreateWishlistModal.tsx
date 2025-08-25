"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWishlist } from "@/actions/wishlistActions";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateWishlistModalProps {
  onWishlistCreated: () => void;
  trigger?: React.ReactNode;
}

export function CreateWishlistModal({
  onWishlistCreated,
  trigger,
}: CreateWishlistModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [privacy, setPrivacy] = useState<"PRIVATE" | "PUBLIC" | "SHAREABLE">(
    "PRIVATE"
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a wishlist name");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createWishlist({
        name: name.trim(),
        description: "",
        privacy,
        allowPurchases: false,
        hideOnPurchase: false,
      });

      if (result.success) {
        toast.success("Wishlist created successfully!");
        setIsOpen(false);
        setName("");
        setPrivacy("PRIVATE");
        onWishlistCreated();
      } else {
        toast.error(result.error || "Failed to create wishlist");
      }
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setName("");
      setPrivacy("PRIVATE");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Wishlist</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Wishlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter wishlist name..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreate();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="privacy">Privacy</Label>
            <Select
              value={privacy}
              onValueChange={(value: "PRIVATE" | "PUBLIC" | "SHAREABLE") =>
                setPrivacy(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select privacy setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">
                  <div className="flex flex-col">
                    <span className="font-medium">Private</span>
                    <span className="text-xs text-muted-foreground">
                      Only you can see this wishlist
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="PUBLIC">
                  <div className="flex flex-col">
                    <span className="font-medium">Public</span>
                    <span className="text-xs text-muted-foreground">
                      Anyone can find and view this wishlist
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="SHAREABLE">
                  <div className="flex flex-col">
                    <span className="font-medium">Shareable</span>
                    <span className="text-xs text-muted-foreground">
                      Only people with the link can view this wishlist
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? "Creating..." : "Create Wishlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
