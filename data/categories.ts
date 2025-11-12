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
  { id: "PRINTS", name: "Prints", primaryCategoryId: "ART" },
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
  { id: "POLYESTER_YARN", name: "Polyester Yarn", secondaryCategoryId: "YARN" },
  
  // Home - Decor
  { id: "WALL_ART", name: "Wall Art", secondaryCategoryId: "DECOR" },
  { id: "CANDLES", name: "Candles", secondaryCategoryId: "DECOR" },
  { id: "VASES", name: "Vases", secondaryCategoryId: "DECOR" },
  { id: "THROW_PILLOWS", name: "Throw Pillows", secondaryCategoryId: "DECOR" },
  { id: "RUGS", name: "Rugs", secondaryCategoryId: "DECOR" },

  // Bath - Soap
  { id: "BAR_SOAP", name: "Bar Soap", secondaryCategoryId: "SOAP" },
  { id: "LIQUID_SOAP", name: "Liquid Soap", secondaryCategoryId: "SOAP" },
  { id: "BATH_BOMBS", name: "Bath Bombs", secondaryCategoryId: "SOAP" },
  { id: "SHOWER_GELS", name: "Shower Gels", secondaryCategoryId: "SOAP" },
  { id: "BATH_SALTS_AND_SCRUBS", name: "Bath Salts and Scrubs", secondaryCategoryId: "SOAP" },
  { id: "BATH_OILS", name: "Bath Oils", secondaryCategoryId: "SOAP" },
  
  // Bath - Skin Care
  { id: "FACIAL_CARE", name: "Facial Care", secondaryCategoryId: "SKIN" },
  { id: "MOISTURIZERS", name: "Moisturizers", secondaryCategoryId: "SKIN" },
  { id: "BALMS_AND_SALVES", name: "Balms and Salves", secondaryCategoryId: "SKIN" },
  { id: "EXFOLIATION", name: "Exfoliation", secondaryCategoryId: "SKIN" },
  { id: "EYE_TREATMENTS", name: "Eye Treatments", secondaryCategoryId: "SKIN" },

  // Bath - Spa and Relaxation
  { id: "AROMATHERAPY", name: "Aromatherapy", secondaryCategoryId: "SPA" },
  { id: "HEAT_AND_COLD_PACKS", name: "Heat and Cold Packs", secondaryCategoryId: "SPA" },
  { id: "MASSAGE", name: "Massage", secondaryCategoryId: "SPA" },
  { id: "ESSENTIAL_OILS", name: "Essential Oils", secondaryCategoryId: "SPA" },
  { id: "SPA_KITS", name: "Spa Kits", secondaryCategoryId: "SPA" },

  // Bath - Cosmetics
  { id: "EYES", name: "Eyes", secondaryCategoryId: "COSMETICS" },
  { id: "LIPS", name: "Lips", secondaryCategoryId: "COSMETICS" },
  { id: "FACE", name: "Face", secondaryCategoryId: "COSMETICS" },
  { id: "NAILS_AND_NAIL_CARE", name: "Nails and Nail Care", secondaryCategoryId: "COSMETICS" },
  { id: "MAKEUP_TOOLS_BRUSHES", name: "Makeup Tools and Brushes", secondaryCategoryId: "COSMETICS" },

  // Bath - Hair Care
  { id: "SHAMPOOS", name: "Shampoos", secondaryCategoryId: "HAIR" },
  { id: "CONDITIONERS_AND_TREATMENTS", name: "Conditioners and Treatments", secondaryCategoryId: "HAIR" },
  { id: "BRUSHES_AND_COMBS", name: "Brushes and Combs", secondaryCategoryId: "HAIR" },
  { id: "WAXES_AND_GELS", name: "Waxes and Gels", secondaryCategoryId: "HAIR" },
  
  // Toys - Stuffed Animals
  { id: "TEDDY_BEARS", name: "Teddy Bears", secondaryCategoryId: "STUFFED" },
  { id: "ANIMALS", name: "Animals", secondaryCategoryId: "STUFFED" },
  { id: "DOLLS", name: "Dolls", secondaryCategoryId: "STUFFED" },
  { id: "PLUSHIES", name: "Plushies", secondaryCategoryId: "STUFFED" },

  // Art - Prints
  { id: "WOOD_AND_LINOCUT", name: "Wood and Linocut", secondaryCategoryId: "PRINTS" },
  { id: "DIGITAL_ART", name: "Digital Art", secondaryCategoryId: "PRINTS" },
  { id: "GICLEE", name: "Giclee", secondaryCategoryId: "PRINTS" },
  { id: "SCREENPRINTS", name: "Screenprints", secondaryCategoryId: "PRINTS" },
  { id: "LETTERPRESS", name: "Letterpress", secondaryCategoryId: "PRINTS" },

  // Art - Painting
  { id: "ACRYLIC", name: "Acrylic", secondaryCategoryId: "PAINTINGS" },
  { id: "OIL", name: "Oil", secondaryCategoryId: "PAINTINGS" },
  { id: "GOUACHE", name: "Gouache", secondaryCategoryId: "PAINTINGS" },
  { id: "INK", name: "Ink", secondaryCategoryId: "PAINTINGS" },
  { id: "SPRAY_PAINT", name: "Spray Paint", secondaryCategoryId: "PAINTINGS" },
] as const;

// Extract IDs for strict typing
type PrimaryCategoryID = (typeof PrimaryCategories)[number]["id"];
type SecondaryCategoryID = (typeof SecondaryCategories)[number]["id"];

/**
 * Map Secondary Categories to Primary Categories
 */
export const CategoryMapping: Record<PrimaryCategoryID, SecondaryCategoryID[]> = {
  ART: ["PAINTINGS", "PRINTS", "PHOTOGRAPHY", "SCULPTURES", "COLLECTIBLES"],
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
  YARN: ["COTTON_YARN", "WOOL_YARN", "ACRYLIC_YARN", "MERINO_WOOL", "BULKY_YARN", "FINGERING_YARN", "POLYESTER_YARN"],
  DECOR: ["WALL_ART", "CANDLES", "VASES", "THROW_PILLOWS", "RUGS"],
  SOAP: ["BAR_SOAP", "LIQUID_SOAP", "BATH_BOMBS", "SHOWER_GELS", "BATH_SALTS_AND_SCRUBS", "BATH_OILS"],
  SKIN: ["FACIAL_CARE", "MOISTURIZERS", "BALMS_AND_SALVES", "EXFOLIATION", "EYE_TREATMENTS"],
  SPA: ["AROMATHERAPY", "HEAT_AND_COLD_PACKS", "MASSAGE", "ESSENTIAL_OILS", "SPA_KITS"],
  HAIR: ["SHAMPOOS", "CONDITIONERS_AND_TREATMENTS", "BRUSHES_AND_COMBS", "WAXES_AND_GELS"],
  COSMETICS: ["EYES", "LIPS", "FACE", "NAILS_AND_NAIL_CARE", "MAKEUP_TOOLS_BRUSHES"],
  STUFFED: ["TEDDY_BEARS", "ANIMALS", "DOLLS", "PLUSHIES"],
  PRINTS: ["WOOD_AND_LINOCUT", "DIGITAL_ART", "GICLEE", "SCREENPRINTS", "LETTERPRESS"],
  PAINTINGS: ["ACRYLIC", "OIL", "GOUACHE", "INK", "SPRAY_PAINT"],
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
