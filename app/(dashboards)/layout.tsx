import { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner";
import { FONTS } from "@/lib/fonts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard | OLOVARA - Manage Your Account",
  description:
    "Access your OLOVARA dashboard to manage your account, shop, products, and business settings.",
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
    <div
      className={`relative flex flex-col min-h-screen ${FONTS.DASHBOARD} ${inter.className}`}
    >
      <main className="flex-grow">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
