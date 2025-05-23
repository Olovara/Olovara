import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scissors, Package, Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-center space-x-4 text-primary">
            <Scissors className="h-12 w-12 animate-bounce" />
            <Heart className="h-12 w-12 animate-bounce" style={{ animationDelay: "0.2s" }} />
            <Package className="h-12 w-12 animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
          
          <h1 className="text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Oops! Dropped a Stitch
          </h1>
          
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            404 - Page Not Found
          </h2>
          
          <p className="max-w-md mx-auto text-gray-600 dark:text-gray-400">
            Looks like this pattern got tangled up! The page you&apos;re looking for seems to have wandered off like a lost skein of yarn.
          </p>

          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t worry, even the best crafters make mistakes! 
            </p>
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/">Back to the Main Pattern</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 