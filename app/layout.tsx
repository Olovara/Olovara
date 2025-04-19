import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";


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
      <main>
          <div>
            {children}
          </div>
      </main>

      <Toaster position='top-center' richColors />
    </body>
  </html>
  );
}