import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yarnnu Marketplace",
  description: "Discover high-quality handcrafted goods.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='h-full'>
    <body
      className={cn(
        'relative h-full font-sans antialiased',
        inter.className
      )}>
      <main className='relative flex flex-col min-h-screen'>
          <Navbar />
          <div className='flex-grow flex-1'>
            {children}
          </div>
          <Footer />
      </main>

      <Toaster position='top-center' richColors />
    </body>
  </html>
  );
}