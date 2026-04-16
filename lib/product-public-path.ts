import { slugifyOrDefault } from "@/lib/slugify";

/** Slug segment stored or derived from the current product name. */
export function effectiveProductUrlSlugPart(
  name: string,
  urlSlug?: string | null
): string {
  const fromDb = typeof urlSlug === "string" ? urlSlug.trim() : "";
  if (fromDb.length > 0) return fromDb;
  return slugifyOrDefault(name || "product");
}

/** Site-relative canonical product path: `/products/{slug}-{objectId}` */
export function productPublicPathFromFields(p: {
  id: string;
  name: string;
  urlSlug?: string | null;
}): string {
  const part = effectiveProductUrlSlugPart(p.name, p.urlSlug);
  return `/products/${part}-${p.id}`;
}

/**
 * Parse Mongo ObjectId from the end of a combined slug param (`name-slug-objectId`).
 * ObjectId is 24 hex chars and contains no hyphens, so it is always the final segment.
 */
export function extractMongoProductIdFromSlugParam(param: string): string | null {
  let decoded = param;
  try {
    decoded = decodeURIComponent(param);
  } catch {
    // use raw param
  }
  if (decoded.length < 24) return null;
  const tail = decoded.slice(-24);
  return /^[a-f\d]{24}$/i.test(tail) ? tail : null;
}

export function absoluteProductPageUrl(
  p: { id: string; name: string; urlSlug?: string | null },
  baseUrl?: string
): string {
  const base = (
    baseUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://olovara.com"
  ).replace(/\/$/, "");
  return `${base}${productPublicPathFromFields(p)}`;
}
