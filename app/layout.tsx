import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yarnnu Marketplace",
  description: "Discover high-quality handcrafted goods.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full">
      <body
        className={cn("relative h-full font-sans antialiased", inter.className)}
      >
        <SessionProvider session={session}>
        <main>
          <div>{children}</div>
        </main>
        <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
