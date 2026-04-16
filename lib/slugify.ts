/**
 * Turn arbitrary text into a URL-safe slug (lowercase, hyphen-separated).
 * Used for product URL segments combined with Mongo ObjectId.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Non-empty slug for DB / URLs when the name slugifies to nothing. */
export function slugifyOrDefault(text: string, fallback = "product"): string {
  const s = slugify(text);
  return s.length > 0 ? s : fallback;
}
