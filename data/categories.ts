// Type definitions for the hierarchical category structure
export interface SecondaryCategoryNode {
  id: string;
  name: string;
}

export interface PrimaryCategoryNode {
  id: string;
  name: string;
  children: SecondaryCategoryNode[];
}

// The single source of truth - simplified hierarchical category tree
// This new structure is designed to be scalable and less complex than the previous version
export const Categories = [
  {
    id: "ART",
    name: "Art",
    children: [
      {
        id: "PRINTS_POSTERS",
        name: "Prints & Posters",
      },
      {
        id: "PHOTOGRAPHY",
        name: "Photography",
      },
      {
        id: "SCULPTURE_3D",
        name: "Sculptures & 3D Art",
      },
      {
        id: "GLASS",
        name: "Glass Art",
      },
      {
        id: "FIBER_ART",
        name: "Fiber Art (macrame, weaving, textile wall art)",
      },
      {
        id: "CERAMICS_POTTERY",
        name: "Ceramics & Pottery",
      },
      {
        id: "DRAWING_ILLUSTRATION",
        name: "Drawing & Illustration",
      },
      {
        id: "STICKERS",
        name: "Stickers",
      },
      {
        id: "MINIATURES_DIORAMAS",
        name: "Miniatures & Dioramas",
      },
      {
        id: "COLLECTIBLES",
        name: "Collectibles",
      },
    ],
  },
  {
    id: "JEWELRY",
    name: "Jewelry",
    children: [
      {
        id: "NECKLACES",
        name: "Necklaces",
      },
      {
        id: "EARRINGS",
        name: "Earrings",
      },
      {
        id: "RINGS",
        name: "Rings",
      },
      {
        id: "BRACELETS",
        name: "Bracelets",
      },
      {
        id: "ANKLETS",
        name: "Anklets",
      },
      {
        id: "BROOCHES_PINS",
        name: "Brooches & Pins",
      },
      {
        id: "BODY_JEWELRY",
        name: "Body Jewelry",
      },
      {
        id: "JEWELRY_SETS",
        name: "Jewelry Sets",
      },
      {
        id: "CHARMS",
        name: "Charms",
      },
      {
        id: "CUSTOM_JEWELRY",
        name: "Custom Jewelry",
      },
    ],
  },
  {
    id: "CLOTHING_ACCESSORIES",
    name: "Clothing & Accessories",
    children: [
      {
        id: "TOPS",
        name: "Tops",
      },
      {
        id: "BOTTOMS",
        name: "Bottoms",
      },
      {
        id: "DRESSES_ONEPIECE",
        name: "Dresses & One-Piece",
      },
      {
        id: "OUTERWEAR",
        name: "Outerwear",
      },
      {
        id: "KNITWEAR",
        name: "Knitwear",
      },
      {
        id: "BAGS_PURSES",
        name: "Bags & Purses",
      },
      {
        id: "SCARVES_WRAPS",
        name: "Scarves & Wraps",
      },
      {
        id: "HATS_HEADWEAR",
        name: "Hats & Headwear",
      },
      {
        id: "GLOVES_MITTENS",
        name: "Gloves & Mittens",
      },
      {
        id: "ACCESSORIES",
        name: "Accessories",
      },
    ],
  },
  {
    id: "HOME_LIVING",
    name: "Home & Living",
    children: [
      {
        id: "HOME_DECOR",
        name: "Home Decor",
      },
      {
        id: "WALL_ART_HANGINGS",
        name: "Wall Art & Hangings",
      },
      {
        id: "CANDLES_HOLDERS",
        name: "Candles & Holders",
      },
      {
        id: "KITCHEN_DINING",
        name: "Kitchen & Dining",
      },
      {
        id: "FURNITURE",
        name: "Furniture",
      },
      {
        id: "STORAGE_ORGANIZATION",
        name: "Storage & Organization",
      },
      {
        id: "LIGHTING",
        name: "Lighting",
      },
      {
        id: "GARDEN_OUTDOOR",
        name: "Garden & Outdoor",
      },
      {
        id: "SEASONAL_DECOR",
        name: "Seasonal Decor",
      },
      {
        id: "OFFICE_DESK",
        name: "Office & Desk",
      },
    ],
  },
  {
    id: "BATH_BEAUTY",
    name: "Bath & Beauty",
    children: [
      {
        id: "SOAP_BATH",
        name: "Soap & Bath",
      },
      {
        id: "SKINCARE",
        name: "Skincare",
      },
      {
        id: "HAIRCARE",
        name: "Haircare",
      },
      {
        id: "COSMETICS",
        name: "Cosmetics",
      },
      {
        id: "FRAGRANCE",
        name: "Fragrance",
      },
      {
        id: "GROOMING",
        name: "Grooming",
      },
      {
        id: "GIFT_SETS",
        name: "Gift Sets",
      },
      {
        id: "COSMETIC_TOILETRY_STORAGE",
        name: "Cosmetic & Toiletry Storage",
      },
      {
        id: "TOOLS_ACCESSORIES",
        name: "Tools & Accessories",
      },
    ],
  },
  {
    id: "TOYS_KIDS",
    name: "Toys & Kids",
    children: [
      {
        id: "PLUSH_DOLLS",
        name: "Plush & Dolls",
      },
      {
        id: "WOODEN_TOYS",
        name: "Wooden Toys",
      },
      {
        id: "GAMES_PUZZLES",
        name: "Games & Puzzles",
      },
      {
        id: "PRETEND_PLAY",
        name: "Pretend Play",
      },
      {
        id: "EDUCATIONAL_TOYS",
        name: "Educational Toys",
      },
      {
        id: "SENSORY_TOYS",
        name: "Sensory Toys",
      },
      {
        id: "BABY_TOYS",
        name: "Baby Toys",
      },
      {
        id: "KIDS_DECOR",
        name: "Kids Decor",
      },
      {
        id: "KIDS_CLOTHING",
        name: "Kids Clothing",
      },
      {
        id: "PARTY_ACTIVITIES",
        name: "Party & Activities",
      },
    ],
  },
  {
    id: "CRAFT_SUPPLIES",
    name: "Craft Supplies",
    children: [
      {
        id: "YARN_FIBER",
        name: "Yarn & Fiber",
      },
      {
        id: "FABRIC_TEXTILES",
        name: "Fabric & Textiles",
      },
      {
        id: "BEADS_JEWELRY_SUPPLIES",
        name: "Beads & Jewelry Supplies",
      },
      {
        id: "TOOLS_EQUIPMENT",
        name: "Tools & Equipment",
      },
      {
        id: "PATTERNS_TEMPLATES",
        name: "Patterns & Templates (physical only)",
      },
      {
        id: "PAINTS_INKS_DYES",
        name: "Paints, Inks & Dyes",
      },
      {
        id: "PAPER_STATIONERY",
        name: "Paper & Stationery",
      },
      {
        id: "MOLDS_BLANKS",
        name: "Molds & Blanks",
      },
      {
        id: "KITS_BUNDLES",
        name: "Kits & Bundles",
      },
      {
        id: "NOTIONS_FINDINGS",
        name: "Notions & Findings",
      },
    ],
  },
  {
    id: "DIGITAL_MEDIA",
    name: "Digital & Media",
    children: [
      {
        id: "CROCHET_PATTERNS",
        name: "Crochet Patterns",
      },
      {
        id: "KNITTING_PATTERNS",
        name: "Knitting Patterns",
      },
      {
        id: "SEWING_PATTERNS",
        name: "Sewing Patterns",
      },
      {
        id: "PRINTABLE_ART",
        name: "Printable Art",
      },
      {
        id: "TEMPLATES_PLANNERS",
        name: "Templates & Planners",
      },
      {
        id: "MUSIC_AUDIO",
        name: "Music & Audio",
      },
    ],
  },
] as const;

