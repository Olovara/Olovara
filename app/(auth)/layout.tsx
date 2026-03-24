import "../globals.css";
import { Jost } from "next/font/google";

const jost = Jost({ subsets: ["latin"] });

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-primary-50 via-brand-light-neutral-50 to-brand-primary-50/80 py-12 px-4 sm:px-6 lg:px-8 ${jost.className}`}>
        <div className="w-full min-w-0 max-w-md space-y-8">
          {children}
        </div>
      </div>
    );
  }