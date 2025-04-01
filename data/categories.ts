export const PrimaryCategories = [
  { id: "ART", name: "Art & Collectibles" },
  { id: "BATH", name: "Bath & Beauty" },
  { id: "BOOKS", name: "Books & Media" },
  { id: "CLOTHING", name: "Clothing & Accessories" },
  { id: "CRAFT_SUPPLIES", name: "Craft Supplies" },
  { id: "HOME", name: "Home & Living" },
  { id: "JEWELRY", name: "Jewelry" },
  { id: "TOYS", name: "Toys & Games" },
] as const;

export const SecondaryCategories = [
  { id: "AMIGURUMI", name: "Amigurumi" },
  { id: "CROCHET", name: "Crochet" },
  { id: "KNITTING", name: "Knitting" },
  { id: "SEWING", name: "Sewing" },
  { id: "TUNISIAN", name: "Tunisian" },
] as const;

export const TertiaryCategories = [
  { id: "AMIGURUMI", name: "Amigurumi" },
  { id: "CROCHET", name: "Crochet" },
  { id: "KNITTING", name: "Knitting" },
  { id: "SEWING", name: "Sewing" },
  { id: "TUNISIAN", name: "Tunisian" },
] as const;

// Extract IDs for strict typing
type PrimaryCategoryID = (typeof PrimaryCategories)[number]["id"];
type SecondaryCategoryID = (typeof SecondaryCategories)[number]["id"];

/**
 * Map Secondary Categories to Primary Categories
 */
export const CategoryMapping: Record<PrimaryCategoryID, SecondaryCategoryID[]> = {
  ART: ["CROCHET", "KNITTING", "SEWING"],
  BATH: ["CROCHET", "KNITTING", "SEWING"],
  BOOKS: ["CROCHET", "KNITTING", "SEWING"],
  CLOTHING: ["CROCHET", "KNITTING", "TUNISIAN"],
  CRAFT_SUPPLIES: ["SEWING"],
  HOME: ["CROCHET", "KNITTING", "SEWING", "TUNISIAN"],
  JEWELRY: ["CROCHET", "KNITTING", "SEWING"],
  TOYS: ["AMIGURUMI", "CROCHET", "KNITTING"],
};

/**
 * Helper function to get secondary categories for a primary category
 */
export const getSecondaryCategories = (primaryId: PrimaryCategoryID): SecondaryCategoryID[] =>
  CategoryMapping[primaryId] || [];

export const CategoriesMap = {
  PRIMARY: PrimaryCategories,
  SECONDARY: SecondaryCategories,
  MAPPING: CategoryMapping,
  getSecondaryCategories,
};
