import { ProductRow } from "@/components/ProductRow";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Yarnnu",
};

export default function Home() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
    <div className="py-20 mx-auto text-center flex flex-col items-center max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Your marketplace for high-quality{" "}
        <span className="text-purple-600">handcrafted goods</span>.
      </h1>
      <p className="mt-6 text-lg max-w-prose text-muted-foreground">
        Welcome to Yarnnu. Every product on our platform is verified by our team
        to ensure our highest quality standards.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <Link href="/products" className={buttonVariants()}>
          Browse Trending
        </Link>
        <Button variant="ghost">Our quality promise &rarr;</Button>
      </div>
    </div>
    <ProductRow category="newest" />
    </section>
  );
}