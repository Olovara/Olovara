import "../globals.css";
import { Jost } from "next/font/google";
import { cn } from "@/lib/utils";

const jost = Jost({ subsets: ["latin"] });

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", jost.className)}>
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>
    );
  }