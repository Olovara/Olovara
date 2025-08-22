import { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard | Yarnnu - Manage Your Account",
  description: "Access your Yarnnu dashboard to manage your account, shop, products, and business settings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex flex-col min-h-screen", inter.className)}>
      <main className="flex-grow">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}