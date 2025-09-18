import "../globals.css";
import { Jost } from "next/font/google";
import { cn } from "@/lib/utils";

const jost = Jost({ subsets: ["latin"] });

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("h-full flex items-center justify-center", jost.className)}
    >
      {children}
    </div>
  );
}
