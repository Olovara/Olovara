import { notFound, permanentRedirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { productPublicPathFromFields } from "@/lib/product-public-path";

/**
 * Legacy `/product/[id]` URLs permanently redirect to `/products/[slug]-[id]`
 * so old links and bookmarks keep working while SEO uses the canonical path.
 */
export default async function LegacyProductRedirect({
  params,
}: {
  params: { id: string };
}) {
  if (!ObjectId.isValid(params.id)) {
    notFound();
  }

  const product = await db.product.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, urlSlug: true },
  });

  if (!product) {
    notFound();
  }

  permanentRedirect(productPublicPathFromFields(product));
}
