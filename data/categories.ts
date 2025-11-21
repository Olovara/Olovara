// Type definitions for the hierarchical category structure
export interface TertiaryCategoryNode {
  id: string;
  name: string;
}

export interface SecondaryCategoryNode {
  id: string;
  name: string;
  children?: TertiaryCategoryNode[];
}

export interface PrimaryCategoryNode {
  id: string;
  name: string;
  children: SecondaryCategoryNode[];
}

// The single source of truth - hierarchical category tree
export const Categories = [
  {
    id: "ART",
    name: "Art & Collectibles",
    children: [
      {
        id: "PAINTINGS",
        name: "Paintings",
        children: [
          { id: "ACRYLIC", name: "Acrylic" },
          { id: "OIL", name: "Oil" },
          { id: "GOUACHE", name: "Gouache" },
          { id: "INK", name: "Ink" },
          { id: "SPRAY_PAINT", name: "Spray Paint" },
        ],
      },
      {
        id: "PRINTS",
        name: "Prints",
        children: [
          { id: "WOOD_AND_LINOCUT", name: "Wood and Linocut" },
          { id: "DIGITAL_ART", name: "Digital Art" },
          { id: "GICLEE", name: "Giclee" },
          { id: "SCREENPRINTS", name: "Screenprints" },
          { id: "LETTERPRESS", name: "Letterpress" },
        ],
      },
      {
        id: "PHOTOGRAPHY",
        name: "Photography",
      },
      {
        id: "SCULPTURES",
        name: "Sculptures",
        children: [
          { id: "CERAMIC", name: "Ceramic" },
          { id: "GLASS", name: "Glass" },
          { id: "METAL", name: "Metal" },
          { id: "WOOD", name: "Wood" },
        ],
      },
      {
        id: "COLLECTIBLES",
        name: "Collectibles",
      },
    ],
  },
  {
    id: "BATH",
    name: "Bath & Beauty",
    children: [
      {
        id: "SOAP",
        name: "Soaps and Washes",
        children: [
          { id: "BAR_SOAP", name: "Bar Soap" },
          { id: "LIQUID_SOAP", name: "Liquid Soap" },
          { id: "BATH_BOMBS", name: "Bath Bombs" },
          { id: "SHOWER_GELS", name: "Shower Gels" },
          { id: "BATH_SALTS_AND_SCRUBS", name: "Bath Salts and Scrubs" },
          { id: "BATH_OILS", name: "Bath Oils" },
        ],
      },
      {
        id: "SKIN",
        name: "Skin Care",
        children: [
          { id: "FACIAL_CARE", name: "Facial Care" },
          { id: "MOISTURIZERS", name: "Moisturizers" },
          { id: "BALMS_AND_SALVES", name: "Balms and Salves" },
          { id: "EXFOLIATION", name: "Exfoliation" },
          { id: "EYE_TREATMENTS", name: "Eye Treatments" },
        ],
      },
      {
        id: "SPA",
        name: "Spa and Relaxation",
        children: [
          { id: "AROMATHERAPY", name: "Aromatherapy" },
          { id: "HEAT_AND_COLD_PACKS", name: "Heat and Cold Packs" },
          { id: "MASSAGE", name: "Massage" },
          { id: "ESSENTIAL_OILS", name: "Essential Oils" },
          { id: "SPA_KITS", name: "Spa Kits" },
        ],
      },
      {
        id: "COSMETICS",
        name: "Cosmetics",
        children: [
          { id: "EYES", name: "Eyes" },
          { id: "LIPS", name: "Lips" },
          { id: "FACE", name: "Face" },
          { id: "NAILS_AND_NAIL_CARE", name: "Nails and Nail Care" },
          { id: "MAKEUP_TOOLS_BRUSHES", name: "Makeup Tools and Brushes" },
        ],
      },
      {
        id: "HAIR",
        name: "Hair Care",
        children: [
          { id: "SHAMPOOS", name: "Shampoos" },
          {
            id: "CONDITIONERS_AND_TREATMENTS",
            name: "Conditioners and Treatments",
          },
          { id: "BRUSHES_AND_COMBS", name: "Brushes and Combs" },
          { id: "WAXES_AND_GELS", name: "Waxes and Gels" },
        ],
      },
    ],
  },
  {
    id: "BOOKS",
    name: "Books & Media",
    children: [
      {
        id: "COMICS",
        name: "Books and Comics",
      },
      {
        id: "AUDIO",
        name: "Music and Audio",
      },
    ],
  },
  {
    id: "CLOTHING",
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
        id: "DRESSES",
        name: "Dresses",
      },
      {
        id: "ACCESSORIES",
        name: "Accessories",
      },
      {
        id: "WOMENS",
        name: "Women's",
      },
      {
        id: "MENS",
        name: "Men's",
      },
      {
        id: "UNISEX",
        name: "Unisex",
      },
      {
        id: "BAGS",
        name: "Bags and Purses",
      },
    ],
  },
  {
    id: "CRAFT_SUPPLIES",
    name: "Handmade Craft Supplies",
    children: [
      {
        id: "YARN",
        name: "Yarn",
        children: [
          { id: "COTTON_YARN", name: "Cotton Yarn" },
          { id: "WOOL_YARN", name: "Wool Yarn" },
          { id: "ACRYLIC_YARN", name: "Acrylic Yarn" },
          { id: "MERINO_WOOL", name: "Merino Wool" },
          { id: "BULKY_YARN", name: "Bulky Yarn" },
          { id: "FINGERING_YARN", name: "Fingering Yarn" },
          { id: "POLYESTER_YARN", name: "Polyester Yarn" },
        ],
      },
      {
        id: "FABRIC",
        name: "Fabric",
      },
      {
        id: "TOOLS",
        name: "Tools & Equipment",
      },
      {
        id: "BEADS",
        name: "Beads & Jewelry Making",
      },
      {
        id: "FIBER",
        name: "Fiber and Sewing",
      },
      {
        id: "PAPER",
        name: "Paper Supplies",
      },
      {
        id: "PAINT",
        name: "Paint, Stain, and Dye",
      },
    ],
  },
  {
    id: "HOME",
    name: "Home & Living",
    children: [
      {
        id: "DECOR",
        name: "Home Decor",
        children: [
          { id: "WALL_ART", name: "Wall Art" },
          { id: "CANDLES", name: "Candles" },
          { id: "VASES", name: "Vases" },
          { id: "THROW_PILLOWS", name: "Throw Pillows" },
          { id: "RUGS", name: "Rugs" },
        ],
      },
      {
        id: "KITCHEN",
        name: "Kitchen & Dining",
        children: [
          { id: "DRINKWARE", name: "Drinkware" },
          { id: "TABLEWARE", name: "Tableware" },
          { id: "COOKING_AND_BAKING", name: "Cooking and Baking" },
          { id: "TRAYS_AND_PLATTERS", name: "Trays and Platters" },
          { id: "CUTTING_BOARDS", name: "Cutting Boards" },
        ],
      },
      {
        id: "FURNITURE",
        name: "Furniture",
        children: [
          { id: "CHAIRS", name: "Chairs" },
          { id: "TABLES", name: "Tables" },
          { id: "STOOLS", name: "Stools" },
          { id: "DESKS", name: "Desks" },
          { id: "BENCHES", name: "Benches" },
        ],
      },
      {
        id: "GARDEN",
        name: "Garden & Outdoor",
      },
      {
        id: "WALLDECOR",
        name: "Wall Decor",
      },
      {
        id: "KIDS",
        name: "Baby and Kids",
      },
      {
        id: "PETS",
        name: "Pets",
      },
      {
        id: "CHILD",
        name: "Kids and Baby",
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
        children: [
          { id: "CHOKERS", name: "Chokers" },
          { id: "BEADED_NECKLACES", name: "Beaded Necklaces" },
          { id: "PENDANT_NECKLACES", name: "Pendant Necklaces" },
          { id: "LAYERED_NECKLACES", name: "Layered Necklaces" },
          { id: "STATEMENT_NECKLACES", name: "Statement Necklaces" },
        ],
      },
      {
        id: "RINGS",
        name: "Rings",
        children: [
          { id: "ENGAGEMENT_RINGS", name: "Engagement Rings" },
          { id: "WEDDING_RINGS", name: "Wedding Rings" },
          { id: "STACKING_RINGS", name: "Stacking Rings" },
          { id: "COCKTAIL_RINGS", name: "Cocktail Rings" },
        ],
      },
      {
        id: "EARRINGS",
        name: "Earrings",
        children: [
          { id: "STUDS", name: "Studs" },
          { id: "HOOPS", name: "Hoops" },
          { id: "DANGLES", name: "Dangles" },
          { id: "CHANDELIER", name: "Chandelier" },
        ],
      },
      {
        id: "BRACELETS",
        name: "Bracelets",
        children: [
          { id: "BEADED", name: "Beaded" },
          { id: "BANGLES", name: "Bangles" },
          { id: "CUFF", name: "Cuff" },
          { id: "CHARM", name: "Charm" },
          { id: "CHAIN_AND_LINK", name: "Chain and Link" },
        ],
      },
      {
        id: "PINS",
        name: "Pins and Brooches",
        children: [
          { id: "ENAMEL_PINS", name: "Enamel Pins" },
          { id: "NOVELTY_PINS", name: "Novelty Pins" },
          { id: "BROOCHES", name: "Brooches" },
        ],
      },
    ],
  },
  {
    id: "TOYS",
    name: "Toys & Games",
    children: [
      {
        id: "TODDLER",
        name: "Baby and Toddler Toys",
      },
      {
        id: "KID",
        name: "Big Kid Toys",
      },
      {
        id: "GAMES",
        name: "Games and Puzzles",
      },
      {
        id: "STUFFED",
        name: "Stuffed Animals, Dolls, and Plushies",
        children: [
          { id: "TEDDY_BEARS", name: "Teddy Bears" },
          { id: "ANIMALS", name: "Animals" },
          { id: "DOLLS", name: "Dolls" },
          { id: "PLUSHIES", name: "Plushies" },
        ],
      },
      {
        id: "SENSORY",
        name: "Sensory Toys",
      },
    ],
  },
] as const;

