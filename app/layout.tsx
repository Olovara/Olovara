import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { LocationProvider } from "@/components/providers/LocationProvider";
import { SessionUpdateListener } from "@/components/SessionUpdateListener";
import { auth } from "@/auth";
import Script from "next/script";

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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body
        className={cn(
          "relative min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <SessionProvider session={session}>
          <LocationProvider>
            <SocketProvider>
              <main className="relative flex min-h-screen flex-col">
                {children}
              </main>
              <SessionUpdateListener />
            </SocketProvider>
          </LocationProvider>
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
