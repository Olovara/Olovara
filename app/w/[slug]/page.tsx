import { notFound } from "next/navigation";
import { getWishlistBySlug } from "@/actions/wishlistActions";
import { WishlistSharedView } from "@/components/wishlist/WishlistSharedView";

interface WishlistPageProps {
  params: {
    slug: string;
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const result = await getWishlistBySlug(params.slug);

  if (!result.success || !result.wishlist) {
    notFound();
  }

  return <WishlistSharedView wishlist={result.wishlist} />;
}
