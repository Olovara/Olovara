"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const Footer = () => {
  const pathname = usePathname();
  const pathsToMinimize = ["/verify-email", "/sign-up", "/sign-in"];

  return (
    <footer className="bg-white flex-grow-0">
      <div className="border-t border-gray-200">
        {!pathsToMinimize.includes(pathname) && (
          <>
            {/* Brand Name */}
            <div className="pb-8 pt-16 flex justify-center">
              <p className="text-lg font-semibold text-gray-900">Yarnnu</p>
            </div>

            {/* Become a Seller Section */}
            <div className="relative flex items-center px-6 py-6 sm:py-8 lg:mt-0">
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div
                  aria-hidden="true"
                  className="absolute bg-purple-100 inset-0 bg-gradient-to-br bg-opacity-90"
                />
              </div>
              <div className="relative text-center mx-auto max-w-sm">
                <h3 className="font-semibold text-gray-900">Become a seller</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you&apos;d like to sell high-quality handmade products, you
                  can do so in minutes.{" "}
                  <Link
                    href="/seller-application"
                    className="whitespace-nowrap font-medium text-black hover:text-zinc-900"
                  >
                    Get started &rarr;
                  </Link>
                </p>
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="bg-gray-50 py-10 px-6 sm:px-12 md:px-20 lg:px-32">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center sm:text-left">
                {/* Marketplace Links */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Marketplace
                  </h4>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link
                        href="/products"
                        className="text-sm text-muted-foreground hover:text-gray-600"
                      >
                        Browse Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/categories"
                        className="text-sm text-muted-foreground hover:text-gray-600"
                      >
                        Categories
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Support Links */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Support
                  </h4>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link
                        href="/pricing-calculator"
                        className="text-sm text-muted-foreground hover:text-gray-600"
                      >
                        Pricing Calculator
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        className="text-sm text-muted-foreground hover:text-gray-600"
                      >
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    Company
                  </h4>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <Link
                        href="/about"
                        className="text-sm text-muted-foreground hover:text-gray-600"
                      >
                        About Us
                      </Link>
                    </li>
                    {/*<li>
                      <Link
                        href="/blog"
                        className="text-sm text-muted-foreground hover:text-gray-600"
                      >
                        Blog
                      </Link>
                    </li>*/}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Copyright and Legal Links */}
      <div className="py-10 md:flex md:items-center md:justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All Rights Reserved
          </p>
          <div className="mt-4 flex justify-center space-x-8">
            <Link
              href="/terms-of-service"
              className="text-sm text-muted-foreground hover:text-gray-600"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-gray-600"
            >
              Privacy Policy
            </Link>
            <Link
              href="/handmade-guidelines"
              className="text-sm text-muted-foreground hover:text-gray-600"
            >
              Handmade Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
