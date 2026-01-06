export interface CategoryKeywordEntry {
  id: string;          // category ID in your real category tree (Primary / Secondary / Tertiary)
  name: string;        // shown label - optional but nice for debugging
  keywords: string[];  // all synonyms and natural-language matches
}

// This file maps keywords to category IDs for intelligent category suggestions
export const CategoryKeywords: CategoryKeywordEntry[] = [
  // Art & Collectibles - Primary
  {
    id: "ART",
    name: "Art & Collectibles",
    keywords: ["art", "artwork", "collectible", "collectibles", "art piece", "artwork", "fine art", "original art"]
  },
  {
    id: "PAINTINGS",
    name: "Paintings",
    keywords: ["painting", "paint", "canvas", "canvas art", "painted", "artwork painting", "original painting"]
  },
  {
    id: "ACRYLIC",
    name: "Acrylic",
    keywords: ["acrylic", "acrylic paint", "acrylic painting", "acrylic art"]
  },
  {
    id: "OIL",
    name: "Oil",
    keywords: ["oil", "oil painting", "oil paint", "oil on canvas", "oil artwork"]
  },
  {
    id: "GOUACHE",
    name: "Gouache",
    keywords: ["gouache", "gouache painting", "gouache art"]
  },
  {
    id: "INK",
    name: "Ink",
    keywords: ["ink", "ink painting", "ink art", "ink drawing", "ink wash"]
  },
  {
    id: "SPRAY_PAINT",
    name: "Spray Paint",
    keywords: ["spray paint", "spray art", "street art", "graffiti", "aerosol"]
  },
  {
    id: "PRINTS",
    name: "Prints",
    keywords: ["print", "prints", "art print", "printable", "art reproduction", "poster", "art poster"]
  },
  {
    id: "WOOD_AND_LINOCUT",
    name: "Wood and Linocut",
    keywords: ["woodcut", "linocut", "block print", "wood block", "lino print", "relief print"]
  },
  {
    id: "DIGITAL_ART",
    name: "Digital Art",
    keywords: ["digital", "digital art", "digital print", "digital artwork", "digital illustration"]
  },
  {
    id: "GICLEE",
    name: "Giclee",
    keywords: ["giclee", "giclee print", "fine art print", "museum quality print"]
  },
  {
    id: "SCREENPRINTS",
    name: "Screenprints",
    keywords: ["screenprint", "screen print", "silkscreen", "serigraph", "screen printing"]
  },
  {
    id: "LETTERPRESS",
    name: "Letterpress",
    keywords: ["letterpress", "letter press", "letterpress print", "typography print"]
  },
  {
    id: "PHOTOGRAPHY",
    name: "Photography",
    keywords: ["photo", "photograph", "photography", "picture", "print photo", "art photo", "fine art photography"]
  },
  {
    id: "SCULPTURES",
    name: "Sculptures",
    keywords: ["sculpture", "sculpt", "statue", "figurine", "3d art", "three dimensional"]
  },
  {
    id: "CERAMIC",
    name: "Ceramic",
    keywords: ["ceramic", "ceramics", "clay", "pottery", "ceramic sculpture", "clay art"]
  },
  {
    id: "GLASS",
    name: "Glass",
    keywords: ["glass", "glass sculpture", "glass art", "blown glass", "glasswork"]
  },
  {
    id: "METAL",
    name: "Metal",
    keywords: ["metal", "metal sculpture", "metal art", "bronze", "steel sculpture", "iron art"]
  },
  {
    id: "WOOD",
    name: "Wood",
    keywords: ["wood", "wood sculpture", "wood carving", "wooden art", "carved wood"]
  },
  {
    id: "COLLECTIBLES",
    name: "Collectibles",
    keywords: ["collectible", "collectibles", "vintage", "antique", "rare", "limited edition"]
  },

  // Bath & Beauty - Primary
  {
    id: "BATH",
    name: "Bath & Beauty",
    keywords: ["bath", "beauty", "bath product", "beauty product", "personal care", "self care", "skincare"]
  },
  {
    id: "SOAP",
    name: "Soaps and Washes",
    keywords: ["soap", "bar soap", "hand soap", "body wash", "cleanser", "wash", "cleansing"]
  },
  {
    id: "BAR_SOAP",
    name: "Bar Soap",
    keywords: ["bar soap", "soap bar", "handmade soap", "artisan soap", "natural soap"]
  },
  {
    id: "LIQUID_SOAP",
    name: "Liquid Soap",
    keywords: ["liquid soap", "hand soap", "body wash", "liquid cleanser"]
  },
  {
    id: "BATH_BOMBS",
    name: "Bath Bombs",
    keywords: ["bath bomb", "bath fizz", "fizzy", "soak bomb", "bath fizzer"]
  },
  {
    id: "SHOWER_GELS",
    name: "Shower Gels",
    keywords: ["shower gel", "body gel", "shower wash", "gel cleanser"]
  },
  {
    id: "BATH_SALTS_AND_SCRUBS",
    name: "Bath Salts and Scrubs",
    keywords: ["bath salt", "bath salts", "scrub", "body scrub", "exfoliating scrub", "salt scrub", "sugar scrub"]
  },
  {
    id: "BATH_OILS",
    name: "Bath Oils",
    keywords: ["bath oil", "bath oils", "bathing oil", "aromatic oil"]
  },
  {
    id: "SKIN",
    name: "Skin Care",
    keywords: ["skincare", "skin care", "facial", "face care", "skin treatment"]
  },
  {
    id: "FACIAL_CARE",
    name: "Facial Care",
    keywords: ["facial", "facial care", "face wash", "facial cleanser", "face treatment"]
  },
  {
    id: "MOISTURIZERS",
    name: "Moisturizers",
    keywords: ["moisturizer", "moisturiser", "lotion", "cream", "face cream", "body lotion", "hydrating"]
  },
  {
    id: "BALMS_AND_SALVES",
    name: "Balms and Salves",
    keywords: ["balm", "salve", "healing balm", "lip balm", "ointment", "healing salve"]
  },
  {
    id: "EXFOLIATION",
    name: "Exfoliation",
    keywords: ["exfoliant", "exfoliate", "exfoliating", "scrub", "peel", "face scrub"]
  },
  {
    id: "EYE_TREATMENTS",
    name: "Eye Treatments",
    keywords: ["eye cream", "eye treatment", "eye serum", "under eye", "eye care"]
  },
  {
    id: "SPA",
    name: "Spa and Relaxation",
    keywords: ["spa", "relaxation", "spa product", "relaxing", "wellness", "self care"]
  },
  {
    id: "AROMATHERAPY",
    name: "Aromatherapy",
    keywords: ["aromatherapy", "aromatic", "aroma", "therapeutic", "scent therapy"]
  },
  {
    id: "HEAT_AND_COLD_PACKS",
    name: "Heat and Cold Packs",
    keywords: ["heat pack", "cold pack", "hot pack", "ice pack", "warming", "cooling", "compress"]
  },
  {
    id: "MASSAGE",
    name: "Massage",
    keywords: ["massage", "massage oil", "massage cream", "massage lotion", "massage product"]
  },
  {
    id: "ESSENTIAL_OILS",
    name: "Essential Oils",
    keywords: ["essential oil", "essential oils", "aromatherapy oil", "therapeutic oil", "oil blend"]
  },
  {
    id: "SPA_KITS",
    name: "Spa Kits",
    keywords: ["spa kit", "spa set", "gift set", "spa bundle", "relaxation kit"]
  },
  {
    id: "COSMETICS",
    name: "Cosmetics",
    keywords: ["cosmetic", "cosmetics", "makeup", "make up", "beauty", "beauty product"]
  },
  {
    id: "EYES",
    name: "Eyes",
    keywords: ["eye makeup", "eyeshadow", "mascara", "eyeliner", "eye shadow", "eye cosmetic"]
  },
  {
    id: "LIPS",
    name: "Lips",
    keywords: ["lipstick", "lip gloss", "lip balm", "lip color", "lip cosmetic", "lip product"]
  },
  {
    id: "FACE",
    name: "Face",
    keywords: ["foundation", "concealer", "face powder", "blush", "bronzer", "face makeup"]
  },
  {
    id: "NAILS_AND_NAIL_CARE",
    name: "Nails and Nail Care",
    keywords: ["nail polish", "nail care", "nail art", "nail treatment", "manicure", "nail product"]
  },
  {
    id: "MAKEUP_TOOLS_BRUSHES",
    name: "Makeup Tools and Brushes",
    keywords: ["makeup brush", "beauty brush", "cosmetic brush", "makeup tool", "beauty tool", "brush set"]
  },
  {
    id: "HAIR",
    name: "Hair Care",
    keywords: ["hair", "hair care", "hair product", "hair treatment", "haircare"]
  },
  {
    id: "SHAMPOOS",
    name: "Shampoos",
    keywords: ["shampoo", "hair shampoo", "cleansing shampoo", "hair wash"]
  },
  {
    id: "CONDITIONERS_AND_TREATMENTS",
    name: "Conditioners and Treatments",
    keywords: ["conditioner", "hair conditioner", "hair treatment", "hair mask", "deep conditioner"]
  },
  {
    id: "BRUSHES_AND_COMBS",
    name: "Brushes and Combs",
    keywords: ["hair brush", "comb", "hair comb", "detangling brush", "hair tool"]
  },
  {
    id: "WAXES_AND_GELS",
    name: "Waxes and Gels",
    keywords: ["hair gel", "hair wax", "styling gel", "hair styling", "hair product"]
  },

  // Books & Media - Primary
  {
    id: "BOOKS",
    name: "Books & Media",
    keywords: ["book", "books", "media", "reading", "publication", "ebook", "digital book"]
  },
  {
    id: "COMICS",
    name: "Books and Comics",
    keywords: ["comic", "comics", "graphic novel", "manga", "comic book", "illustrated book"]
  },
  {
    id: "AUDIO",
    name: "Music and Audio",
    keywords: ["music", "audio", "mp3", "song", "album", "audio book", "podcast", "sound"]
  },

  // Clothing & Accessories - Primary
  {
    id: "CLOTHING",
    name: "Clothing & Accessories",
    keywords: ["clothing", "clothes", "apparel", "garment", "wear", "fashion", "outfit"]
  },
  {
    id: "TOPS",
    name: "Tops",
    keywords: ["top", "tops", "shirt", "blouse", "tee", "t-shirt", "sweater", "hoodie"]
  },
  {
    id: "SWEATERS",
    name: "Sweaters",
    keywords: ["sweater", "sweaters", "pullover", "jumper", "knit sweater", "wool sweater"]
  },
  {
    id: "CARDIGANS",
    name: "Cadigans",
    keywords: ["cardigan", "cardigans", "cardigan sweater", "button sweater", "open front sweater"]
  },
  {
    id: "T_SHIRTS",
    name: "T-Shirts",
    keywords: ["t-shirt", "tshirt", "tee", "tees", "t shirt", "cotton tee", "basic tee"]
  },
  {
    id: "BLOUSES",
    name: "Blouses",
    keywords: ["blouse", "blouses", "shirt", "top blouse", "womens blouse"]
  },
  {
    id: "TANK_TOPS",
    name: "Tank Tops",
    keywords: ["tank top", "tank", "tanks", "sleeveless", "tank shirt", "camisole"]
  },
  {
    id: "BOTTOMS",
    name: "Bottoms",
    keywords: ["bottom", "bottoms", "pants", "trousers", "jeans", "shorts", "skirt", "leggings"]
  },
  {
    id: "PANTS",
    name: "Pants",
    keywords: ["pants", "trousers", "slacks", "pant", "trouser"]
  },
  {
    id: "SHORTS",
    name: "Shorts",
    keywords: ["shorts", "short", "short pants", "bermuda shorts"]
  },
  {
    id: "SKIRTS",
    name: "Skirts",
    keywords: ["skirt", "skirts", "mini skirt", "maxi skirt", "midi skirt"]
  },
  {
    id: "LEGGINGS",
    name: "Leggings",
    keywords: ["leggings", "legging", "yoga pants", "stretch pants", "athletic leggings"]
  },
  {
    id: "DRESSES",
    name: "Dresses",
    keywords: ["dress", "dresses", "gown", "frock"]
  },
  {
    id: "CASUAL_DRESSES",
    name: "Casual Dresses",
    keywords: ["casual dress", "casual dresses", "everyday dress", "day dress", "casual wear"]
  },
  {
    id: "FORMAL_DRESSES",
    name: "Formal Dresses",
    keywords: ["formal dress", "formal dresses", "evening dress", "gown", "cocktail dress"]
  },
  {
    id: "MAXI_DRESSES",
    name: "Maxi Dresses",
    keywords: ["maxi dress", "maxi dresses", "long dress", "floor length dress"]
  },
  {
    id: "MIDI_DRESSES",
    name: "Midi Dresses",
    keywords: ["midi dress", "midi dresses", "mid length dress", "knee length dress"]
  },
  {
    id: "SUMMER_DRESSES",
    name: "Summer Dresses",
    keywords: ["summer dress", "summer dresses", "sundress", "sundresses", "summer wear"]
  },
  {
    id: "OUTERWEAR",
    name: "Outerwear",
    keywords: ["outerwear", "outer wear", "coat", "jacket", "winter wear", "outer layer"]
  },
  {
    id: "COATS",
    name: "Coats",
    keywords: ["coat", "coats", "winter coat", "overcoat", "raincoat", "trench coat"]
  },
  {
    id: "JACKETS",
    name: "Jackets",
    keywords: ["jacket", "jackets", "blazer", "windbreaker", "denim jacket", "leather jacket"]
  },
  {
    id: "VESTS",
    name: "Vests",
    keywords: ["vest", "vests", "waistcoat", "sleeveless jacket", "puffer vest"]
  },
  {
    id: "PONCHOS",
    name: "Ponchos",
    keywords: ["poncho", "ponchos", "cape poncho", "blanket poncho"]
  },
  {
    id: "CAPES",
    name: "Capes",
    keywords: ["cape", "capes", "capelet", "shoulder cape", "fashion cape"]
  },
  {
    id: "ACCESSORIES",
    name: "Accessories",
    keywords: ["accessory", "accessories", "fashion accessory", "style accessory"]
  },
  {
    id: "HATS",
    name: "Hats",
    keywords: ["hat", "hats", "cap", "beanie", "baseball cap", "sun hat", "winter hat"]
  },
  {
    id: "SCARVES",
    name: "Scarves",
    keywords: ["scarf", "scarves", "neck scarf", "winter scarf", "fashion scarf"]
  },
  {
    id: "GLOVES",
    name: "Gloves",
    keywords: ["glove", "gloves", "winter gloves", "fingerless gloves", "mittens"]
  },
  {
    id: "BELTS",
    name: "Belts",
    keywords: ["belt", "belts", "waist belt", "leather belt", "fashion belt"]
  },
  {
    id: "BAGS",
    name: "Bags and Purses",
    keywords: ["bag", "bags", "purse", "handbag", "tote", "backpack", "shoulder bag", "clutch"]
  },
  {
    id: "TOTE_BAGS",
    name: "Tote Bags",
    keywords: ["tote bag", "tote", "totes", "tote bags", "canvas tote", "shopping tote"]
  },
  {
    id: "BACKPACKS",
    name: "Backpacks",
    keywords: ["backpack", "backpacks", "rucksack", "daypack", "school backpack"]
  },
  {
    id: "CROSSBODY_BAGS",
    name: "Crossbody Bags",
    keywords: ["crossbody bag", "crossbody", "cross body", "messenger bag", "shoulder bag"]
  },
  {
    id: "POUCHES",
    name: "Pouches",
    keywords: ["pouch", "pouches", "wristlet", "coin pouch", "small bag"]
  },

  // Handmade Craft Supplies - Primary
  {
    id: "CRAFT_SUPPLIES",
    name: "Handmade Craft Supplies",
    keywords: ["craft", "craft supply", "crafting", "supplies", "craft material", "diy", "handmade supply"]
  },
  {
    id: "YARN",
    name: "Yarn",
    keywords: ["yarn", "wool", "thread", "fiber", "knitting yarn", "crochet yarn", "yarn ball"]
  },
  {
    id: "COTTON_YARN",
    name: "Cotton Yarn",
    keywords: ["cotton", "cotton yarn", "dishcloth yarn", "kitchen yarn", "worsted cotton", "dk cotton", "soft cotton"]
  },
  {
    id: "WOOL_YARN",
    name: "Wool Yarn",
    keywords: ["wool", "wool yarn", "natural wool", "handspun wool", "roving wool", "felting wool"]
  },
  {
    id: "ACRYLIC_YARN",
    name: "Acrylic Yarn",
    keywords: ["acrylic yarn", "synthetic yarn", "acrylic fiber", "acrylic wool"]
  },
  {
    id: "MERINO_WOOL",
    name: "Merino Wool",
    keywords: ["merino", "merino wool", "merino yarn", "merino fiber"]
  },
  {
    id: "BULKY_YARN",
    name: "Bulky Yarn",
    keywords: ["bulky", "bulky yarn", "chunky yarn", "thick yarn", "super bulky"]
  },
  {
    id: "FINGERING_YARN",
    name: "Fingering Yarn",
    keywords: ["fingering", "fingering yarn", "sock yarn", "fine yarn", "thin yarn"]
  },
  {
    id: "POLYESTER_YARN",
    name: "Polyester Yarn",
    keywords: ["polyester", "polyester yarn", "poly yarn", "synthetic yarn"]
  },
  {
    id: "FABRIC",
    name: "Fabric",
    keywords: ["fabric", "cloth", "textile", "material", "fabric yard", "fabric bolt"]
  },
  {
    id: "TOOLS",
    name: "Tools & Equipment",
    keywords: ["tool", "tools", "equipment", "craft tool", "sewing tool", "knitting tool", "crochet hook", "needle"]
  },
  {
    id: "STITCH_MARKERS",
    name: "Stitch Markers",
    keywords: ["stitch", "marker", "stitch marker", "crochet tool", "knitting tool"]
  },
  {
    id: "CROCHET_HOOKS",
    name: "Crochet Hooks",
    keywords: ["crochet", "hook", "crochet hook", "crochet tool"]
  },
  {
    id: "KNITTING_NEEDLES",
    name: "Knitting Needles",
    keywords: ["knitting", "needle", "knitting needle", "knitting tool"]
  },
  {
    id: "BEADS",
    name: "Beads & Jewelry Making",
    keywords: ["bead", "beads", "jewelry making", "beading", "jewelry supply", "bead supply"]
  },
  {
    id: "FIBER",
    name: "Fiber and Sewing",
    keywords: ["fiber", "fibre", "sewing", "sewing supply", "thread", "embroidery thread"]
  },
  {
    id: "PAPER",
    name: "Paper Supplies",
    keywords: ["paper", "cardstock", "scrapbook paper", "craft paper", "paper supply"]
  },
  {
    id: "PAINT",
    name: "Paint, Stain, and Dye",
    keywords: ["paint", "stain", "dye", "fabric paint", "fabric dye", "wood stain", "textile dye"]
  },

  // Home & Living - Primary
  {
    id: "HOME",
    name: "Home & Living",
    keywords: ["home", "home decor", "homeware", "house", "household", "interior", "decor"]
  },
  {
    id: "HOME_DECOR",
    name: "Home Decor",
    keywords: ["decor", "decoration", "home decor", "interior decor", "decorative", "ornament"]
  },
  {
    id: "WALL_ART",
    name: "Wall Art",
    keywords: ["wall art", "wall decor", "wall hanging", "artwork", "picture", "print", "wall decoration"]
  },
  {
    id: "CANDLES",
    name: "Candles",
    keywords: ["candle", "candles", "scented candle", "wax candle", "jar candle", "pillar candle"]
  },
  {
    id: "VASES",
    name: "Vases",
    keywords: ["vase", "vases", "flower vase", "decorative vase", "ceramic vase"]
  },
  {
    id: "DECORATIVE_BOWLS",
    name: "Decorative Bowls",
    keywords: ["decorative bowl", "bowl", "decorative bowls", "display bowl", "ornamental bowl"]
  },
  {
    id: "TEXTILES",
    name: "Textiles",
    keywords: ["textile", "textiles", "fabric decor", "soft furnishings", "home textiles"]
  },
  {
    id: "THROW_PILLOWS",
    name: "Throw Pillows",
    keywords: ["pillow", "throw pillow", "cushion", "decorative pillow", "pillow cover", "throw pillows"]
  },
  {
    id: "RUGS",
    name: "Rugs",
    keywords: ["rug", "rugs", "carpet", "area rug", "floor rug", "mat"]
  },
  {
    id: "BLANKETS",
    name: "Blankets & Throws",
    keywords: ["blanket", "blankets", "throw", "throws", "afghan", "coverlet", "quilt"]
  },
  {
    id: "WALL_HANGINGS",
    name: "Wall Hangings",
    keywords: ["wall hanging", "wall hangings", "tapestry", "textile art", "fabric wall art"]
  },
  {
    id: "KITCHEN_DINING",
    name: "Kitchen & Dining",
    keywords: ["kitchen", "dining", "kitchenware", "dinnerware", "cookware", "kitchen dining"]
  },
  {
    id: "DRINKWARE",
    name: "Drinkware",
    keywords: ["cup", "mug", "glass", "drinkware", "coffee cup", "tea cup", "water glass"]
  },
  {
    id: "TABLEWARE",
    name: "Tableware",
    keywords: ["plate", "bowl", "tableware", "dinnerware", "dish", "serving dish"]
  },
  {
    id: "SERVEWARE",
    name: "Serveware",
    keywords: ["serveware", "serving", "serving dish", "serving bowl", "serving platter", "serve ware"]
  },
  {
    id: "TRAYS_PLATTERS",
    name: "Trays & Platters",
    keywords: ["tray", "platter", "serving tray", "serving platter", "tray set", "trays", "platters"]
  },
  {
    id: "CUTTING_BOARDS",
    name: "Cutting Boards",
    keywords: ["cutting board", "chopping board", "cutting block", "board"]
  },
  {
    id: "LINENS",
    name: "Kitchen Linens",
    keywords: ["linen", "linens", "kitchen towel", "dish towel", "tea towel", "napkin", "tablecloth"]
  },
  {
    id: "FURNITURE",
    name: "Furniture",
    keywords: ["furniture", "furnishing", "chair", "table", "desk", "furniture piece"]
  },
  {
    id: "CHAIRS",
    name: "Chairs",
    keywords: ["chair", "chairs", "seating", "seat", "dining chair"]
  },
  {
    id: "TABLES",
    name: "Tables",
    keywords: ["table", "tables", "dining table", "coffee table", "side table"]
  },
  {
    id: "DESKS",
    name: "Desks",
    keywords: ["desk", "desks", "writing desk", "office desk", "work desk"]
  },
  {
    id: "BENCHES",
    name: "Benches",
    keywords: ["bench", "benches", "seating bench", "garden bench", "storage bench"]
  },
  {
    id: "STOOLS",
    name: "Stools",
    keywords: ["stool", "stools", "bar stool", "counter stool", "seating stool"]
  },
  {
    id: "OUTDOOR_GARDEN",
    name: "Outdoor & Garden",
    keywords: ["garden", "outdoor", "garden decor", "outdoor decor", "patio", "yard", "outdoor garden"]
  },
  {
    id: "PLANTERS",
    name: "Planters",
    keywords: ["planter", "planters", "flower pot", "pot", "plant pot", "garden planter"]
  },
  {
    id: "GARDEN_DECOR",
    name: "Garden Decor",
    keywords: ["garden decor", "garden decoration", "outdoor decor", "yard decor", "patio decor"]
  },
  {
    id: "OUTDOOR_FURNITURE",
    name: "Outdoor Furniture",
    keywords: ["outdoor furniture", "patio furniture", "garden furniture", "outdoor seating", "patio set"]
  },

  // Jewelry - Primary
  {
    id: "JEWELRY",
    name: "Jewelry",
    keywords: ["jewelry", "jewellery", "jewel", "accessory", "jewelry piece"]
  },
  {
    id: "NECKLACES",
    name: "Necklaces",
    keywords: ["necklace", "pendant", "chain", "jewelry necklace", "beaded necklace", "handmade necklace"]
  },
  {
    id: "CHOKERS",
    name: "Chokers",
    keywords: ["choker", "chokers", "choker necklace", "choker chain"]
  },
  {
    id: "BEADED_NECKLACES",
    name: "Beaded Necklaces",
    keywords: ["beaded necklace", "bead necklace", "bead jewelry"]
  },
  {
    id: "PENDANT_NECKLACES",
    name: "Pendant Necklaces",
    keywords: ["pendant", "pendant necklace", "pendant chain", "necklace pendant"]
  },
  {
    id: "LAYERED_NECKLACES",
    name: "Layered Necklaces",
    keywords: ["layered necklace", "multi layer", "layered chain"]
  },
  {
    id: "STATEMENT_NECKLACES",
    name: "Statement Necklaces",
    keywords: ["statement necklace", "bold necklace", "statement piece"]
  },
  {
    id: "RINGS",
    name: "Rings",
    keywords: ["ring", "rings", "finger ring", "jewelry ring"]
  },
  {
    id: "ENGAGEMENT_RINGS",
    name: "Engagement Rings",
    keywords: ["engagement ring", "engagement", "proposal ring", "diamond ring"]
  },
  {
    id: "WEDDING_RINGS",
    name: "Wedding Rings",
    keywords: ["wedding ring", "wedding band", "marriage ring", "wedding"]
  },
  {
    id: "STACKING_RINGS",
    name: "Stacking Rings",
    keywords: ["stacking ring", "stack ring", "ring set", "multiple rings"]
  },
  {
    id: "COCKTAIL_RINGS",
    name: "Cocktail Rings",
    keywords: ["cocktail ring", "statement ring", "large ring"]
  },
  {
    id: "EARRINGS",
    name: "Earrings",
    keywords: ["earring", "earrings", "ear jewelry", "ear piece"]
  },
  {
    id: "STUDS",
    name: "Studs",
    keywords: ["stud", "studs", "stud earring", "stud earrings", "post earring"]
  },
  {
    id: "HOOPS",
    name: "Hoops",
    keywords: ["hoop", "hoops", "hoop earring", "hoop earrings", "circle earring"]
  },
  {
    id: "DANGLES",
    name: "Dangles",
    keywords: ["dangle", "dangles", "dangle earring", "drop earring", "dangling"]
  },
  {
    id: "CHANDELIER",
    name: "Chandelier",
    keywords: ["chandelier", "chandelier earring", "chandelier earrings", "drop earring"]
  },
  {
    id: "BRACELETS",
    name: "Bracelets",
    keywords: ["bracelet", "bracelets", "wrist jewelry", "wristband"]
  },
  {
    id: "BEADED",
    name: "Beaded",
    keywords: ["beaded bracelet", "bead bracelet", "bead jewelry"]
  },
  {
    id: "BANGLES",
    name: "Bangles",
    keywords: ["bangle", "bangles", "bangle bracelet", "rigid bracelet"]
  },
  {
    id: "CUFF",
    name: "Cuff",
    keywords: ["cuff", "cuff bracelet", "cuff jewelry", "wide bracelet"]
  },
  {
    id: "CHARM",
    name: "Charm",
    keywords: ["charm", "charms", "charm bracelet", "charm jewelry"]
  },
  {
    id: "CHAIN_AND_LINK",
    name: "Chain and Link",
    keywords: ["chain bracelet", "link bracelet", "chain jewelry", "link jewelry"]
  },
  {
    id: "PINS",
    name: "Pins and Brooches",
    keywords: ["pin", "pins", "brooch", "brooches", "lapel pin", "enamel pin"]
  },
  {
    id: "ENAMEL_PINS",
    name: "Enamel Pins",
    keywords: ["enamel pin", "enamel pins", "hard enamel", "soft enamel"]
  },
  {
    id: "NOVELTY_PINS",
    name: "Novelty Pins",
    keywords: ["novelty pin", "fun pin", "decorative pin", "collectible pin"]
  },
  {
    id: "BROOCHES",
    name: "Brooches",
    keywords: ["brooch", "brooches", "vintage brooch", "decorative brooch"]
  },

  // Toys & Games - Primary
  {
    id: "TOYS",
    name: "Toys & Games",
    keywords: ["toy", "toys", "game", "games", "play", "plaything", "children toy"]
  },
  {
    id: "PLUSH_TOYS",
    name: "Plush Toys & Dolls",
    keywords: ["plush toy", "plush toys", "stuffed", "plush", "plushie", "stuffed animal", "soft toy", "cuddly", "doll"]
  },
  {
    id: "TEDDY_BEARS",
    name: "Teddy Bears",
    keywords: ["bear plush", "teddy", "teddy bear", "crochet bear", "knit bear", "plush bear", "teddy bears"]
  },
  {
    id: "ANIMAL_PLUSH",
    name: "Animal Plush",
    keywords: ["animal plush", "plush animal", "stuffed animal", "animal toy", "animals", "plush animals"]
  },
  {
    id: "DOLLS",
    name: "Dolls",
    keywords: ["doll", "dolls", "crochet doll", "rag doll", "plush doll", "amigurumi doll", "handmade doll"]
  },
  {
    id: "PLUSHIES",
    name: "Plushies",
    keywords: ["plushie", "plushies", "plush toy", "soft toy", "cuddly toy"]
  },
  {
    id: "GAMES_PUZZLES",
    name: "Games & Puzzles",
    keywords: ["game", "games", "puzzle", "puzzles", "board game", "card game", "puzzle game", "games puzzles"]
  },
  {
    id: "BOARD_GAMES",
    name: "Board Games",
    keywords: ["board game", "board games", "tabletop game", "boardgame"]
  },
  {
    id: "PUZZLES",
    name: "Puzzles",
    keywords: ["puzzle", "puzzles", "jigsaw puzzle", "puzzle game", "brain teaser"]
  },
  {
    id: "CARD_GAMES",
    name: "Card Games",
    keywords: ["card game", "card games", "playing cards", "card deck", "card set"]
  },
  {
    id: "PRETEND_PLAY",
    name: "Pretend Play",
    keywords: ["pretend play", "imaginative play", "role play", "pretend", "play set"]
  },
  {
    id: "PLAY_FOOD",
    name: "Play Food",
    keywords: ["play food", "toy food", "pretend food", "fake food", "play kitchen food"]
  },
  {
    id: "DOLLS_ACCESSORIES",
    name: "Doll Accessories",
    keywords: ["doll accessory", "doll accessories", "doll clothes", "doll outfit", "doll furniture"]
  },
  {
    id: "EDUCATIONAL",
    name: "Educational Toys",
    keywords: ["educational toy", "educational toys", "learning toy", "educational", "learning"]
  },
  {
    id: "STACKING_SORTING",
    name: "Stacking & Sorting",
    keywords: ["stacking", "sorting", "stacking toy", "sorting toy", "stacking blocks", "sorting blocks"]
  },
  {
    id: "COUNTING_LEARNING",
    name: "Counting & Learning",
    keywords: ["counting", "learning", "counting toy", "learning toy", "numbers", "math toy"]
  },
  {
    id: "SENSORY_TOYS",
    name: "Sensory Toys",
    keywords: ["sensory toy", "sensory toys", "sensory play", "tactile", "stimulation toy", "sensory"]
  },
  {
    id: "FIDGETS",
    name: "Fidget Toys",
    keywords: ["fidget", "fidgets", "fidget toy", "fidget spinner", "stress toy", "fidget toy"]
  },
  {
    id: "TEXTURED_TOYS",
    name: "Textured Toys",
    keywords: ["textured toy", "textured toys", "tactile toy", "texture", "sensory texture"]
  },
];
