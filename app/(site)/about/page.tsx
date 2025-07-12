import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Heart, 
  Star, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  Award,
  DollarSign,
  Palette,
  MessageCircle,
  Truck,
  CheckCircle
} from "lucide-react";

export const metadata = {
  title: "About Yarnnu - Built by Artisans, for Artisans",
  description: "Learn about Yarnnu's story - from a husband wanting to help his wife sell her crochet creations to a marketplace built for handmade creators. Join our founding seller program.",
};

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 border-purple-200">
              <Heart className="w-4 h-4 mr-2" />
              Our Story
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Built by{" "}
              <span className="text-purple-600">Artisans</span>, for{" "}
              <span className="text-purple-600">Artisans</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Yarnnu was born from a simple desire: to help my wife share her crochet creations 
              with the world. What started as a personal project has grown into a marketplace 
              that truly understands handmade creators.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Story Behind Yarnnu
            </h2>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">How It All Started</h3>
              <p className="text-gray-700 mb-4">
                My wife loves to crochet. She creates beautiful plushies and loves getting custom orders, 
                selling at craft fairs, and seeing the smiles her creations bring to people&apos;s faces. 
                She wanted to share her passion with more people, so we looked into selling online.
              </p>
              <p className="text-gray-700 mb-4">
                What we found was disappointing. The existing marketplaces had lost their way. 
                They were full of drop shippers and resellers, making it hard for true handmade 
                creators to compete. The fees were ridiculous - listing fees, advertising fees, 
                it seemed like everything had a fee attached to it.
              </p>
              <p className="text-gray-700">
                That&apos;s when I got the idea for Yarnnu. It originally started as a place for 
                just knitting and crocheting, but evolved into a marketplace for any handmade item. 
                I wanted to create a place that thrives on creativity and authenticity.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 mb-4">
                I dream of a platform that is more than just a marketplace. I want to build a community 
                where artisans can learn, grow, and support each other. Being a solopreneur can be lonely, 
                and it can be hard to find the answers you need.
              </p>
              <p className="text-gray-700 mb-4">
                I want to foster a community that helps you improve and learn new skills both in your 
                craft and your business. I also want to provide robust tools that help you focus on 
                doing what you love and spend less time on mundane administrative tasks.
              </p>
              <p className="text-gray-700">
                Most importantly, I want Yarnnu to be transparent and truly listen to the sellers 
                on the platform, doing what is best for them, not investors or someone else.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why We&apos;re Different</h3>
              <p className="text-gray-700 mb-4">
                I chose to bootstrap Yarnnu because I believe that when you take investor money, 
                you start catering to what investors want rather than what sellers need. Sure, 
                it would be easier with a ton of cash, but the cost would be losing focus on 
                what matters most - serving the handmade community.
              </p>
              <p className="text-gray-700 mb-4">
                Yarnnu will have an application process, so you&apos;ll know that everyone on the 
                site is selling real products handmade by real people. No AI or drop shippers, 
                no factory-made goods, just real high-quality handmade goods that you&apos;ll be 
                proud to have and show off.
              </p>
              <p className="text-gray-700">
                I hate fees and I hate subscriptions. Yarnnu operates off a simple percentage 
                commission, so we only make money when you do. You&apos;ll never have to worry 
                about a negative return on your investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Seller Program */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-white/20 text-white border-white/30">
            <Award className="w-4 h-4 mr-2" />
            Limited Time Opportunity
          </Badge>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our First 50 Founding Sellers
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of something special from the beginning. Get exclusive benefits and help 
            shape a marketplace built for artisans, by artisans.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-300" />
              <h3 className="font-semibold mb-2">Lifetime 8% Commission</h3>
              <p className="text-sm opacity-80">Lock in 2% savings forever (vs 10% for regular sellers)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="w-8 h-8 mx-auto mb-3 text-blue-300" />
              <h3 className="font-semibold mb-2">Priority Placement</h3>
              <p className="text-sm opacity-80">Featured in search results and categories for 1 year</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Award className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
              <h3 className="font-semibold mb-2">Showcase Opportunities</h3>
              <p className="text-sm opacity-80">Featured in blogs, emails, and social media marketing</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sell" className={buttonVariants({ size: "lg", className: "text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100" })}>
              Learn More About Founding Sellers
            </Link>
            <Link href="/seller-application" className={buttonVariants({ size: "lg", className: "text-lg px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-purple-600" })}>
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Stand For
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do at Yarnnu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Authenticity</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every product on Yarnnu is truly handmade by real people. 
                  No drop shippers, no AI-generated content, no factory-made goods.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Simple, honest pricing. No hidden fees, no surprise charges. 
                  We only make money when you do.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Built without investors, so we listen to sellers, not shareholders. 
                  Your feedback shapes our future.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Every seller is verified by our team. We maintain high standards 
                  so customers trust and return to our marketplace.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Powerful tools designed specifically for handmade sellers. 
                  Focus on your craft, not administrative tasks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect with customers worldwide. International shipping 
                  and multi-currency support to grow your business globally.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet the Founder
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Hi, I&apos;m Simeon</h3>
                <p className="text-gray-700 mb-4">
                  I came up with the idea for Yarnnu a little over a year ago. At the time, 
                  I knew nothing about web development, but I was crazy enough to begin this whole process.
                </p>
                <p className="text-gray-700 mb-4">
                  I spent the first 4-5 months learning how to create a website and figuring out 
                  what technologies I wanted to use. My first attempts were horrific, but I kept at it. 
                  Looking back, I can see how much I have learned and how much better I have become.
                </p>
                <p className="text-gray-700 mb-6">
                  My thought process behind wanting to start Yarnnu was simple: it seems like most 
                  every company is in a race to the bottom with &quot;how much money can we make&quot; 
                  and &quot;how awful can we make our user experience.&quot; For a handmade marketplace, 
                  that&apos;s an insult to all the time, care, and attention you put into each creation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/sell" className={buttonVariants({ className: "bg-purple-600 hover:bg-purple-700" })}>
                    Join as a Founding Seller
                  </Link>
                  <Link href="/contact" className={buttonVariants({ variant: "outline" })}>
                    Get in Touch
                  </Link>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-8 text-center">
                <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-12 h-12 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Built with Love</h4>
                <p className="text-gray-600 text-sm">
                  Created to help my wife share her crochet creations, 
                  now helping artisans worldwide share their passion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Be Part of Something Special?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join Yarnnu today and be part of a marketplace that truly understands handmade creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sell" className={buttonVariants({ size: "lg", className: "text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700" })}>
              Become a Founding Seller
            </Link>
            <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg", className: "text-lg px-8 py-4" })}>
              Shop Handmade Goods
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
