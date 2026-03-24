/** Seller settings tabs — used for sidebar search deep links to `/seller/dashboard/settings#<id>`. */
export const SELLER_SETTINGS_TAB_SEARCH = [
  { id: "about", label: "About", keywords: "about, bio, story" },
  { id: "info", label: "Info", keywords: "info, contact, address, details" },
  {
    id: "preferences",
    label: "Preferences",
    keywords: "preferences, notifications",
  },
  { id: "policies", label: "Policies", keywords: "policies, returns, refunds" },
  {
    id: "exclusions",
    label: "Exclusions",
    keywords: "exclusions, countries, country, blocked, shipping",
  },
  { id: "seo", label: "SEO", keywords: "seo, meta, search, og, google" },
  { id: "qr", label: "QR Code", keywords: "qr, code, barcode" },
] as const;

export const SELLER_SETTINGS_VALID_TAB_IDS: string[] =
  SELLER_SETTINGS_TAB_SEARCH.map((t) => t.id);