// Extract types from the hierarchical structure
export type PrimaryCategoryID = (typeof Categories)[number]["id"];
export type SecondaryCategoryID =
  (typeof Categories)[number]["children"][number]["id"];

/**
 * @deprecated Tertiary categories have been removed. This type is kept for backward compatibility only.
 */
export type TertiaryCategoryID = never;

/**
 * @deprecated Tertiary categories have been removed. This interface is kept for backward compatibility only.
 */
export interface TertiaryCategoryNode {
  id: string;
  name: string;
}

// Legacy interfaces (kept for type compatibility if needed elsewhere)
export interface PrimaryCategory {
  id: string;
  name: string;
}

export interface SecondaryCategory {
  id: string;
  name: string;
  primaryCategoryId: string;
}


/**
 * Helper function to get secondary categories for a primary category
 */
export const getSecondaryCategories = (
  primaryId: PrimaryCategoryID
): SecondaryCategoryID[] => {
  const primary = Categories.find((c) => c.id === primaryId);
  return primary ? primary.children.map((c) => c.id) : [];
};

/**
 * Helper function to get tertiary categories for a secondary category
 * @deprecated Tertiary categories have been removed. This function always returns an empty array for backward compatibility.
 */
export const getTertiaryCategories = (
  secondaryId: SecondaryCategoryID | string
): string[] => {
  // Tertiary categories have been removed - always return empty array
  return [];
};

/**
 * Helper function to get full category path (for breadcrumbs and filters)
 * Returns [primaryId] or [primaryId, secondaryId]
 */
export const getCategoryPath = (id: string): string[] => {
  for (const primary of Categories) {
    if (primary.id === id) return [primary.id];

    for (const secondary of primary.children) {
      if (secondary.id === id) return [primary.id, secondary.id];
    }
  }
  return [];
};

/**
 * Helper function to find a category by ID at any level
 */
export const findCategoryById = (
  id: string
): PrimaryCategory | SecondaryCategory | null => {
  for (const primary of Categories) {
    if (primary.id === id) {
      return { id: primary.id, name: primary.name };
    }

    for (const secondary of primary.children) {
      if (secondary.id === id) {
        return {
          id: secondary.id,
          name: secondary.name,
          primaryCategoryId: primary.id,
        };
      }
    }
  }
  return null;
};

/**
 * Helper function to get category chain with names
 * Returns an object with primary and secondary (optional) category info
 */
export interface CategoryChain {
  primary: { id: string; name: string };
  secondary?: { id: string; name: string };
}

export const getCategoryChain = (categoryId: string): CategoryChain | null => {
  const path = getCategoryPath(categoryId);
  if (path.length === 0) return null;

  const primary = Categories.find((c) => c.id === path[0]);
  if (!primary) return null;

  const result: CategoryChain = {
    primary: { id: primary.id, name: primary.name },
  };

  if (path.length >= 2) {
    const secondary = primary.children.find((c) => c.id === path[1]);
    if (secondary) {
      result.secondary = { id: secondary.id, name: secondary.name };
    }
  }

  return result;
};
