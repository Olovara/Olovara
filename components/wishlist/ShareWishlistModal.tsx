"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ShareWishlistModalProps {
  wishlist: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareWishlistModal({
  wishlist,
  open,
  onOpenChange,
}: ShareWishlistModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const wishlistUrl = `${process.env.NEXT_PUBLIC_APP_URL}/w/${wishlist.slug}`;

  const generateQRCode = useCallback(async () => {
    try {
      // Dynamically import qrcode to avoid SSR issues
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(wishlistUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }, [wishlistUrl]);

  // Generate QR code
  useEffect(() => {
    if (open && wishlist) {
      generateQRCode();
    }
  }, [open, wishlist, generateQRCode]);

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(wishlistUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.download = `${wishlist.name}-qr-code.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Social share functions
  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(wishlistUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const text = `Check out my wishlist: ${wishlist.name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(wishlistUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct sharing via URL
    // We'll copy the link and show instructions
    copyToClipboard();
    toast.info("Link copied! You can paste it in your Instagram bio or story.");
  };

  const shareViaEmail = () => {
    const subject = `Check out my wishlist: ${wishlist.name}`;
    const body = `Hi! I wanted to share my wishlist with you: ${wishlistUrl}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  const shareViaWhatsApp = () => {
    const text = `Check out my wishlist: ${wishlist.name} - ${wishlistUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareViaMessenger = () => {
    const url = `fb-messenger://share/?link=${encodeURIComponent(wishlistUrl)}`;
    window.open(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Wishlist</DialogTitle>
          <DialogDescription>
            Share &quot;{wishlist.name}&quot; with friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wishlist Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <h3 className="font-semibold">{wishlist.name}</h3>
              {wishlist.description && (
                <p className="text-sm text-muted-foreground">
                  {wishlist.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {wishlist.items.length} items
                </Badge>
                {wishlist.allowPurchases && (
                  <Badge variant="secondary" className="text-xs">
                    Registry Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Direct Link */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input value={wishlistUrl} readOnly />
              <Button onClick={copyToClipboard} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => window.open(wishlistUrl, "_blank")}
                variant="outline"
                size="icon"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label>QR Code</Label>
            <div className="flex items-center gap-4">
              {qrCodeUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-[200px] h-[200px]">
                    <Image
                      src={qrCodeUrl}
                      alt="Wishlist QR Code"
                      fill
                      sizes="200px"
                      priority
                      className="object-contain border rounded"
                    />
                  </div>
                  <Button onClick={downloadQRCode} variant="outline" size="sm">
                    Download QR Code
                  </Button>
                </div>
              ) : (
                <div className="h-[200px] w-[200px] bg-muted animate-pulse rounded flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Scan this QR code to view the wishlist on mobile devices</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Sharing */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button
                onClick={shareToFacebook}
                variant="outline"
                className="justify-start"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                onClick={shareToTwitter}
                variant="outline"
                className="justify-start"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={shareToInstagram}
                variant="outline"
                className="justify-start"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={shareViaMessenger}
                variant="outline"
                className="justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Messenger
              </Button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Privacy:</strong> This wishlist is currently set to{" "}
              <strong>
                {wishlist.privacy === "PRIVATE"
                  ? "Private"
                  : wishlist.privacy === "PUBLIC"
                    ? "Public"
                    : "Shareable"}
              </strong>
              . Only people with the link can view it.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
