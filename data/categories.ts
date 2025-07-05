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
  // Jewelry - Necklaces
  { id: "CHOKERS", name: "Chokers", secondaryCategoryId: "NECKLACES" },
  { id: "BEADED_NECKLACES", name: "Beaded Necklaces", secondaryCategoryId: "NECKLACES" },
  { id: "PENDANT_NECKLACES", name: "Pendant Necklaces", secondaryCategoryId: "NECKLACES" },
  { id: "LAYERED_NECKLACES", name: "Layered Necklaces", secondaryCategoryId: "NECKLACES" },
  { id: "STATEMENT_NECKLACES", name: "Statement Necklaces", secondaryCategoryId: "NECKLACES" },
  
  // Jewelry - Rings
  { id: "ENGAGEMENT_RINGS", name: "Engagement Rings", secondaryCategoryId: "RINGS" },
  { id: "WEDDING_RINGS", name: "Wedding Rings", secondaryCategoryId: "RINGS" },
  { id: "STACKING_RINGS", name: "Stacking Rings", secondaryCategoryId: "RINGS" },
  { id: "COCKTAIL_RINGS", name: "Cocktail Rings", secondaryCategoryId: "RINGS" },
  
  // Jewelry - Earrings
  { id: "STUDS", name: "Studs", secondaryCategoryId: "EARRINGS" },
  { id: "HOOPS", name: "Hoops", secondaryCategoryId: "EARRINGS" },
  { id: "DANGLES", name: "Dangles", secondaryCategoryId: "EARRINGS" },
  { id: "CHANDELIER", name: "Chandelier", secondaryCategoryId: "EARRINGS" },
  
  // Craft Supplies - Yarn
  { id: "COTTON_YARN", name: "Cotton Yarn", secondaryCategoryId: "YARN" },
  { id: "WOOL_YARN", name: "Wool Yarn", secondaryCategoryId: "YARN" },
  { id: "ACRYLIC_YARN", name: "Acrylic Yarn", secondaryCategoryId: "YARN" },
  { id: "MERINO_WOOL", name: "Merino Wool", secondaryCategoryId: "YARN" },
  { id: "BULKY_YARN", name: "Bulky Yarn", secondaryCategoryId: "YARN" },
  { id: "FINGERING_YARN", name: "Fingering Yarn", secondaryCategoryId: "YARN" },
  
  // Home - Decor
  { id: "WALL_ART", name: "Wall Art", secondaryCategoryId: "DECOR" },
  { id: "CANDLES", name: "Candles", secondaryCategoryId: "DECOR" },
  { id: "VASES", name: "Vases", secondaryCategoryId: "DECOR" },
  { id: "THROW_PILLOWS", name: "Throw Pillows", secondaryCategoryId: "DECOR" },
  { id: "RUGS", name: "Rugs", secondaryCategoryId: "DECOR" },
  
  // Bath - Soaps
  { id: "BAR_SOAP", name: "Bar Soap", secondaryCategoryId: "SOAP" },
  { id: "LIQUID_SOAP", name: "Liquid Soap", secondaryCategoryId: "SOAP" },
  { id: "BATH_BOMBS", name: "Bath Bombs", secondaryCategoryId: "SOAP" },
  { id: "SHOWER_GELS", name: "Shower Gels", secondaryCategoryId: "SOAP" },
  
  // Toys - Stuffed Animals
  { id: "TEDDY_BEARS", name: "Teddy Bears", secondaryCategoryId: "STUFFED" },
  { id: "ANIMALS", name: "Animals", secondaryCategoryId: "STUFFED" },
  { id: "DOLLS", name: "Dolls", secondaryCategoryId: "STUFFED" },
  { id: "PLUSHIES", name: "Plushies", secondaryCategoryId: "STUFFED" },
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

/**
 * Map Tertiary Categories to Secondary Categories
 */
export const TertiaryCategoryMapping: Record<string, string[]> = {
  NECKLACES: ["CHOKERS", "BEADED_NECKLACES", "PENDANT_NECKLACES", "LAYERED_NECKLACES", "STATEMENT_NECKLACES"],
  RINGS: ["ENGAGEMENT_RINGS", "WEDDING_RINGS", "STACKING_RINGS", "COCKTAIL_RINGS"],
  EARRINGS: ["STUDS", "HOOPS", "DANGLES", "CHANDELIER"],
  YARN: ["COTTON_YARN", "WOOL_YARN", "ACRYLIC_YARN", "MERINO_WOOL", "BULKY_YARN", "FINGERING_YARN"],
  DECOR: ["WALL_ART", "CANDLES", "VASES", "THROW_PILLOWS", "RUGS"],
  SOAP: ["BAR_SOAP", "LIQUID_SOAP", "BATH_BOMBS", "SHOWER_GELS"],
  STUFFED: ["TEDDY_BEARS", "ANIMALS", "DOLLS", "PLUSHIES"],
};

/**
 * Helper function to get tertiary categories for a secondary category
 */
export const getTertiaryCategories = (secondaryId: string): string[] =>
  TertiaryCategoryMapping[secondaryId] || [];

export const CategoriesMap = {
  PRIMARY: PrimaryCategories,
  SECONDARY: SecondaryCategories,
  TERTIARY: TertiaryCategories,
  MAPPING: CategoryMapping,
  TERTIARY_MAPPING: TertiaryCategoryMapping,
  getSecondaryCategories,
  getTertiaryCategories,
};
