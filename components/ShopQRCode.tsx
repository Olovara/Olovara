"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface ShopQRCodeProps {
  shopNameSlug: string;
}

export default function ShopQRCode({ shopNameSlug }: ShopQRCodeProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Dynamically import qrcode to avoid SSR issues
        const QRCode = (await import("qrcode")).default;
        const shopUrl = `${window.location.origin}/shops/${shopNameSlug}`;
        const qrDataUrl = await QRCode.toDataURL(shopUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrCode(qrDataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [shopNameSlug]);

  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `${shopNameSlug}-shop-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isLoading ? (
        <div className="w-[300px] h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        <>
          <div className="relative w-[300px] h-[300px]">
            <Image
              src={qrCode}
              alt="Shop QR Code"
              fill
              sizes="300px"
              priority
              className="object-contain"
            />
          </div>
          <Button
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </Button>
        </>
      )}
    </div>
  );
} 