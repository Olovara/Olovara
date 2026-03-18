import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Factory,
  Search,
  UserCheck,
  Sparkles,
  Gift,
  HeartHandshake,
  MessageCircle,
  Package,
  Shield,
  Lock,
  Headphones,
  Star,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Why Shop on Yarnnu – Real Handmade Only",
  description:
    "Discover real handmade goods from verified independent makers. No dropshipping, no factories – just authentic craft and unique gifts on Yarnnu.",
};

export default function BuyLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <Badge className="mb-5 bg-purple-100 text-purple-800 border-purple-200">
              Real Handmade • No Dropshippers
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Real Handmade Goods
              <br />
              <span className="text-purple-600">
                From Independent Makers
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-xl leading-relaxed">
              Discover unique handmade gifts created by real artisans.
              No factories. No dropshipping. Just authentic craft.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link href="/products">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700"
                >
                  Browse Handmade
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-4 border-purple-200 text-purple-700 bg-white/80 hover:bg-purple-50"
                asChild
              >
                <Link href="#discover">Explore Gifts</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Loved by real buyers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-500" />
                <span>Handmade-only marketplace</span>
              </div>
            </div>
          </div>

          {/* Right: Lifestyle image / visual */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-purple-100 bg-white">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/images/handmade-lifestyle.jpg"
                  alt="Lifestyle scene of handmade products from independent makers on Yarnnu"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3 border border-purple-100">
              <Package className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Hand-packed by the maker
                </p>
                <p className="text-xs text-gray-500">
                  Every order ships directly from an independent studio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Handmade Isn&apos;t Always Handmade
            </h2>
            <p className="text-lg text-gray-600">
              Big marketplaces are crowded with factory goods and resellers.
              Finding something truly handmade takes too much work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-red-100 bg-red-50/60">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Factory className="w-5 h-5 text-red-500" />
                </div>
                <CardTitle className="text-lg">
                  Mass-Produced Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm">
                  Many &quot;handmade&quot; marketplaces are flooded with
                  factory-made products that look the same across hundreds of
                  shops.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-amber-100 bg-amber-50/60">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <CardTitle className="text-lg">
                  Resellers &amp; Dropshippers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm">
                  Items ship directly from overseas warehouses, not from a maker
                  who actually created what you&apos;re buying.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-blue-100 bg-blue-50/60">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle className="text-lg">
                  Hard to Find Real Makers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm">
                  Authentic artisans get buried under thousands of listings,
                  making it difficult to discover truly special work.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Yarnnu Difference */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              A Marketplace Built for Real Handmade
            </h2>
            <p className="text-lg text-purple-100">
              Yarnnu is designed from the ground up to protect buyers and makers
              who care about authenticity, quality, and story.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-purple-200" />
                </div>
                <CardTitle className="text-lg text-white">
                  Verified Handmade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-100 text-sm">
                  Every seller must make what they list. We review shops against
                  our handmade guidelines, not just check a box.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-200" />
                </div>
                <CardTitle className="text-lg text-white">
                  Unique Gifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-100 text-sm">
                  Find one-of-a-kind pieces and small-batch work you won&apos;t
                  see cloned across every marketplace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5 text-purple-200" />
                </div>
                <CardTitle className="text-lg text-white">
                  Support Independent Makers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-100 text-sm">
                  Your money goes directly to small studios and individual
                  artists — not faceless factories or resellers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-purple-200" />
                </div>
                <CardTitle className="text-lg text-white">
                  Talk Directly to the Maker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-purple-100 text-sm">
                  Message sellers with questions, sizing help, or custom
                  requests. You&apos;re talking to the person who actually made
                  it.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Discovery */}
      <section id="discover" className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Discover Something Unique
              </h2>
              <p className="text-lg text-gray-600 max-w-xl">
                From cozy knits to sculpted ceramics, explore handmade work that
                actually feels personal.
              </p>
            </div>
            <Link href="/products">
              <Button
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Browse All Categories
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Crochet & Knitting",
                description: "Handmade scarves, blankets, amigurumi, and more.",
                gradient: "from-pink-200 via-purple-200 to-blue-200",
              },
              {
                name: "Jewelry",
                description: "One-of-a-kind pieces made in small studios.",
                gradient: "from-yellow-200 via-rose-200 to-red-200",
              },
              {
                name: "Woodwork",
                description: "Carved, turned, and hand-finished wooden goods.",
                gradient: "from-amber-200 via-orange-200 to-rose-200",
              },
              {
                name: "Home Decor",
                description:
                  "Textiles, wall art, candles, and decor with a human touch.",
                gradient: "from-blue-200 via-cyan-200 to-teal-200",
              },
              {
                name: "Art",
                description:
                  "Original paintings, prints, and illustrations by real artists.",
                gradient: "from-purple-200 via-indigo-200 to-sky-200",
              },
              {
                name: "Pottery",
                description: "Wheel-thrown mugs, bowls, vases, and more.",
                gradient: "from-green-200 via-emerald-200 to-teal-200",
              },
            ].map((category) => (
              <Card
                key={category.name}
                className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className={`h-40 bg-gradient-to-tr ${category.gradient} relative`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.6),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.6),transparent_60%)]" />
                </div>
                <CardHeader className="pb-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Shopping
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No confusing fees, no mystery sellers. Just a clear path from
              discovery to delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-purple-100 bg-white">
              <CardHeader className="pb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  Step 1
                </p>
                <CardTitle className="text-lg">
                  Discover handmade products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-600">
                  Browse items from verified independent makers, curated to keep
                  factory goods out.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-white">
              <CardHeader className="pb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  Step 2
                </p>
                <CardTitle className="text-lg">
                  Buy directly from the seller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-600">
                  Secure checkout powered by Stripe so your payment is safe and
                  the maker gets paid quickly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-white">
              <CardHeader className="pb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  Step 3
                </p>
                <CardTitle className="text-lg">
                  Receive your handmade item
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-600">
                  The maker ships your order directly from their studio with
                  personal care and packaging.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-white">
              <CardHeader className="pb-3">
                <p className="text-xs font-semibold text-purple-600 mb-1">
                  Optional
                </p>
                <CardTitle className="text-lg">
                  Request custom work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-gray-600">
                  Many makers accept custom orders. Message them to create
                  something made just for you.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[1.2fr_minmax(0,1fr)] gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500" />
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              &quot;Beautiful craftsmanship. I love supporting real artists.&quot;
            </p>
            <p className="text-base text-gray-600 mb-2">— Sarah M.</p>
            <p className="text-sm text-gray-500">
              Bought a hand-knit baby blanket and custom ceramic mug set on
              Yarnnu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-purple-50 border-purple-100">
              <CardContent className="py-6">
                <p className="text-2xl font-bold text-purple-700 mb-1">
                  1,000+
                </p>
                <p className="text-sm text-gray-700">
                  Handmade products
                  <br />
                  and growing
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="py-6">
                <p className="text-2xl font-bold text-blue-700 mb-1">
                  200+
                </p>
                <p className="text-sm text-gray-700">
                  Independent makers
                  <br />
                  worldwide
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Handmade Guarantee */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Handmade Promise
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Yarnnu is built for genuine handmade work. We aggressively remove
              anything that doesn&apos;t belong.
            </p>
          </div>

          <Card className="border-purple-100 bg-white shadow-md">
            <CardContent className="py-8 px-6 md:px-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-base text-gray-700 mb-3">
                      Every product must be made by the seller. We regularly
                      review shops, investigate reports, and remove listings
                      that break our rules.
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      We do not allow:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Dropshipping</li>
                      <li>Mass-produced factory items</li>
                      <li>Reselling generic wholesale goods</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shopping You Can Feel Good About
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine the warmth of buying from a local market with the
              safety and clarity of a modern platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-gray-100 bg-gray-50">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-9 h-9 rounded-full bg-white flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Secure Checkout
                    </h3>
                    <p className="text-sm text-gray-600">
                      Payments safely processed with Stripe. Your details stay
                      encrypted and protected.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 bg-gray-50">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-9 h-9 rounded-full bg-white flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Direct Seller Communication
                    </h3>
                    <p className="text-sm text-gray-600">
                      Ask questions before buying. Get clarity on materials,
                      sizing, and custom options.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 bg-gray-50">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-9 h-9 rounded-full bg-white flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Buyer Support
                    </h3>
                    <p className="text-sm text-gray-600">
                      We&apos;re here if something goes wrong. Our team actually
                      cares about handmade.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Next Handmade Treasure
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Skip the generic. Shop from real people making real things with
            care, one piece at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link href="/products">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-4 bg-white text-purple-700 hover:bg-gray-100"
              >
                Browse Handmade
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-4 border-white/60 text-white bg-white/10 hover:bg-white hover:text-purple-700"
              asChild
            >
              <Link href="#discover">Shop Gifts</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs md:text-sm opacity-80 mt-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Support independent makers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              <span>Thoughtful gifts they&apos;ll actually keep</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