// Extract types from the hierarchical structure
export type PrimaryCategoryID = (typeof Categories)[number]["id"];
export type SecondaryCategoryID =
  (typeof Categories)[number]["children"][number]["id"];
export type TertiaryCategoryID =
  (typeof Categories)[number]["children"][number] extends {
    children: readonly (infer T)[];
  }
    ? T extends { id: infer ID }
      ? ID
      : never
    : never;

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

export interface TertiaryCategory {
  id: string;
  name: string;
  secondaryCategoryId: string;
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
 */
export const getTertiaryCategories = (
  secondaryId: SecondaryCategoryID | string
): string[] => {
  for (const primary of Categories) {
    const secondary = primary.children.find((c) => c.id === secondaryId);
    if (
      secondary &&
      "children" in secondary &&
      secondary.children &&
      secondary.children.length > 0
    ) {
      return secondary.children.map((c) => c.id);
    }
  }
  return [];
};

/**
 * Helper function to get full category path (for breadcrumbs and filters)
 * Returns [primaryId, secondaryId?, tertiaryId?]
 */
export const getCategoryPath = (id: string): string[] => {
  for (const primary of Categories) {
    if (primary.id === id) return [primary.id];

    for (const secondary of primary.children) {
      if (secondary.id === id) return [primary.id, secondary.id];

      if ("children" in secondary && secondary.children) {
        for (const tertiary of secondary.children) {
          if (tertiary.id === id)
            return [primary.id, secondary.id, tertiary.id];
        }
      }
    }
  }
  return [];
};

/**
 * Helper function to find a category by ID at any level
 */
export const findCategoryById = (
  id: string
): PrimaryCategory | SecondaryCategory | TertiaryCategory | null => {
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

      if ("children" in secondary && secondary.children) {
        for (const tertiary of secondary.children) {
          if (tertiary.id === id) {
            return {
              id: tertiary.id,
              name: tertiary.name,
              secondaryCategoryId: secondary.id,
            };
          }
        }
      }
    }
  }
  return null;
};

/**
 * Helper function to get category chain with names
 * Returns an object with primary, secondary (optional), and tertiary (optional) category info
 */
export interface CategoryChain {
  primary: { id: string; name: string };
  secondary?: { id: string; name: string };
  tertiary?: { id: string; name: string };
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

  if (path.length >= 3 && result.secondary) {
    const secondary = primary.children.find((c) => c.id === path[1]);
    if (secondary && "children" in secondary && secondary.children) {
      const tertiary = secondary.children.find((c) => c.id === path[2]);
      if (tertiary) {
        result.tertiary = { id: tertiary.id, name: tertiary.name };
      }
    }
  }

  return result;
};

