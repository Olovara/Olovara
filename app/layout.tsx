import type { Metadata } from "next";
import { Jost, Noto_Serif_Display } from "next/font/google";
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
import { FONTS } from "@/lib/fonts";
import ModalProvider from "@/providers/modal-provider";
import { YarnnuRedirectToast } from "@/components/YarnnuRedirectToast";

const jost = Jost({ subsets: ["latin"] });
const notoSerifDisplay = Noto_Serif_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "OLOVARA - Handmade Marketplace | Unique Artisan Products",
    template: "%s | OLOVARA",
  },
  description:
    "Discover unique handmade products from talented artisans around the world. Shop crochet, knitting, jewelry, home decor, and more. Support independent creators and find one-of-a-kind treasures.",
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
    "handmade accessories",
  ],
  authors: [{ name: "OLOVARA Team" }],
  creator: "OLOVARA",
  publisher: "OLOVARA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://olovara.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "OLOVARA",
    title: "OLOVARA - Handmade Marketplace | Unique Artisan Products",
    description:
      "Discover unique handmade products from talented artisans around the world. Shop crochet, knitting, jewelry, home decor, and more.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "OLOVARA - Handmade Marketplace featuring unique artisan products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@olovara",
    creator: "@olovara",
    title: "OLOVARA - Handmade Marketplace | Unique Artisan Products",
    description:
      "Discover unique handmade products from talented artisans around the world. Shop crochet, knitting, jewelry, home decor, and more.",
    images: ["/og-image.jpg"],
  },
  // Single robots string so we can include Google's noai / noimageai tokens (not in Next's RobotsInfo typings yet).
  // Child layouts/pages that set their own `robots` still override this for HTML meta.
  robots:
    "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1, noai, noimageai",
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
          "relative min-h-screen bg-background antialiased",
          FONTS.MAIN,
          jost.className,
          notoSerifDisplay.className
        )}
      >
        <PostHogProvider>
          <SessionProvider session={session}>
            <PermissionProvider>
              <LocationProvider>
                <OnboardingSurveyProvider>
                  <AnalyticsProvider>
                    <SocketProvider>
                      <ModalProvider>
                        <main className="relative flex min-h-full w-full min-w-0 flex-col">
                          {children}
                        </main>
                        <PostHogPageview />
                        <WebsiteStructuredData pageType="home" />
                      </ModalProvider>
                    </SocketProvider>
                  </AnalyticsProvider>
                </OnboardingSurveyProvider>
              </LocationProvider>
            </PermissionProvider>
            <Toaster position="top-center" richColors />
            <YarnnuRedirectToast />
          </SessionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
