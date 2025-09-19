import "../globals.css";
import { Jost } from "next/font/google";

const jost = Jost({ subsets: ["latin"] });

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`h-full flex items-center justify-center ${jost.className}`}>
      {children}
    </div>
  );
}
