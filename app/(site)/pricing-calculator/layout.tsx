import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Calculator for Handmade Products | OLOVARA",
  description: "Calculate the perfect price for your handmade products with our comprehensive pricing calculator. Includes materials, labor, packaging, craft show costs, and website fees. Take the guesswork out of pricing your crafts.",
  keywords: [
    "pricing calculator",
    "handmade products",
    "craft pricing",
    "artisan pricing",
    "craft show pricing",
    "online marketplace pricing",
    "handmade business",
    "craft business",
    "pricing strategy",
    "profit calculator",
    "cost calculator",
    "materials cost",
    "labor cost",
    "packaging cost",
    "transaction fees",
    "craft show fees",
    "website fees"
  ],
  openGraph: {
    title: "Pricing Calculator for Handmade Products | OLOVARA",
    description: "Calculate the perfect price for your handmade products with our comprehensive pricing calculator. Includes materials, labor, packaging, craft show costs, and website fees.",
    type: "website",
    url: "/pricing-calculator",
    images: [
      {
        url: "/og-pricing-calculator.jpg", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "Pricing Calculator for Handmade Products"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Calculator for Handmade Products | OLOVARA",
    description: "Calculate the perfect price for your handmade products with our comprehensive pricing calculator.",
    images: ["/og-pricing-calculator.jpg"]
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
  alternates: {
    canonical: "/pricing-calculator"
  }
};

export default function PricingCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
