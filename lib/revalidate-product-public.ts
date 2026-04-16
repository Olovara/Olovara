import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { productPublicPathFromFields } from "@/lib/product-public-path";

/** Invalidate legacy `/product/[id]` and canonical `/products/[slug]-[id]` caches. */
export async function revalidateProductPublicPaths(productId: string) {
  revalidatePath(`/product/${productId}`);
  const p = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, urlSlug: true },
  });
  if (p) {
    revalidatePath(productPublicPathFromFields(p));
  }
}
