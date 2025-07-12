import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Become a Founding Seller - Yarnnu",
  description: "Join Yarnnu as one of our first 50 founding sellers. Get lifetime 8% commission (vs 10%), priority placement, early feature access, and showcase opportunities. Built by artisans, for artisans.",
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex flex-col min-h-screen", inter.className)}>
      <main className="flex-grow">{children}</main>
    </div>
  );
} 