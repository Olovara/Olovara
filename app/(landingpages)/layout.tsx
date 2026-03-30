import "../globals.css";
import { Jost } from "next/font/google";
import { cn } from "@/lib/utils";

const jost = Jost({ subsets: ["latin"] });

export default function LandingPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("w-full min-h-full flex flex-col", jost.className)}>
      {children}
    </div>
  );
}
