/**
 * Script to remap products from legacy 3-level categories to new 2-level categories
 * 
 * Usage: npx tsx scripts/remap-categories.ts [--dry-run] [--limit N]
 * 
 * Options:
 *   --dry-run: Preview changes without updating database
 *   --limit N: Only process first N products (for testing)
 */

import { db } from "@/lib/db";
import { Categories as LegacyCategories } from "@/data/categories.legacy";
import { Categories as NewCategories } from "@/data/categories";

// Mapping from legacy primary category to new primary category
const PRIMARY_CATEGORY_MAP: Record<string, string> = {
  ART: "ART",
  BATH: "BATH_BEAUTY",
  BOOKS: "DIGITAL_MEDIA", // Books & Media -> Digital & Media
  CLOTHING: "CLOTHING_ACCESSORIES",
  CRAFT_SUPPLIES: "CRAFT_SUPPLIES",
  HOME: "HOME_LIVING",
  JEWELRY: "JEWELRY",
  TOYS: "TOYS_KIDS",
};

// Mapping from legacy secondary category to new secondary category
// Format: "LEGACY_PRIMARY:LEGACY_SECONDARY" -> "NEW_SECONDARY"
const SECONDARY_CATEGORY_MAP: Record<string, string> = {
  // ART mappings
  "ART:PAINTINGS": "PRINTS_POSTERS", // Paintings -> Prints & Posters
  "ART:PRINTS": "PRINTS_POSTERS", // Prints -> Prints & Posters
  "ART:PHOTOGRAPHY": "PHOTOGRAPHY",
  "ART:SCULPTURES": "SCULPTURE_3D",
  "ART:COLLECTIBLES": "COLLECTIBLES",
  
  // BATH mappings
  "BATH:SOAP_BATH": "SOAP_BATH",
  "BATH:SKIN_CARE": "SKINCARE",
  "BATH:HAIR_CARE": "HAIRCARE",
  "BATH:COSMETICS": "COSMETICS",
  "BATH:AROMATHERAPY": "FRAGRANCE",
  
  // CLOTHING mappings
  "CLOTHING:TOPS": "TOPS",
  "CLOTHING:BOTTOMS": "BOTTOMS",
  "CLOTHING:DRESSES": "DRESSES_ONEPIECE",
  "CLOTHING:OUTERWEAR": "OUTERWEAR",
  "CLOTHING:ACCESSORIES": "ACCESSORIES",
  "CLOTHING:BAGS": "BAGS_PURSES",
  
  // HOME mappings
  "HOME:HOME_DECOR": "HOME_DECOR",
  "HOME:TEXTILES": "HOME_DECOR", // Textiles -> Home Decor
  "HOME:KITCHEN_DINING": "KITCHEN_DINING",
  "HOME:FURNITURE": "FURNITURE",
  "HOME:OUTDOOR_GARDEN": "GARDEN_OUTDOOR",
  
  // JEWELRY mappings
  "JEWELRY:NECKLACES": "NECKLACES",
  "JEWELRY:RINGS": "RINGS",
  "JEWELRY:EARRINGS": "EARRINGS",
  "JEWELRY:BRACELETS": "BRACELETS",
  "JEWELRY:PINS": "BROOCHES_PINS",
  
  // TOYS mappings
  "TOYS:PLUSH_TOYS": "PLUSH_DOLLS",
  "TOYS:GAMES_PUZZLES": "GAMES_PUZZLES",
  "TOYS:PRETEND_PLAY": "PRETEND_PLAY",
  "TOYS:EDUCATIONAL": "EDUCATIONAL_TOYS",
  "TOYS:SENSORY_TOYS": "SENSORY_TOYS",
  
  // CRAFT_SUPPLIES mappings
  "CRAFT_SUPPLIES:YARN": "YARN_FIBER",
  "CRAFT_SUPPLIES:FABRIC": "FABRIC_TEXTILES",
  "CRAFT_SUPPLIES:TOOLS": "TOOLS_EQUIPMENT",
  "CRAFT_SUPPLIES:BEADS": "BEADS_JEWELRY_SUPPLIES",
  "CRAFT_SUPPLIES:FIBER": "YARN_FIBER",
  "CRAFT_SUPPLIES:PAPER": "PAPER_STATIONERY",
  "CRAFT_SUPPLIES:PAINT": "PAINTS_INKS_DYES",
};

