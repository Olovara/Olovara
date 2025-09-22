"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LocationModal } from "./LocationModal";
import NewsletterSubscriptionForm from "./NewsletterSubscriptionForm";
import { PinterestIcon, RedditIcon } from "./ui/social-icon";

// Animated Footer Link Component
const AnimatedFooterLink = ({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Link href={href} className={`group relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <span
        className="absolute bottom-0 left-0 w-0 h-px bg-gray-600 transition-[width] duration-200 ease-out group-hover:w-full"
        onMouseEnter={(e) => {
          e.currentTarget.style.transition = "width 200ms ease-out";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transition = "width 400ms ease-out";
        }}
      ></span>
    </Link>
  );
};

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
              <p className="text-lg font-semibold text-gray-900">YARNNU</p>
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
                <h3 className="font-semibold text-gray-900">BECOME A SELLER</h3>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 text-center sm:text-left">
                {/* Marketplace Links */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">
                    MARKETPLACE
                  </h4>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <AnimatedFooterLink
                        href="/products"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        BROWSE PRODUCTS
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/categories"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        CATEGORIES
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/shops"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        BROWSE SHOPS
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/sell"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        SELL ON YARNNU
                      </AnimatedFooterLink>
                    </li>
                  </ul>
                </div>

                {/* Support Links */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">
                    SUPPORT
                  </h4>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <AnimatedFooterLink
                        href="/pricing-calculator"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        PRICING CALCULATOR
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/contact"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        CONTACT US
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/buyer-and-returns-policy"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        BUYER AND RETURNS POLICY
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/prohibited-items"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        PROHIBITED ITEMS POLICY
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/copyright-infringement"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        COPYRIGHT INFRINGMENT
                      </AnimatedFooterLink>
                    </li>
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">
                    COMPANY
                  </h4>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <AnimatedFooterLink
                        href="/about"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        ABOUT US
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/feedback"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        CUSTOMER FEEDBACK
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/suggestions"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        SUGGESTIONS
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/blog"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        BLOG
                      </AnimatedFooterLink>
                    </li>
                    <li>
                      <AnimatedFooterLink
                        href="/help-center"
                        className="text-xs text-muted-foreground hover:text-gray-600"
                      >
                        HELP CENTER
                      </AnimatedFooterLink>
                    </li>
                  </ul>
                </div>

                {/* Newsletter Subscription and Social Links */}
                <div className="text-center sm:text-left">
                  <NewsletterSubscriptionForm variant="compact" />

                  {/* Social Media Links */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      FOLLOW US
                    </h4>
                    <div className="flex justify-center sm:justify-start space-x-3">
                      <a
                        href="https://www.reddit.com/r/Yarnnu/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 hover:bg-purple-300 rounded-full transition-colors"
                        aria-label="Follow us on Reddit"
                      >
                        <RedditIcon className="w-4 h-4" />
                      </a>
                      <a
                        href="https://www.pinterest.com/yarnnumarketplace/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 hover:bg-purple-300 rounded-full transition-colors"
                        aria-label="Follow us on Pinterest"
                      >
                        <PinterestIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Copyright and Legal Links */}
      <div className="py-10 md:flex md:items-center md:justify-between bg-gray-100 px-6">
        <div className="mb-4 md:mb-0">
          <LocationModal />
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED
          </p>
          <div className="mt-4 flex justify-center space-x-8">
            <Link
              href="/terms-of-service"
              className="text-xs text-muted-foreground hover:text-gray-600"
            >
              TERMS
            </Link>
            <Link
              href="/privacy-policy"
              className="text-xs text-muted-foreground hover:text-gray-600"
            >
              PRIVACY POLICY
            </Link>
            <Link
              href="/handmade-guidelines"
              className="text-xs text-muted-foreground hover:text-gray-600"
            >
              HANDMADE GUIDELINES
            </Link>
          </div>
        </div>
        <div className="hidden md:block w-[180px]"></div>{" "}
        {/* Spacer to balance the layout */}
      </div>
    </footer>
  );
};

export default Footer;
