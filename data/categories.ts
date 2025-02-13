export const PrimaryCategories = [
  { id: "ACCESSORIES", name: "Accessories" },
  { id: "CLOTHING", name: "Clothing" },
  { id: "CRAFT_SUPPLIES", name: "Craft Supplies" },
  { id: "PATTERNS", name: "Patterns" },
  { id: "TOYS", name: "Toys" },
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
  ACCESSORIES: ["CROCHET", "KNITTING", "SEWING"],
  CLOTHING: ["CROCHET", "KNITTING", "TUNISIAN"],
  CRAFT_SUPPLIES: ["SEWING"],
  PATTERNS: ["CROCHET", "KNITTING", "SEWING", "TUNISIAN"],
  TOYS: ["AMIGURUMI", "CROCHET", "KNITTING"],
};

export const CategoriesMap = {
  PRIMARY: PrimaryCategories,
  SECONDARY: SecondaryCategories,
  MAPPING: CategoryMapping,
};
