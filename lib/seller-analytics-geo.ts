import { db } from "@/lib/db";

const UNKNOWN = "Unknown";

/**
 * Normalize stored analytics `location` JSON (e.g. from IPinfo) to a stable grouping key.
 * Prefers `countryCode`, then 2-letter `country`, then longer country name, else Unknown.
 */
export function countryKeyFromLocationJson(loc: unknown): string {
  if (loc === null || loc === undefined || typeof loc !== "object") {
    return UNKNOWN;
  }
  const o = loc as Record<string, unknown>;
  const code = o.countryCode;
  if (typeof code === "string") {
    const t = code.trim();
    if (t.length >= 2) return t.slice(0, 2).toUpperCase();
  }
  const country = o.country;
  if (typeof country === "string") {
    const t = country.trim();
    if (t.length === 2) return t.toUpperCase();
    if (t.length > 2) return t;
  }
  return UNKNOWN;
}

/**
 * Country for a paid order: `buyerLocation` JSON when present, else Stripe `taxJurisdiction` (often ISO country).
 */
export function countryKeyFromPurchase(
  buyerLocation: unknown,
  taxJurisdiction: string | null | undefined
): string {
  const fromLoc = countryKeyFromLocationJson(buyerLocation);
  if (fromLoc !== UNKNOWN) return fromLoc;
  if (typeof taxJurisdiction === "string" && taxJurisdiction.trim()) {
    const t = taxJurisdiction.trim();
    return t.length <= 2 ? t.toUpperCase() : t;
  }
  return UNKNOWN;
}

const regionNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function labelForCountryKey(key: string): string {
  if (key === UNKNOWN) return UNKNOWN;
  if (key.length === 2 && regionNames) {
    try {
      const name = regionNames.of(key);
      if (name) return name;
    } catch {
      /* ignore */
    }
  }
  return key;
}

/**
 * Batched scan of product VIEW rows (location only) to avoid loading full documents.
 * Uses id-ordered cursor pagination (stable with Mongo ObjectId ordering).
 */
export async function aggregateProductViewsByCountry(
  productIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (productIds.length === 0) return counts;

  const batchSize = 2500;
  let cursorId: string | undefined;

  for (;;) {
    const rows = await db.productInteraction.findMany({
      where: {
        productId: { in: productIds },
        interactionType: "VIEW",
        ...(cursorId ? { id: { gt: cursorId } } : {}),
      },
      select: { id: true, location: true },
      orderBy: { id: "asc" },
      take: batchSize,
    });

    if (rows.length === 0) break;

    for (const r of rows) {
      const k = countryKeyFromLocationJson(r.location);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    cursorId = rows[rows.length - 1]!.id;
    if (rows.length < batchSize) break;
  }

  return counts;
}