// Mapping from legacy tertiary category to new secondary category
// Format: "LEGACY_PRIMARY:LEGACY_SECONDARY:LEGACY_TERTIARY" -> "NEW_SECONDARY"
const TERTIARY_CATEGORY_MAP: Record<string, string> = {
  // ART > PRINTS > FINE_ART_PRINTS -> ART > PRINTS_POSTERS
  "ART:PRINTS:FINE_ART_PRINTS": "PRINTS_POSTERS",
  "ART:PRINTS:RELIEF_PRINTS": "PRINTS_POSTERS",
  
  // BATH > SOAP_BATH > * -> BATH_BEAUTY > SOAP_BATH
  "BATH:SOAP_BATH:BAR_SOAP": "SOAP_BATH",
  "BATH:SOAP_BATH:LIQUID_SOAP": "SOAP_BATH",
  "BATH:SOAP_BATH:BATH_BOMBS": "SOAP_BATH",
  "BATH:SOAP_BATH:SHOWER_GELS": "SOAP_BATH",
  "BATH:SOAP_BATH:BATH_SALTS": "SOAP_BATH",
  "BATH:SOAP_BATH:BODY_SCRUBS": "SOAP_BATH",
  "BATH:SOAP_BATH:BATH_OILS": "SOAP_BATH",
  
  // BATH > SKIN_CARE > * -> BATH_BEAUTY > SKINCARE
  "BATH:SKIN_CARE:CLEANSERS": "SKINCARE",
  "BATH:SKIN_CARE:MOISTURIZERS": "SKINCARE",
  "BATH:SKIN_CARE:SERUMS": "SKINCARE",
  "BATH:SKIN_CARE:BALMS_SALVES": "SKINCARE",
  "BATH:SKIN_CARE:MASKS": "SKINCARE",
  
  // BATH > HAIR_CARE > * -> BATH_BEAUTY > HAIRCARE
  "BATH:HAIR_CARE:SHAMPOOS": "HAIRCARE",
  "BATH:HAIR_CARE:CONDITIONERS": "HAIRCARE",
  "BATH:HAIR_CARE:HAIR_TREATMENTS": "HAIRCARE",
  "BATH:HAIR_CARE:STYLING_PRODUCTS": "HAIRCARE",
  "BATH:HAIR_CARE:BRUSHES_COMBS": "TOOLS_ACCESSORIES",
  
  // BATH > COSMETICS > * -> BATH_BEAUTY > COSMETICS
  "BATH:COSMETICS:EYE_MAKEUP": "COSMETICS",
  "BATH:COSMETICS:LIP_MAKEUP": "COSMETICS",
  "BATH:COSMETICS:FACE_MAKEUP": "COSMETICS",
  "BATH:COSMETICS:NAIL_CARE": "COSMETICS",
  "BATH:COSMETICS:MAKEUP_TOOLS": "TOOLS_ACCESSORIES",
  
  // BATH > AROMATHERAPY > * -> BATH_BEAUTY > FRAGRANCE
  "BATH:AROMATHERAPY:ESSENTIAL_OILS": "FRAGRANCE",
  "BATH:AROMATHERAPY:CANDLES": "FRAGRANCE",
  "BATH:AROMATHERAPY:ROLL_ONS": "FRAGRANCE",
  
  // CLOTHING > TOPS > * -> CLOTHING_ACCESSORIES > TOPS
  "CLOTHING:TOPS:SWEATERS": "TOPS",
  "CLOTHING:TOPS:CARDIGANS": "KNITWEAR",
  "CLOTHING:TOPS:T_SHIRTS": "TOPS",
  "CLOTHING:TOPS:BLOUSES": "TOPS",
  "CLOTHING:TOPS:TANK_TOPS": "TOPS",
  
  // CLOTHING > BOTTOMS > * -> CLOTHING_ACCESSORIES > BOTTOMS
  "CLOTHING:BOTTOMS:PANTS": "BOTTOMS",
  "CLOTHING:BOTTOMS:SHORTS": "BOTTOMS",
  "CLOTHING:BOTTOMS:SKIRTS": "BOTTOMS",
  "CLOTHING:BOTTOMS:LEGGINGS": "BOTTOMS",
  
  // CLOTHING > DRESSES > * -> CLOTHING_ACCESSORIES > DRESSES_ONEPIECE
  "CLOTHING:DRESSES:CASUAL_DRESSES": "DRESSES_ONEPIECE",
  "CLOTHING:DRESSES:FORMAL_DRESSES": "DRESSES_ONEPIECE",
  "CLOTHING:DRESSES:MAXI_DRESSES": "DRESSES_ONEPIECE",
  "CLOTHING:DRESSES:MIDI_DRESSES": "DRESSES_ONEPIECE",
  "CLOTHING:DRESSES:SUMMER_DRESSES": "DRESSES_ONEPIECE",
  
  // CLOTHING > OUTERWEAR > * -> CLOTHING_ACCESSORIES > OUTERWEAR
  "CLOTHING:OUTERWEAR:COATS": "OUTERWEAR",
  "CLOTHING:OUTERWEAR:JACKETS": "OUTERWEAR",
  "CLOTHING:OUTERWEAR:VESTS": "OUTERWEAR",
  "CLOTHING:OUTERWEAR:PONCHOS": "OUTERWEAR",
  "CLOTHING:OUTERWEAR:CAPES": "OUTERWEAR",
  
  // CLOTHING > ACCESSORIES > * -> CLOTHING_ACCESSORIES > ACCESSORIES
  "CLOTHING:ACCESSORIES:HATS": "HATS_HEADWEAR",
  "CLOTHING:ACCESSORIES:SCARVES": "SCARVES_WRAPS",
  "CLOTHING:ACCESSORIES:GLOVES": "GLOVES_MITTENS",
  "CLOTHING:ACCESSORIES:BELTS": "ACCESSORIES",
  
  // CLOTHING > BAGS > * -> CLOTHING_ACCESSORIES > BAGS_PURSES
  "CLOTHING:BAGS:TOTE_BAGS": "BAGS_PURSES",
  "CLOTHING:BAGS:BACKPACKS": "BAGS_PURSES",
  "CLOTHING:BAGS:CROSSBODY_BAGS": "BAGS_PURSES",
  "CLOTHING:BAGS:POUCHES": "BAGS_PURSES",
  
  // HOME > HOME_DECOR > * -> HOME_LIVING > HOME_DECOR
  "HOME:HOME_DECOR:WALL_ART": "WALL_ART_HANGINGS",
  "HOME:HOME_DECOR:CANDLES": "CANDLES_HOLDERS",
  "HOME:HOME_DECOR:VASES": "HOME_DECOR",
  "HOME:HOME_DECOR:DECORATIVE_BOWLS": "HOME_DECOR",
  
  // HOME > TEXTILES > * -> HOME_LIVING > HOME_DECOR
  "HOME:TEXTILES:THROW_PILLOWS": "HOME_DECOR",
  "HOME:TEXTILES:RUGS": "HOME_DECOR",
  "HOME:TEXTILES:BLANKETS": "HOME_DECOR",
  "HOME:TEXTILES:WALL_HANGINGS": "WALL_ART_HANGINGS",
  
  // HOME > KITCHEN_DINING > * -> HOME_LIVING > KITCHEN_DINING
  "HOME:KITCHEN_DINING:DRINKWARE": "KITCHEN_DINING",
  "HOME:KITCHEN_DINING:TABLEWARE": "KITCHEN_DINING",
  "HOME:KITCHEN_DINING:SERVEWARE": "KITCHEN_DINING",
  "HOME:KITCHEN_DINING:TRAYS_PLATTERS": "KITCHEN_DINING",
  "HOME:KITCHEN_DINING:CUTTING_BOARDS": "KITCHEN_DINING",
  "HOME:KITCHEN_DINING:LINENS": "KITCHEN_DINING",
  
  // HOME > FURNITURE > * -> HOME_LIVING > FURNITURE
  "HOME:FURNITURE:CHAIRS": "FURNITURE",
  "HOME:FURNITURE:TABLES": "FURNITURE",
  "HOME:FURNITURE:DESKS": "OFFICE_DESK",
  "HOME:FURNITURE:BENCHES": "FURNITURE",
  "HOME:FURNITURE:STOOLS": "FURNITURE",
  
  // HOME > OUTDOOR_GARDEN > * -> HOME_LIVING > GARDEN_OUTDOOR
  "HOME:OUTDOOR_GARDEN:PLANTERS": "GARDEN_OUTDOOR",
  "HOME:OUTDOOR_GARDEN:GARDEN_DECOR": "GARDEN_OUTDOOR",
  "HOME:OUTDOOR_GARDEN:OUTDOOR_FURNITURE": "GARDEN_OUTDOOR",
  
  // JEWELRY > NECKLACES > * -> JEWELRY > NECKLACES
  "JEWELRY:NECKLACES:CHOKERS": "NECKLACES",
  "JEWELRY:NECKLACES:BEADED_NECKLACES": "NECKLACES",
  "JEWELRY:NECKLACES:PENDANT_NECKLACES": "NECKLACES",
  "JEWELRY:NECKLACES:LAYERED_NECKLACES": "NECKLACES",
  "JEWELRY:NECKLACES:STATEMENT_NECKLACES": "NECKLACES",
  
  // JEWELRY > RINGS > * -> JEWELRY > RINGS
  "JEWELRY:RINGS:ENGAGEMENT_RINGS": "RINGS",
  "JEWELRY:RINGS:WEDDING_RINGS": "RINGS",
  "JEWELRY:RINGS:STACKING_RINGS": "RINGS",
  "JEWELRY:RINGS:COCKTAIL_RINGS": "RINGS",
  
  // JEWELRY > EARRINGS > * -> JEWELRY > EARRINGS
  "JEWELRY:EARRINGS:STUDS": "EARRINGS",
  "JEWELRY:EARRINGS:HOOPS": "EARRINGS",
  "JEWELRY:EARRINGS:DANGLES": "EARRINGS",
  "JEWELRY:EARRINGS:CHANDELIER": "EARRINGS",
  
  // JEWELRY > BRACELETS > * -> JEWELRY > BRACELETS
  "JEWELRY:BRACELETS:BEADED": "BRACELETS",
  "JEWELRY:BRACELETS:BANGLES": "BRACELETS",
  "JEWELRY:BRACELETS:CUFF": "BRACELETS",
  "JEWELRY:BRACELETS:CHARM": "BRACELETS",
  "JEWELRY:BRACELETS:CHAIN_AND_LINK": "BRACELETS",
  
  // JEWELRY > PINS > * -> JEWELRY > BROOCHES_PINS
  "JEWELRY:PINS:ENAMEL_PINS": "BROOCHES_PINS",
  "JEWELRY:PINS:NOVELTY_PINS": "BROOCHES_PINS",
  "JEWELRY:PINS:BROOCHES": "BROOCHES_PINS",
  
  // TOYS > PLUSH_TOYS > * -> TOYS_KIDS > PLUSH_DOLLS
  "TOYS:PLUSH_TOYS:TEDDY_BEARS": "PLUSH_DOLLS",
  "TOYS:PLUSH_TOYS:ANIMAL_PLUSH": "PLUSH_DOLLS",
  "TOYS:PLUSH_TOYS:DOLLS": "PLUSH_DOLLS",
  "TOYS:PLUSH_TOYS:PLUSHIES": "PLUSH_DOLLS",
  
  // TOYS > GAMES_PUZZLES > * -> TOYS_KIDS > GAMES_PUZZLES
  "TOYS:GAMES_PUZZLES:BOARD_GAMES": "GAMES_PUZZLES",
  "TOYS:GAMES_PUZZLES:PUZZLES": "GAMES_PUZZLES",
  "TOYS:GAMES_PUZZLES:CARD_GAMES": "GAMES_PUZZLES",
  
  // TOYS > PRETEND_PLAY > * -> TOYS_KIDS > PRETEND_PLAY
  "TOYS:PRETEND_PLAY:PLAY_FOOD": "PRETEND_PLAY",
  "TOYS:PRETEND_PLAY:DOLLS_ACCESSORIES": "PRETEND_PLAY",
  
  // TOYS > EDUCATIONAL > * -> TOYS_KIDS > EDUCATIONAL_TOYS
  "TOYS:EDUCATIONAL:STACKING_SORTING": "EDUCATIONAL_TOYS",
  "TOYS:EDUCATIONAL:COUNTING_LEARNING": "EDUCATIONAL_TOYS",
  
  // TOYS > SENSORY_TOYS > * -> TOYS_KIDS > SENSORY_TOYS
  "TOYS:SENSORY_TOYS:FIDGETS": "SENSORY_TOYS",
  "TOYS:SENSORY_TOYS:TEXTURED_TOYS": "SENSORY_TOYS",
  
  // CRAFT_SUPPLIES > YARN > * -> CRAFT_SUPPLIES > YARN_FIBER
  "CRAFT_SUPPLIES:YARN:COTTON_YARN": "YARN_FIBER",
  "CRAFT_SUPPLIES:YARN:WOOL_YARN": "YARN_FIBER",
  "CRAFT_SUPPLIES:YARN:ACRYLIC_YARN": "YARN_FIBER",
  "CRAFT_SUPPLIES:YARN:MERINO_WOOL": "YARN_FIBER",
  "CRAFT_SUPPLIES:YARN:BULKY_YARN": "YARN_FIBER",
  "CRAFT_SUPPLIES:YARN:FINGERING_YARN": "YARN_FIBER",
  "CRAFT_SUPPLIES:YARN:POLYESTER_YARN": "YARN_FIBER",
  
  // CRAFT_SUPPLIES > TOOLS > * -> CRAFT_SUPPLIES > TOOLS_EQUIPMENT
  "CRAFT_SUPPLIES:TOOLS:STITCH_MARKERS": "TOOLS_EQUIPMENT",
  "CRAFT_SUPPLIES:TOOLS:CROCHET_HOOKS": "TOOLS_EQUIPMENT",
  "CRAFT_SUPPLIES:TOOLS:KNITTING_NEEDLES": "TOOLS_EQUIPMENT",
};

