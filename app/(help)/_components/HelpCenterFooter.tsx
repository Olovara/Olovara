import Link from "next/link";

export function HelpCenterFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Help Center Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Help Center</h3>
            <p className="text-gray-600 text-sm">
              Everything you need to know about selling on OLOVARA. Find guides,
              tutorials, and support for sellers.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/help-center"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Help Center Home
                </Link>
              </li>
              <li>
                <Link
                  href="/seller-application"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Seller Application
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* OLOVARA Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">OLOVARA</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} OLOVARA. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">
            Handmade with ❤️ for creators
          </p>
        </div>
      </div>
    </footer>
  );
}
