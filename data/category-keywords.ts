export interface CategoryKeywordEntry {
  id: string;          // category ID in your category tree (Primary / Secondary)
  name: string;        // shown label - optional but nice for debugging
  keywords: string[];  // all synonyms and natural-language matches
}

// This file maps keywords to category IDs for intelligent category suggestions
// Updated to match the new simplified category structure (Primary -> Secondary only)
export const CategoryKeywords: CategoryKeywordEntry[] = [
  // Art - Primary
  {
    id: "ART",
    name: "Art",
    keywords: ["art", "artwork", "collectible", "collectibles", "art piece", "fine art", "original art", "artwork"]
  },
  {
    id: "PRINTS_POSTERS",
    name: "Prints & Posters",
    keywords: ["print", "prints", "art print", "printable", "art reproduction", "poster", "art poster", "fine art print", "giclee", "giclee print", "museum quality print", "relief print", "woodcut", "linocut", "block print", "wood block", "lino print", "screenprint", "screen print", "silkscreen", "serigraph", "letterpress", "letter press"]
  },
  {
    id: "PHOTOGRAPHY",
    name: "Photography",
    keywords: ["photo", "photograph", "photography", "picture", "print photo", "art photo", "fine art photography"]
  },
  {
    id: "SCULPTURE_3D",
    name: "Sculptures & 3D Art",
    keywords: ["sculpture", "sculpt", "statue", "figurine", "3d art", "three dimensional", "metal", "bronze", "steel", "wood", "wood carving"]
  },
  {
    id: "GLASS",
    name: "Glass Art",
    keywords: ["glass", "glass sculpture", "glass art", "stained glass", "blown glass", "glasswork", "glassware"]
  },
  {
    id: "FIBER_ART",
    name: "Fiber Art (macrame, weaving, textile wall art)",
    keywords: ["fiber art", "fibre art", "macrame", "macramé", "weaving", "textile wall art", "textile art", "wall hanging", "tapestry", "fabric art"]
  },
  {
    id: "CERAMICS_POTTERY",
    name: "Ceramics & Pottery",
    keywords: ["ceramic", "ceramics", "pottery", "clay", "ceramic art", "pottery piece", "handmade ceramic", "handmade pottery"]
  },
  {
    id: "DRAWING_ILLUSTRATION",
    name: "Drawing & Illustration",
    keywords: ["drawing", "illustration", "illustrated", "sketch", "sketches", "pen and ink", "pencil", "charcoal", "pastel", "comic", "comics", "graphic novel", "manga", "illustrated book"]
  },
  {
    id: "STICKERS",
    name: "Stickers",
    keywords: ["sticker", "stickers", "decal", "decals", "vinyl sticker", "sticker pack"]
  },
  {
    id: "MINIATURES_DIORAMAS",
    name: "Miniatures & Dioramas",
    keywords: ["miniature", "miniatures", "diorama", "dioramas", "scale model", "miniature art", "tiny art"]
  },
  {
    id: "COLLECTIBLES",
    name: "Collectibles",
    keywords: ["collectible", "collectibles", "vintage", "antique", "rare", "limited edition"]
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
    keywords: ["necklace", "pendant", "chain", "jewelry necklace", "beaded necklace", "handmade necklace", "choker", "chokers", "choker necklace", "beaded necklace", "bead necklace", "pendant necklace", "pendant chain", "layered necklace", "multi layer", "statement necklace", "bold necklace"]
  },
  {
    id: "EARRINGS",
    name: "Earrings",
    keywords: ["earring", "earrings", "ear jewelry", "ear piece", "stud", "studs", "stud earring", "hoop", "hoops", "hoop earring", "circle earring", "dangle", "dangles", "dangle earring", "drop earring", "chandelier", "chandelier earring", "drop earring"]
  },
  {
    id: "RINGS",
    name: "Rings",
    keywords: ["ring", "rings", "finger ring", "jewelry ring", "engagement ring", "wedding ring", "wedding band", "stacking ring", "stack ring", "ring set", "cocktail ring", "statement ring"]
  },
  {
    id: "BRACELETS",
    name: "Bracelets",
    keywords: ["bracelet", "bracelets", "wrist jewelry", "wristband", "beaded bracelet", "bangle", "bangles", "cuff", "cuff bracelet", "charm", "charms", "charm bracelet", "chain bracelet", "link bracelet"]
  },
  {
    id: "ANKLETS",
    name: "Anklets",
    keywords: ["anklet", "anklets", "ankle jewelry", "ankle chain", "ankle bracelet"]
  },
  {
    id: "BROOCHES_PINS",
    name: "Brooches & Pins",
    keywords: ["pin", "pins", "brooch", "brooches", "lapel pin", "enamel pin", "enamel pins", "hard enamel", "soft enamel", "novelty pin", "fun pin", "decorative pin", "collectible pin", "vintage brooch"]
  },
  {
    id: "BODY_JEWELRY",
    name: "Body Jewelry",
    keywords: ["body jewelry", "body piercing", "piercing jewelry", "body art jewelry"]
  },
  {
    id: "JEWELRY_SETS",
    name: "Jewelry Sets",
    keywords: ["jewelry set", "jewelry sets", "jewelry collection", "matching jewelry", "jewelry bundle"]
  },
  {
    id: "CHARMS",
    name: "Charms",
    keywords: ["charm", "charms", "charm jewelry", "pendant charm", "bracelet charm"]
  },
  {
    id: "CUSTOM_JEWELRY",
    name: "Custom Jewelry",
    keywords: ["custom jewelry", "custom made", "personalized jewelry", "bespoke jewelry", "made to order"]
  },

  // Clothing & Accessories - Primary
  {
    id: "CLOTHING_ACCESSORIES",
    name: "Clothing & Accessories",
    keywords: ["clothing", "clothes", "apparel", "garment", "wear", "fashion", "outfit"]
  },
  {
    id: "TOPS",
    name: "Tops",
    keywords: ["top", "tops", "shirt", "blouse", "tee", "t-shirt", "sweater", "hoodie", "pullover", "jumper", "knit sweater", "wool sweater", "cardigan", "cardigans", "tank top", "tank", "tanks", "sleeveless", "camisole"]
  },
  {
    id: "BOTTOMS",
    name: "Bottoms",
    keywords: ["bottom", "bottoms", "pants", "trousers", "jeans", "shorts", "skirt", "leggings", "slacks", "yoga pants", "stretch pants", "athletic leggings"]
  },
  {
    id: "DRESSES_ONEPIECE",
    name: "Dresses & One-Piece",
    keywords: ["dress", "dresses", "gown", "frock", "casual dress", "formal dress", "evening dress", "cocktail dress", "maxi dress", "long dress", "floor length dress", "midi dress", "mid length dress", "summer dress", "sundress", "one piece", "jumpsuit", "romper"]
  },
  {
    id: "OUTERWEAR",
    name: "Outerwear",
    keywords: ["outerwear", "outer wear", "coat", "jacket", "winter wear", "outer layer", "winter coat", "overcoat", "raincoat", "trench coat", "blazer", "windbreaker", "denim jacket", "leather jacket", "vest", "vests", "waistcoat", "sleeveless jacket", "puffer vest", "poncho", "ponchos", "cape", "capes", "capelet"]
  },
  {
    id: "KNITWEAR",
    name: "Knitwear",
    keywords: ["knitwear", "knit", "knitted", "knit clothing", "knit garment", "hand knit", "hand knitted"]
  },
  {
    id: "BAGS_PURSES",
    name: "Bags & Purses",
    keywords: ["bag", "bags", "purse", "handbag", "tote", "backpack", "shoulder bag", "clutch", "tote bag", "canvas tote", "shopping tote", "rucksack", "daypack", "crossbody bag", "crossbody", "cross body", "messenger bag", "pouch", "pouches", "wristlet", "coin pouch"]
  },
  {
    id: "SCARVES_WRAPS",
    name: "Scarves & Wraps",
    keywords: ["scarf", "scarves", "neck scarf", "winter scarf", "fashion scarf", "wrap", "wraps", "shawl", "shawls", "pashmina"]
  },
  {
    id: "HATS_HEADWEAR",
    name: "Hats & Headwear",
    keywords: ["hat", "hats", "cap", "beanie", "baseball cap", "sun hat", "winter hat", "headwear", "head band", "headband"]
  },
  {
    id: "GLOVES_MITTENS",
    name: "Gloves & Mittens",
    keywords: ["glove", "gloves", "winter gloves", "fingerless gloves", "mittens", "mitten", "hand warmers"]
  },
  {
    id: "ACCESSORIES",
    name: "Accessories",
    keywords: ["accessory", "accessories", "fashion accessory", "style accessory", "belt", "belts", "waist belt", "leather belt", "fashion belt"]
  },

  // Home & Living - Primary
  {
    id: "HOME_LIVING",
    name: "Home & Living",
    keywords: ["home", "home decor", "homeware", "house", "household", "interior", "decor"]
  },
  {
    id: "HOME_DECOR",
    name: "Home Decor",
    keywords: ["decor", "decoration", "home decor", "interior decor", "decorative", "ornament", "vase", "vases", "flower vase", "decorative vase", "ceramic vase", "decorative bowl", "bowl", "display bowl", "ornamental bowl"]
  },
  {
    id: "WALL_ART_HANGINGS",
    name: "Wall Art & Hangings",
    keywords: ["wall art", "wall decor", "wall hanging", "artwork", "picture", "print", "wall decoration", "wall hangings", "tapestry", "textile art", "fabric wall art"]
  },
  {
    id: "CANDLES_HOLDERS",
    name: "Candles & Holders",
    keywords: ["candle", "candles", "scented candle", "wax candle", "jar candle", "pillar candle", "candle holder", "candlestick", "candle stand"]
  },
  {
    id: "KITCHEN_DINING",
    name: "Kitchen & Dining",
    keywords: ["kitchen", "dining", "kitchenware", "dinnerware", "cookware", "kitchen dining", "cup", "mug", "glass", "drinkware", "coffee cup", "tea cup", "water glass", "plate", "bowl", "tableware", "dinnerware", "dish", "serving dish", "serveware", "serving", "serving bowl", "serving platter", "tray", "platter", "serving tray", "serving platter", "cutting board", "chopping board", "cutting block", "linen", "linens", "kitchen towel", "dish towel", "tea towel", "napkin", "tablecloth"]
  },
  {
    id: "FURNITURE",
    name: "Furniture",
    keywords: ["furniture", "furnishing", "chair", "table", "furniture piece", "chairs", "seating", "seat", "dining chair", "dining table", "coffee table", "side table", "writing desk", "work desk", "bench", "benches", "seating bench", "garden bench", "storage bench", "stool", "stools", "bar stool", "counter stool"]
  },
  {
    id: "STORAGE_ORGANIZATION",
    name: "Storage & Organization",
    keywords: ["storage", "organization", "organizer", "organizing", "storage box", "storage basket", "storage container", "organizer box"]
  },
  {
    id: "LIGHTING",
    name: "Lighting",
    keywords: ["lighting", "lamp", "lamps", "light", "lights", "table lamp", "floor lamp", "pendant light", "light fixture"]
  },
  {
    id: "GARDEN_OUTDOOR",
    name: "Garden & Outdoor",
    keywords: ["garden", "outdoor", "garden decor", "outdoor decor", "patio", "yard", "outdoor garden", "planter", "planters", "flower pot", "pot", "plant pot", "garden planter", "garden decoration", "yard decor", "patio decor", "outdoor furniture", "patio furniture", "garden furniture", "outdoor seating", "patio set"]
  },
  {
    id: "SEASONAL_DECOR",
    name: "Seasonal Decor",
    keywords: ["seasonal", "seasonal decor", "holiday decor", "holiday decoration", "christmas", "halloween", "thanksgiving", "easter", "valentine"]
  },
  {
    id: "OFFICE_DESK",
    name: "Office & Desk",
    keywords: ["office", "desk", "office decor", "desk accessory", "desk organizer", "desk set", "office supply", "stationery", "pen holder", "desk lamp"]
  },

  // Bath & Beauty - Primary
  {
    id: "BATH_BEAUTY",
    name: "Bath & Beauty",
    keywords: ["bath", "beauty", "bath product", "beauty product", "personal care", "self care", "skincare"]
  },
  {
    id: "SOAP_BATH",
    name: "Soap & Bath",
    keywords: ["soap", "bar soap", "hand soap", "body wash", "cleanser", "wash", "cleansing", "bath", "handmade soap", "artisan soap", "natural soap", "liquid soap", "liquid cleanser", "bath bomb", "bath fizz", "fizzy", "soak bomb", "bath fizzer", "shower gel", "body gel", "shower wash", "gel cleanser", "bath salt", "bath salts", "soaking salt", "bath soak", "scrub", "body scrub", "exfoliating scrub", "salt scrub", "sugar scrub", "exfoliant", "exfoliate", "exfoliating", "bath oil", "bath oils", "bathing oil", "aromatic oil"]
  },
  {
    id: "SKINCARE",
    name: "Skincare",
    keywords: ["skincare", "skin care", "facial", "face care", "skin treatment", "cleanser", "facial cleanser", "face wash", "moisturizer", "moisturiser", "lotion", "cream", "face cream", "body lotion", "hydrating", "serum", "serums", "face serum", "skin serum", "eye serum", "eye treatment", "under eye", "balm", "salve", "healing balm", "lip balm", "ointment", "healing salve", "mask", "masks", "face mask", "facial mask", "skin mask", "clay mask"]
  },
  {
    id: "HAIRCARE",
    name: "Haircare",
    keywords: ["hair", "hair care", "hair product", "hair treatment", "haircare", "shampoo", "hair shampoo", "cleansing shampoo", "hair wash", "conditioner", "hair conditioner", "deep conditioner", "hair treatment", "hair mask", "hair care treatment", "hair therapy", "hair gel", "hair wax", "styling gel", "hair styling", "styling product", "hair brush", "comb", "hair comb", "detangling brush", "hair tool", "brush", "combs"]
  },
  {
    id: "COSMETICS",
    name: "Cosmetics",
    keywords: ["cosmetic", "cosmetics", "makeup", "make up", "beauty", "beauty product", "eye makeup", "eyeshadow", "mascara", "eyeliner", "eye shadow", "lipstick", "lip gloss", "lip color", "foundation", "concealer", "face powder", "blush", "bronzer", "makeup brush", "beauty brush", "cosmetic brush", "makeup tool", "beauty tool", "brush set"]
  },
  {
    id: "FRAGRANCE",
    name: "Fragrance",
    keywords: ["fragrance", "perfume", "cologne", "scent", "aroma", "aromatic", "essential oil", "essential oils", "aromatherapy oil", "therapeutic oil", "oil blend", "aromatherapy", "scent therapy"]
  },
  {
    id: "GROOMING",
    name: "Grooming",
    keywords: ["grooming", "grooming product", "personal grooming", "beard care", "shaving", "razor", "grooming tool"]
  },
  {
    id: "GIFT_SETS",
    name: "Gift Sets",
    keywords: ["gift set", "gift sets", "beauty set", "bath set", "skincare set", "gift bundle", "beauty bundle"]
  },
  {
    id: "COSMETIC_TOILETRY_STORAGE",
    name: "Cosmetic & Toiletry Storage",
    keywords: ["cosmetic storage", "toiletry storage", "makeup organizer", "beauty organizer", "cosmetic bag", "toiletry bag", "storage organizer"]
  },
  {
    id: "TOOLS_ACCESSORIES",
    name: "Tools & Accessories",
    keywords: ["beauty tool", "cosmetic tool", "makeup tool", "nail care", "nail polish", "nail art", "nail treatment", "manicure", "nail product", "nail file", "cuticle tool"]
  },

  // Toys & Kids - Primary
  {
    id: "TOYS_KIDS",
    name: "Toys & Kids",
    keywords: ["toy", "toys", "game", "games", "play", "plaything", "children toy", "kids", "kid", "child", "children"]
  },
  {
    id: "PLUSH_DOLLS",
    name: "Plush & Dolls",
    keywords: ["plush toy", "plush toys", "stuffed", "plush", "plushie", "stuffed animal", "soft toy", "cuddly", "doll", "dolls", "crochet doll", "rag doll", "plush doll", "amigurumi doll", "handmade doll", "teddy", "teddy bear", "crochet bear", "knit bear", "plush bear", "animal plush", "plush animal", "animal toy", "animals"]
  },
  {
    id: "WOODEN_TOYS",
    name: "Wooden Toys",
    keywords: ["wooden toy", "wooden toys", "wood toy", "wooden block", "wooden puzzle", "wooden game", "natural toy"]
  },
  {
    id: "GAMES_PUZZLES",
    name: "Games & Puzzles",
    keywords: ["game", "games", "puzzle", "puzzles", "board game", "card game", "puzzle game", "board games", "tabletop game", "boardgame", "jigsaw puzzle", "brain teaser", "playing cards", "card deck", "card set"]
  },
  {
    id: "PRETEND_PLAY",
    name: "Pretend Play",
    keywords: ["pretend play", "imaginative play", "role play", "pretend", "play set", "play food", "toy food", "pretend food", "fake food", "play kitchen food", "doll accessory", "doll accessories", "doll clothes", "doll outfit", "doll furniture"]
  },
  {
    id: "EDUCATIONAL_TOYS",
    name: "Educational Toys",
    keywords: ["educational toy", "educational toys", "learning toy", "educational", "learning", "stacking", "sorting", "stacking toy", "sorting toy", "stacking blocks", "sorting blocks", "counting", "counting toy", "learning toy", "numbers", "math toy"]
  },
  {
    id: "SENSORY_TOYS",
    name: "Sensory Toys",
    keywords: ["sensory toy", "sensory toys", "sensory play", "tactile", "stimulation toy", "sensory", "fidget", "fidgets", "fidget toy", "fidget spinner", "stress toy", "anxiety toy", "calming toy", "textured toy", "textured toys", "tactile toy", "texture", "sensory texture"]
  },
  {
    id: "BABY_TOYS",
    name: "Baby Toys",
    keywords: ["baby toy", "baby toys", "infant toy", "baby play", "teething toy", "baby rattle"]
  },
  {
    id: "KIDS_DECOR",
    name: "Kids Decor",
    keywords: ["kids decor", "children decor", "nursery decor", "kids room", "children room", "kids wall art", "kids decoration"]
  },
  {
    id: "KIDS_CLOTHING",
    name: "Kids Clothing",
    keywords: ["kids clothing", "children clothing", "kids clothes", "children clothes", "kids apparel", "baby clothes", "toddler clothes"]
  },
  {
    id: "PARTY_ACTIVITIES",
    name: "Party & Activities",
    keywords: ["party", "party supplies", "party decor", "party activity", "kids party", "children party", "party game", "activity", "activities"]
  },

  // Craft Supplies - Primary
  {
    id: "CRAFT_SUPPLIES",
    name: "Craft Supplies",
    keywords: ["craft", "craft supply", "crafting", "supplies", "craft material", "diy", "handmade supply"]
  },
  {
    id: "YARN_FIBER",
    name: "Yarn & Fiber",
    keywords: ["yarn", "wool", "thread", "fiber", "fibre", "knitting yarn", "crochet yarn", "yarn ball", "cotton", "cotton yarn", "dishcloth yarn", "kitchen yarn", "worsted cotton", "dk cotton", "soft cotton", "wool yarn", "natural wool", "handspun wool", "roving wool", "felting wool", "acrylic yarn", "synthetic yarn", "acrylic fiber", "merino", "merino wool", "merino yarn", "merino fiber", "bulky", "bulky yarn", "chunky yarn", "thick yarn", "super bulky", "fingering", "fingering yarn", "sock yarn", "fine yarn", "thin yarn", "polyester", "polyester yarn", "poly yarn"]
  },
  {
    id: "FABRIC_TEXTILES",
    name: "Fabric & Textiles",
    keywords: ["fabric", "cloth", "textile", "textiles", "material", "fabric yard", "fabric bolt", "fabric decor", "soft furnishings", "home textiles"]
  },
  {
    id: "BEADS_JEWELRY_SUPPLIES",
    name: "Beads & Jewelry Supplies",
    keywords: ["bead", "beads", "jewelry making", "beading", "jewelry supply", "bead supply", "jewelry finding", "jewelry component", "beading supply"]
  },
  {
    id: "TOOLS_EQUIPMENT",
    name: "Tools & Equipment",
    keywords: ["tool", "tools", "equipment", "craft tool", "sewing tool", "knitting tool", "crochet hook", "needle", "stitch", "marker", "stitch marker", "crochet", "hook", "crochet hook", "crochet tool", "knitting", "knitting needle", "knitting tool", "sewing", "sewing supply", "thread", "embroidery thread"]
  },
  {
    id: "PATTERNS_TEMPLATES",
    name: "Patterns & Templates (physical only)",
    keywords: ["pattern", "patterns", "template", "templates", "sewing pattern", "knitting pattern", "crochet pattern", "craft pattern", "physical pattern", "printed pattern"]
  },
  {
    id: "PAINTS_INKS_DYES",
    name: "Paints, Inks & Dyes",
    keywords: ["paint", "stain", "dye", "fabric paint", "fabric dye", "wood stain", "textile dye", "ink", "inks", "paint supply"]
  },
  {
    id: "PAPER_STATIONERY",
    name: "Paper & Stationery",
    keywords: ["paper", "cardstock", "scrapbook paper", "craft paper", "paper supply", "stationery", "stationary", "notebook", "journal"]
  },
  {
    id: "MOLDS_BLANKS",
    name: "Molds & Blanks",
    keywords: ["mold", "molds", "mould", "moulds", "blank", "blanks", "casting mold", "resin mold", "soap mold"]
  },
  {
    id: "KITS_BUNDLES",
    name: "Kits & Bundles",
    keywords: ["kit", "kits", "bundle", "bundles", "craft kit", "starter kit", "supply bundle", "craft bundle"]
  },
  {
    id: "NOTIONS_FINDINGS",
    name: "Notions & Findings",
    keywords: ["notion", "notions", "finding", "findings", "sewing notion", "jewelry finding", "hardware", "fastener", "button", "zipper", "snap"]
  },

  // Digital & Media - Primary
  {
    id: "DIGITAL_MEDIA",
    name: "Digital & Media",
    keywords: ["digital", "media", "digital product", "download", "downloadable", "file", "files"]
  },
  {
    id: "CROCHET_PATTERNS",
    name: "Crochet Patterns",
    keywords: ["crochet pattern", "crochet patterns", "crochet pdf", "crochet download", "crochet instruction", "crochet guide"]
  },
  {
    id: "KNITTING_PATTERNS",
    name: "Knitting Patterns",
    keywords: ["knitting pattern", "knitting patterns", "knit pattern", "knit patterns", "knitting pdf", "knitting download", "knitting instruction", "knitting guide"]
  },
  {
    id: "SEWING_PATTERNS",
    name: "Sewing Patterns",
    keywords: ["sewing pattern", "sewing patterns", "sew pattern", "sewing pdf", "sewing download", "sewing instruction", "sewing guide", "pattern pdf"]
  },
  {
    id: "PRINTABLE_ART",
    name: "Printable Art",
    keywords: ["printable art", "printable", "printable download", "digital art", "printable file", "art print", "digital print", "instant download"]
  },
  {
    id: "TEMPLATES_PLANNERS",
    name: "Templates & Planners",
    keywords: ["template", "templates", "planner", "planners", "digital template", "digital planner", "printable template", "printable planner", "pdf template", "pdf planner"]
  },
  {
    id: "MUSIC_AUDIO",
    name: "Music & Audio",
    keywords: ["music", "audio", "mp3", "song", "album", "audio book", "podcast", "sound", "music download", "audio file"]
  },
];