/**
 * Map legacy category to new category structure
 * Returns { primaryCategory, secondaryCategory } or null if mapping fails
 */
function mapLegacyCategory(
  legacyPrimary: string | null | undefined,
  legacySecondary: string | null | undefined,
  legacyTertiary: string | null | undefined
): { primaryCategory: string; secondaryCategory: string } | null {
  // If no primary category, can't map
  if (!legacyPrimary) {
    return null;
  }

  // Map primary category
  const newPrimary = PRIMARY_CATEGORY_MAP[legacyPrimary];
  if (!newPrimary) {
    console.warn(`[WARNING] Unknown legacy primary category: ${legacyPrimary}`);
    return null;
  }

  // If we have a tertiary category, try to map it first (most specific)
  if (legacyTertiary && legacySecondary) {
    const tertiaryKey = `${legacyPrimary}:${legacySecondary}:${legacyTertiary}`;
    const mappedSecondary = TERTIARY_CATEGORY_MAP[tertiaryKey];
    if (mappedSecondary) {
      return {
        primaryCategory: newPrimary,
        secondaryCategory: mappedSecondary,
      };
    }
  }

  // If we have a secondary category, try to map it
  if (legacySecondary) {
    const secondaryKey = `${legacyPrimary}:${legacySecondary}`;
    const mappedSecondary = SECONDARY_CATEGORY_MAP[secondaryKey];
    if (mappedSecondary) {
      return {
        primaryCategory: newPrimary,
        secondaryCategory: mappedSecondary,
      };
    }
  }

  // Fallback: try to find a default secondary category for this primary
  const newPrimaryCategory = NewCategories.find((c) => c.id === newPrimary);
  if (newPrimaryCategory && newPrimaryCategory.children.length > 0) {
    // Use the first secondary category as default
    return {
      primaryCategory: newPrimary,
      secondaryCategory: newPrimaryCategory.children[0].id,
    };
  }

  console.warn(
    `[WARNING] Could not map legacy category: ${legacyPrimary} > ${legacySecondary || ""} > ${legacyTertiary || ""}`
  );
  return null;
}

