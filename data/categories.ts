export interface PrimaryCategory {
  id: string;
  name: string;
}

export interface SecondaryCategory {
  id: string;
  name: string;
  primaryCategoryId: string;
}

export const PrimaryCategories = [
  { id: "ART", name: "Art & Collectibles" },
  { id: "BATH", name: "Bath & Beauty" },
  { id: "BOOKS", name: "Books & Media" },
  { id: "CLOTHING", name: "Clothing & Accessories" },
  { id: "CRAFT_SUPPLIES", name: "Handmade Craft Supplies" },
  { id: "HOME", name: "Home & Living" },
  { id: "JEWELRY", name: "Jewelry" },
  { id: "TOYS", name: "Toys & Games" },
] as const;

export const SecondaryCategories = [
  { id: "NECKLACES", name: "Necklaces", primaryCategoryId: "JEWELRY" },
  { id: "RINGS", name: "Rings", primaryCategoryId: "JEWELRY" },
  { id: "EARRINGS", name: "Earrings", primaryCategoryId: "JEWELRY" },
  { id: "BRACELETS", name: "Bracelets", primaryCategoryId: "JEWELRY" },
  { id: "TOPS", name: "Tops", primaryCategoryId: "CLOTHING" },
  { id: "BOTTOMS", name: "Bottoms", primaryCategoryId: "CLOTHING" },
  { id: "DRESSES", name: "Dresses", primaryCategoryId: "CLOTHING" },
  { id: "ACCESSORIES", name: "Accessories", primaryCategoryId: "CLOTHING" },
  { id: "DECOR", name: "Home Decor", primaryCategoryId: "HOME" },
  { id: "KITCHEN", name: "Kitchen & Dining", primaryCategoryId: "HOME" },
  { id: "FURNITURE", name: "Furniture", primaryCategoryId: "HOME" },
  { id: "GARDEN", name: "Garden & Outdoor", primaryCategoryId: "HOME" },
  { id: "PAINTINGS", name: "Paintings", primaryCategoryId: "ART" },
  { id: "PHOTOGRAPHY", name: "Photography", primaryCategoryId: "ART" },
  { id: "SCULPTURES", name: "Sculptures", primaryCategoryId: "ART" },
  { id: "COLLECTIBLES", name: "Collectibles", primaryCategoryId: "ART" },
  { id: "YARN", name: "Yarn", primaryCategoryId: "CRAFT_SUPPLIES" },
  { id: "FABRIC", name: "Fabric", primaryCategoryId: "CRAFT_SUPPLIES" },
  { id: "TOOLS", name: "Tools & Equipment", primaryCategoryId: "CRAFT_SUPPLIES" },
  { id: "BEADS", name: "Beads & Jewelry Making", primaryCategoryId: "CRAFT_SUPPLIES" },
  { id: "PINS", name: "Pins and Brooches", primaryCategoryId: "JEWELRY" },
  { id: "HOMEDECOR", name: "Home Decor", primaryCategoryId: "HOME" },
  { id: "WALLDECOR", name: "Wall Decor", primaryCategoryId: "HOME" },
  { id: "KIDS", name: "Baby and Kids", primaryCategoryId: "HOME" },
  { id: "PETS", name: "Pets", primaryCategoryId: "HOME" },
  { id: "SOAP", name: "Soaps and Washes", primaryCategoryId: "BATH" },
  { id: "SKIN", name: "Skin Care", primaryCategoryId: "BATH" },
  { id: "SPA", name: "Spa and Relaxation", primaryCategoryId: "BATH" },
  { id: "COSMETICS", name: "Cosmetics", primaryCategoryId: "BATH" },
  { id: "HAIR", name: "Hair Care", primaryCategoryId: "BATH" },
  { id: "PAINT", name: "Paint, Stain, and Dye", primaryCategoryId: "CRAFT_SUPPLIES" },
  { id: "TODDLER", name: "Baby and Toddler Toys", primaryCategoryId: "TOYS" },
  { id: "KID", name: "Big Kid Toys", primaryCategoryId: "TOYS" },
  { id: "GAMES", name: "Games and Puzzles", primaryCategoryId: "TOYS" },
  { id: "STUFFED", name: "Stuffed Animals, Dolls, and Plushies", primaryCategoryId: "TOYS" },
  { id: "SENSORY", name: "Sensory Toys", primaryCategoryId: "TOYS" },
  { id: "WOMENS", name: "Women's", primaryCategoryId: "CLOTHING" },
  { id: "MENS", name: "Men's", primaryCategoryId: "CLOTHING" },
  { id: "UNISEX", name: "Unisex", primaryCategoryId: "CLOTHING" },
  { id: "CHILD", name: "Kids and Baby", primaryCategoryId: "HOME" },
  { id: "BAGS", name: "Bags and Purses", primaryCategoryId: "CLOTHING" },
  { id: "COMICS", name: "Books and Comics", primaryCategoryId: "BOOKS" },
  { id: "AUDIO", name: "Music and Audio", primaryCategoryId: "BOOKS" },
  { id: "FIBER", name: "Fiber and Sewing", primaryCategoryId: "CRAFT_SUPPLIES" },
  { id: "PAPER", name: "Paper Supplies", primaryCategoryId: "CRAFT_SUPPLIES" },
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
  ART: ["PAINTINGS", "PHOTOGRAPHY", "SCULPTURES", "COLLECTIBLES"],
  BATH: ["SOAP", "SKIN", "SPA", "COSMETICS", "HAIR"],
  BOOKS: ["COMICS", "AUDIO"],
  CLOTHING: ["TOPS", "BOTTOMS", "DRESSES", "ACCESSORIES", "WOMENS", "MENS", "UNISEX", "CHILD", "BAGS"],
  CRAFT_SUPPLIES: ["YARN", "FABRIC", "TOOLS", "BEADS", "FIBER", "PAPER", "PAINT"],
  HOME: ["DECOR", "KITCHEN", "FURNITURE", "GARDEN", "HOMEDECOR", "WALLDECOR", "KIDS", "PETS"],
  JEWELRY: ["NECKLACES", "RINGS", "EARRINGS", "BRACELETS", "PINS"],
  TOYS: ["TODDLER", "KID", "GAMES", "STUFFED", "SENSORY"],
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
