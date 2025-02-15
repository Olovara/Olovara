export const PrimaryCategories = [
  { id: "ART", name: "Art & Collectibles" },
  { id: "BATH", name: "Bath & Beauty" },
  { id: "BOOKS", name: "Books & Media" },
  { id: "CLOTHING", name: "Clothing & Accessories" },
  { id: "CRAFT_SUPPLIES", name: "Craft Supplies" },
  { id: "HOME", name: "Home & Living" },
  { id: "JEWELRY", name: "Jewelry" },
  { id: "TOYS", name: "Toys & Games" },
];

export const SecondaryCategories = [
  { id: "AMIGURUMI", name: "Amigurumi" },
  { id: "CROCHET", name: "Crochet" },
  { id: "KNITTING", name: "Knitting" },
  { id: "SEWING", name: "Sewing" },
  { id: "TUNISIAN", name: "Tunisian" },
];

/**
 * Map Secondary Categories to Primary Categories
 */
export const CategoryMapping: Record<string, string[]> = {
  ART: ["CROCHET", "KNITTING", "SEWING"],
  BATH: ["CROCHET", "KNITTING", "SEWING"],
  BOOKS: ["CROCHET", "KNITTING", "SEWING"],
  CLOTHING: ["CROCHET", "KNITTING", "TUNISIAN"],
  CRAFT_SUPPLIES: ["SEWING"],
  HOME: ["CROCHET", "KNITTING", "SEWING", "TUNISIAN"],
  JEWELRY: ["CROCHET", "KNITTING", "SEWING"],
  TOYS: ["AMIGURUMI", "CROCHET", "KNITTING"],
};

export const CategoriesMap = {
  PRIMARY: PrimaryCategories,
  SECONDARY: SecondaryCategories,
  MAPPING: CategoryMapping,
};