/**
 * Main remapping function
 */
async function remapCategories(dryRun: boolean = false, limit?: number) {
  console.log("=".repeat(60));
  console.log("Category Remapping Script");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be made)" : "LIVE (will update database)"}`);
  if (limit) {
    console.log(`Limit: Processing first ${limit} products only`);
  }
  console.log("");

  try {
    // Get all products that need remapping
    // Products with legacy categories or products that might have been created with old structure
    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        primaryCategory: true,
        secondaryCategory: true,
        tertiaryCategory: true,
      },
      ...(limit ? { take: limit } : {}),
    });

    console.log(`Found ${products.length} products to process\n`);

    const results = {
      total: products.length,
      mapped: 0,
      skipped: 0,
      errors: 0,
      unchanged: 0,
    };

    const changes: Array<{
      productId: string;
      productName: string;
      old: { primary: string; secondary: string; tertiary?: string | null };
      new: { primary: string; secondary: string };
    }> = [];

    for (const product of products) {
      try {
        // Check if this product already uses new categories
        const isNewCategory = NewCategories.some(
          (cat) => cat.id === product.primaryCategory
        );

        if (isNewCategory) {
          // Already using new categories, skip
          results.unchanged++;
          continue;
        }

        // Map legacy category to new category
        const mapped = mapLegacyCategory(
          product.primaryCategory,
          product.secondaryCategory,
          product.tertiaryCategory || null
        );

        if (!mapped) {
          console.warn(
            `[SKIP] Product ${product.id} (${product.name}): Could not map category`
          );
          results.skipped++;
          continue;
        }

        // Check if category actually changed
        if (
          product.primaryCategory === mapped.primaryCategory &&
          product.secondaryCategory === mapped.secondaryCategory &&
          !product.tertiaryCategory
        ) {
          results.unchanged++;
          continue;
        }

        changes.push({
          productId: product.id,
          productName: product.name,
          old: {
            primary: product.primaryCategory,
            secondary: product.secondaryCategory,
            tertiary: product.tertiaryCategory,
          },
          new: {
            primary: mapped.primaryCategory,
            secondary: mapped.secondaryCategory,
          },
        });

        // Update product if not dry run
        if (!dryRun) {
          await db.product.update({
            where: { id: product.id },
            data: {
              primaryCategory: mapped.primaryCategory,
              secondaryCategory: mapped.secondaryCategory,
              tertiaryCategory: null, // Remove tertiary category
            } as any, // Type assertion needed if Prisma client is out of sync
          });
        }

        results.mapped++;
      } catch (error) {
        console.error(
          `[ERROR] Failed to process product ${product.id}:`,
          error instanceof Error ? error.message : String(error)
        );
        results.errors++;
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("Remapping Summary");
    console.log("=".repeat(60));
    console.log(`Total products processed: ${results.total}`);
    console.log(`Successfully mapped: ${results.mapped}`);
    console.log(`Unchanged (already new categories): ${results.unchanged}`);
    console.log(`Skipped (could not map): ${results.skipped}`);
    console.log(`Errors: ${results.errors}`);

    if (changes.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("Sample Changes (first 10):");
      console.log("=".repeat(60));
      changes.slice(0, 10).forEach((change) => {
        console.log(`\nProduct: ${change.productName}`);
        console.log(`  Old: ${change.old.primary} > ${change.old.secondary}${change.old.tertiary ? ` > ${change.old.tertiary}` : ""}`);
        console.log(`  New: ${change.new.primary} > ${change.new.secondary}`);
      });
      if (changes.length > 10) {
        console.log(`\n... and ${changes.length - 10} more changes`);
      }
    }

    if (dryRun) {
      console.log("\n⚠️  DRY RUN MODE - No changes were made to the database");
      console.log("Run without --dry-run to apply changes");
    } else {
      console.log("\n✅ Changes have been applied to the database");
    }

    return results;
  } catch (error) {
    console.error("[FATAL ERROR] Remapping failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

// Run the script
remapCategories(dryRun, limit)
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
