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
  { id: "NECKLACES", name: "Necklaces" },
  { id: "RINGS", name: "Rings" },
  { id: "EARRINGS", name: "Earrings" },
  { id: "BRACELETS", name: "Bracelets" },
  { id: "PINS", name: "Pins and Brooches" },
  { id: "HOMEDECOR", name: "Home Decor" },
  { id: "KITCHEN", name: "Kitchen and Dining" },
  { id: "WALLDECOR", name: "Wall Decor" },
  { id: "KIDS", name: "Baby and Kids" },
  { id: "PETS", name: "Pets" },
  { id: "SOAP", name: "Soaps and Washes" },
  { id: "SKIN", name: "Skin Care" },
  { id: "SPA", name: "Spa and Relaxation" },
  { id: "COSMETICS", name: "Cosmetics" },
  { id: "HAIR", name: "Hair Care" },
  { id: "PAINTING", name: "Painting" },
  { id: "DRAWING", name: "Drawing and Illustration" },
  { id: "PORTRAITS", name: "Custom Portraits" },
  { id: "PRINTS", name: "Art Prints" },
  { id: "PHOTOGRAPHY", name: "Photography" },
  { id: "TODDLER", name: "Baby and Toddler Toys" },
  { id: "KID", name: "Big Kid Toys" },
  { id: "GAMES", name: "Games and Puzzles" },
  { id: "STUFFED", name: "Stuffed Animals, Dolls, and Plushies" },
  { id: "SENSORY", name: "Sensory Toys" },
  { id: "WOMENS", name: "Women's" },
  { id: "MENS", name: "Men's" },
  { id: "UNISEX", name: "Unisex" },
  { id: "CHILD", name: "Kids and Baby" },
  { id: "BAGS", name: "Bags and Purses" },
  { id: "COMICS", name: "Books and Comics" },
  { id: "AUDIO", name: "Music and Audio" },
  { id: "FIBER", name: "Fiber and Sewing" },
  { id: "PAPER", name: "Paper Supplies" },
  { id: "PAINT", name: "Paint, Stain, and Dye" },
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
  ART: ["PAINTING", "DRAWING", "PORTRAITS", "PRINTS", "PHOTOGRAPHY"],
  BATH: ["SOAP", "SKIN", "SPA", "COSMETICS", "HAIR"],
  BOOKS: ["COMICS", "AUDIO"],
  CLOTHING: ["WOMENS", "MENS", "UNISEX", "CHILD", "BAGS"],
  CRAFT_SUPPLIES: ["FIBER", "PAPER", "PAINT"],
  HOME: ["HOMEDECOR", "KITCHEN", "WALLDECOR", "KIDS", "PETS"],
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
