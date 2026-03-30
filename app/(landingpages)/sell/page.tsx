import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Users,
  Shield,
  Heart,
  DollarSign,
  Palette,
  MessageCircle,
  Ban,
} from "lucide-react";

export const metadata = {
  title: "Sell on Yarnnu - The Marketplace for Real Makers",
  description:
    "Join a community of authentic artisans. No listing fees, no AI-generated junk, and no corporate investors. Just handmade goods by real people.",
};

export default function SellPage() {
  return (
    <div className="min-h-screen w-full bg-brand-light-neutral-50">
        {/* Hero: full-bleed gradient */}
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-primary-50/60 via-brand-light-neutral-50 to-brand-secondary-50/50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-24">
            <div className="text-center max-w-4xl mx-auto">
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-2 text-sm font-medium bg-brand-primary-100 text-brand-primary-800 border-brand-primary-200"
              >
                <Heart className="w-4 h-4 mr-2" />
                Built for Artisans, By Artisans
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-brand-dark-neutral-900 mb-6">
                Your Craft Deserves an{" "}
                <span className="text-brand-primary-700">Authentic Home</span>
              </h1>

              <p className="text-xl md:text-2xl text-brand-dark-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Yarnnu is the marketplace where humans come first. We’ve banned AI-generated goods and mass-produced dropshipping so your handmade work actually gets seen.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link
                  href="/seller-application"
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "text-lg px-8 py-4 bg-brand-primary-700 text-brand-light-neutral-50 hover:bg-brand-primary-800",
                  })}
                >
                  Apply to Sell
                </Link>
                <Link
                  href="#how-it-works"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "text-lg px-8 py-4 border-brand-primary-700 text-brand-primary-700 hover:bg-brand-primary-700 hover:text-brand-light-neutral-50",
                  })}
                >
                  How it Works
                </Link>
              </div>

              {/* Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="flex flex-col items-center p-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-brand-primary-100">
                    <Ban className="w-7 h-7 text-brand-primary-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">No AI or Mass-Produced</h3>
                  <p className="text-brand-dark-neutral-600 text-sm">Every seller is manually verified to ensure only real, handmade goods reach our buyers.</p>
                </div>
                <div className="flex flex-col items-center p-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-brand-primary-100">
                    <DollarSign className="w-7 h-7 text-brand-primary-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Simple, Fair Pricing</h3>
                  <p className="text-brand-dark-neutral-600 text-sm">No listing fees. No monthly subscriptions. We only succeed when you make a sale.</p>
                </div>
                <div className="flex flex-col items-center p-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-brand-primary-100">
                    <Users className="w-7 h-7 text-brand-primary-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Community Driven</h3>
                  <p className="text-brand-dark-neutral-600 text-sm">We are bootstrapped and investor-free. Our roadmap is driven by seller feedback, not profit margins.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison Section */}
        <section id="pricing" className="py-20 bg-brand-light-neutral-50 border-y border-brand-light-neutral-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-brand-dark-neutral-900 mb-6">
                  Transparent Pricing. <br />No Hidden Costs.
                </h2>
                <p className="text-lg text-brand-dark-neutral-600 mb-8">
                  Most platforms nickel-and-dime you with listing fees, renewal fees, and forced advertising. On Yarnnu, our interests are perfectly aligned with yours.
                </p>
                <ul className="space-y-4">
                  {[
                    "Zero Listing Fees",
                    "Zero Monthly Subscription Fees",
                    "Zero Fees for Expired Listings",
                    "Simple 10% Flat Commission",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-brand-dark-neutral-800 font-medium">
                      <CheckCircle className="w-5 h-5 text-brand-primary-600 mr-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-xl border border-brand-light-neutral-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-brand-light-neutral-100">
                    <span className="text-brand-dark-neutral-600 font-medium">Yarnnu Commission</span>
                    <span className="text-3xl font-bold text-brand-primary-700">10%</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-brand-light-neutral-100">
                    <span className="text-brand-dark-neutral-600 font-medium">Payment Processing (Stripe)</span>
                    <span className="text-xl font-semibold text-brand-dark-neutral-800">2.9% + 30¢</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-brand-dark-neutral-900">Total Per Sale</span>
                    <span className="text-xl font-bold text-brand-primary-700">12.9% + 30¢</span>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-brand-primary-50 rounded-xl border border-brand-primary-100">
                  <p className="text-sm text-brand-primary-900 leading-relaxed">
                    <strong>Note:</strong> We don&apos;t force you to pay for internal ads or &quot;offsite&quot; ads. You keep the vast majority of every sale you make.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Verification Process */}
        <section id="how-it-works" className="py-20">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">How to Join the Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="relative">
                <div className="text-5xl font-black text-brand-primary-100 absolute -top-8 -left-2 z-0">1</div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-2">Apply</h3>
                  <p className="text-brand-dark-neutral-600">Tell us about your craft and share links to your work or social media.</p>
                </div>
              </div>
              <div className="relative">
                <div className="text-5xl font-black text-brand-primary-100 absolute -top-8 -left-2 z-0">2</div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-2">Verification</h3>
                  <p className="text-brand-dark-neutral-600">Our team manually reviews every shop to ensure quality and handmade authenticity.</p>
                </div>
              </div>
              <div className="relative">
                <div className="text-5xl font-black text-brand-primary-100 absolute -top-8 -left-2 z-0">3</div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-2">Start Selling</h3>
                  <p className="text-brand-dark-neutral-600">Once approved, set up your shop and reach buyers who value real craftsmanship.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-20 bg-brand-light-neutral-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark-neutral-900 mb-4">
                Everything You Need to Scale
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:border-brand-primary-300 transition-colors">
                <CardHeader>
                  <Palette className="w-8 h-8 text-brand-primary-600 mb-2" />
                  <CardTitle>Custom Shopfronts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Beautiful, clean shop pages that put your products center stage without distracting banners or unrelated ads.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:border-brand-primary-300 transition-colors">
                <CardHeader>
                  <Shield className="w-8 h-8 text-brand-primary-600 mb-2" />
                  <CardTitle>Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Integrated with Stripe for fast, secure payouts and industry-leading fraud protection.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:border-brand-primary-300 transition-colors">
                <CardHeader>
                  <MessageCircle className="w-8 h-8 text-brand-primary-600 mb-2" />
                  <CardTitle>Direct Messaging</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Chat directly with your customers to handle custom orders, questions, and build lasting relationships.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
<section className="py-20 bg-brand-light-neutral-50 border-t border-brand-light-neutral-200">
  <div className="max-w-4xl mx-auto px-4 md:px-8">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-brand-dark-neutral-900 mb-4">
        Common Questions
      </h2>
      <p className="text-brand-dark-neutral-600">
        Everything you need to know about selling on a marketplace that actually cares.
      </p>
    </div>

    <div className="space-y-8">
      {/* Question 1: The "No AI" Policy */}
      <div className="border-b border-brand-light-neutral-200 pb-6">
        <h3 className="text-lg font-semibold mb-3 text-brand-dark-neutral-900">
          How do you enforce the &quot;No AI&quot; and &quot;No Mass-Produced&quot; policy?
        </h3>
        <p className="text-brand-dark-neutral-600">
          Every shop goes through a manual human review before being allowed to sell. We look for proof of process, consistent branding, and authentic craftsmanship. We also have a community reporting system to ensure the marketplace remains 100% handmade.
        </p>
      </div>

      {/* Question 2: Fees */}
      <div className="border-b border-brand-light-neutral-200 pb-6">
        <h3 className="text-lg font-semibold mb-3 text-brand-dark-neutral-900">
          Are there really no listing or monthly fees?
        </h3>
        <p className="text-brand-dark-neutral-600">
          Correct. We don’t believe in charging you for items that haven&apos;t sold yet. You only pay a 10% commission + standard Stripe processing fees when you actually make money. No &quot;offsite ad&quot; fees and no surprise renewals.
        </p>
      </div>

      {/* Question 3: Bootstrapped/Investors */}
      <div className="border-b border-brand-light-neutral-200 pb-6">
        <h3 className="text-lg font-semibold mb-3 text-brand-dark-neutral-900">
          What does &quot;No Investors&quot; mean for me as a seller?
        </h3>
        <p className="text-brand-dark-neutral-600">
          It means we don&apos;t have shareholders breathing down our necks to &quot;increase growth at all costs.&quot; We don&apos;t have to allow dropshippers just to pump up our numbers. Because we are bootstrapped, our only &quot;bosses&quot; are the artisans who use the platform.
        </p>
      </div>

      {/* Question 4: Payouts */}
      <div className="border-b border-brand-light-neutral-200 pb-6">
        <h3 className="text-lg font-semibold mb-3 text-brand-dark-neutral-900">
          When and how do I get paid?
        </h3>
        <p className="text-brand-dark-neutral-600">
          We use Stripe for all transactions. Payouts are typically processed automatically to your linked bank account on a rolling basis (usually 2-7 days depending on your location and Stripe settings).
        </p>
      </div>

      {/* Question 5: Control */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-brand-dark-neutral-900">
          Do I have control over my own shop policies?
        </h3>
        <p className="text-brand-dark-neutral-600">
          Yes! You set your own shipping rates, return policies, and processing times. Yarnnu provides the tools, but you run your business your way.
        </p>
      </div>
    </div>
  </div>
</section>

        {/* Final CTA */}
        <section className="w-full py-24 bg-brand-primary-900 text-brand-light-neutral-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="max-w-4xl mx-auto text-center px-4 md:px-8 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Join the Handmade Revolution
            </h2>
            <p className="text-xl mb-10 text-brand-primary-100">
              No investors. No AI. No junk. Just a marketplace built for people who make beautiful things.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/seller-application"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "text-lg px-10 py-6 min-h-[3rem] border-0 bg-brand-light-neutral-50 text-brand-primary-900 hover:bg-brand-primary-100 hover:text-brand-primary-900 font-bold shadow-sm"
                )}
              >
                Apply to Sell Today
              </Link>
            </div>
            <p className="mt-8 text-brand-primary-200 text-sm">
              Current review time: 24-48 hours.
            </p>
          </div>
        </section>
      </div>
  );
}