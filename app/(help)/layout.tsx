import { Metadata } from "next";
import { Jost } from "next/font/google";
import { HelpCenterNav } from "./_components/HelpCenterNav";
import { HelpCenterNavbar } from "./_components/HelpCenterNavbar";
import { HelpCenterFooter } from "./_components/HelpCenterFooter";

const jost = Jost({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Help Center | Yarnnu",
  description:
    "Get help with selling on Yarnnu. Find guides, tutorials, and support for sellers.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${jost.className}`}>
      {/* Navbar */}
      <HelpCenterNavbar />

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Help Center
            </h1>
            <p className="text-gray-600">
              Everything you need to know about selling on Yarnnu
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-1">
              <HelpCenterNav />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <HelpCenterFooter />
    </div>
  );
}
