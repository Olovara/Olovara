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
import { headers } from "next/headers";
import { OnboardingSurveyProvider } from "@/components/providers/OnboardingSurveyProvider";
import { PostHogProvider, PostHogPageview } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yarnnu - Handmade Marketplace",
  description: "Discover unique handmade products from talented artisans around the world.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Yarnnu - Handmade Marketplace",
    description: "Discover unique handmade products from talented artisans around the world.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Yarnnu",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Yarnnu - Handmade Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yarnnu - Handmade Marketplace",
    description: "Discover unique handmade products from talented artisans around the world.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
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
        <PostHogProvider>
          <SessionProvider session={session}>
            <LocationProvider>
              <OnboardingSurveyProvider>
                <SocketProvider>
                  <main className="relative flex min-h-screen flex-col">
                    {children}
                  </main>
                  <SessionUpdateListener />
                  <PostHogPageview />
                </SocketProvider>
              </OnboardingSurveyProvider>
            </LocationProvider>
            <Toaster position="top-center" richColors />
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
