import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { LocationProvider } from "@/components/providers/LocationProvider";
import { PermissionProvider } from "@/components/providers/PermissionProvider";
import { auth } from "@/auth";
import Script from "next/script";
import { OnboardingSurveyProvider } from "@/components/providers/OnboardingSurveyProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { PostHogProvider, PostHogPageview } from "./providers";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Yarnnu - Handmade Marketplace | Unique Artisan Products",
    template: "%s | Yarnnu"
  },
  description: "Discover unique handmade products from talented artisans around the world. Shop crochet, knitting, jewelry, home decor, and more. Support independent creators and find one-of-a-kind treasures.",
  keywords: [
    "handmade marketplace",
    "artisan products", 
    "crochet patterns",
    "handmade jewelry",
    "unique gifts",
    "handmade home decor",
    "artisan marketplace",
    "handmade crafts",
    "support small business",
    "handmade accessories"
  ],
  authors: [{ name: "Yarnnu Team" }],
  creator: "Yarnnu",
  publisher: "Yarnnu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://yarnnu.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Yarnnu",
    title: "Yarnnu - Handmade Marketplace | Unique Artisan Products",
    description: "Discover unique handmade products from talented artisans around the world. Shop crochet, knitting, jewelry, home decor, and more.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Yarnnu - Handmade Marketplace featuring unique artisan products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@yarnnu",
    creator: "@yarnnu",
    title: "Yarnnu - Handmade Marketplace | Unique Artisan Products",
    description: "Discover unique handmade products from talented artisans around the world. Shop crochet, knitting, jewelry, home decor, and more.",
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
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  category: "e-commerce",
  classification: "Handmade Marketplace",
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
            <PermissionProvider>
              <LocationProvider>
                <OnboardingSurveyProvider>
                  <AnalyticsProvider>
                    <SocketProvider>
                      <main className="relative flex min-h-screen flex-col">
                        {children}
                      </main>
                      <PostHogPageview />
                      <WebsiteStructuredData pageType="home" />
                    </SocketProvider>
                  </AnalyticsProvider>
                </OnboardingSurveyProvider>
              </LocationProvider>
            </PermissionProvider>
            <Toaster position="top-center" richColors />
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
