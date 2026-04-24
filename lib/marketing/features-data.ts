/**
 * Central copy for /features hub and per-feature landing pages (SEO + funnel).
 * Slugs are stable URLs avoid renaming without redirects.
 */

export type FeatureAudience = "seller" | "buyer";

export type MarketingFeature = {
  slug: string;
  audience: FeatureAudience;
  /** Card + H1 on detail page */
  title: string;
  /** 1–2 sentences on the hub */
  summary: string;
  metaTitle: string;
  metaDescription: string;
  /** Deeper sections for the detail page */
  detailIntro: string;
  detailSections: { heading: string; body: string[] }[];
};

const seller: MarketingFeature[] = [
  {
    slug: "verified-handmade-marketplace",
    audience: "seller",
    title: "A marketplace that protects handmade",
    summary:
      "Every seller is reviewed so buyers trust what they buy and your work is not buried next to mass-produced listings.",
    metaTitle: "Verified Handmade Marketplace for Sellers | OLOVARA",
    metaDescription:
      "Sell on a marketplace built for real makers. Human verification keeps the catalog authentic so handmade goods get the visibility they deserve.",
    detailIntro:
      "OLOVARA exists so authentic artisans are not competing with dropshipping or AI-generated listings. Our verification approach is designed to keep the catalog aligned with buyers who intentionally shop handmade.",
    detailSections: [
      {
        heading: "Why verification helps you",
        body: [
          "When the marketplace is curated for real handmade work, buyers learn to trust the platform. That trust translates into higher intent traffic for sellers who follow the guidelines.",
          "You spend less time explaining why your items are authentic because the environment already signals quality and human craft.",
        ],
      },
      {
        heading: "What buyers see",
        body: [
          "Shoppers come to OLOVARA looking for human-made goods and independent shops. Your brand benefits from being part of a community with clear standards rather than an everything-store algorithm.",
        ],
      },
    ],
  },
  {
    slug: "stripe-powered-payouts",
    audience: "seller",
    title: "Stripe-powered payouts",
    summary:
      "Get paid securely with payment infrastructure buyers already trust so checkout feels familiar and payouts stay straightforward.",
    metaTitle: "Secure Seller Payouts with Stripe | OLOVARA",
    metaDescription:
      "Receive payouts through Stripe on OLOVARA. Familiar checkout for buyers and reliable payment rails for your handmade business.",
    detailIntro:
      "Payments are a core part of running a shop. OLOVARA uses Stripe so buyers see a modern, trusted checkout experience and sellers get a clear path from sale to payout.",
    detailSections: [
      {
        heading: "Built on trusted rails",
        body: [
          "Stripe is widely recognized by online shoppers. That recognition reduces friction at checkout and helps customers feel confident when purchasing from an independent maker.",
          "For sellers, using established payment infrastructure means fewer surprises and a workflow oriented around completed orders and payouts.",
        ],
      },
      {
        heading: "Focus on your craft",
        body: [
          "Instead of stitching together payment tools, you can keep attention on listings, fulfillment, and customer relationships while the platform handles the standardized payment flow.",
        ],
      },
    ],
  },
  {
    slug: "custom-orders-and-commissions",
    audience: "seller",
    title: "Custom orders & commissions",
    summary:
      "Quote bespoke work, collect deposits or milestones, and keep the conversation tied to the order ideal for made-to-order pieces.",
    metaTitle: "Custom Orders & Commissions for Makers | OLOVARA",
    metaDescription:
      "Manage bespoke requests on OLOVARA: structured custom orders, clearer expectations, and payments aligned to how handmade commissions actually work.",
    detailIntro:
      "Many makers earn a meaningful part of revenue from custom work. OLOVARA supports custom order flows so scope, pricing, and payment milestones can stay organized instead of scattered across messages.",
    detailSections: [
      {
        heading: "Made-to-order, made clearer",
        body: [
          "Custom pieces need clarity: timelines, materials, revisions, and what happens if plans change. A structured order flow helps you set expectations up front.",
          "When payments align with milestones, both sides reduce risk you secure commitment, and the buyer sees progress tied to what they paid.",
        ],
      },
      {
        heading: "Less admin, more studio time",
        body: [
          "Keeping commission details adjacent to the order reduces back-and-forth hunting through threads. The goal is fewer mistakes and faster approvals so you can get back to making.",
        ],
      },
    ],
  },
  {
    slug: "shop-website-builder",
    audience: "seller",
    title: "Your own shop website",
    summary:
      "Build a branded storefront that feels like yours so repeat customers recognize your shop beyond a single listing tile.",
    metaTitle: "Online Shop Website Builder for Artisans | OLOVARA",
    metaDescription:
      "Create a branded shop site on OLOVARA. Showcase your handmade business with pages that tell your story and guide buyers to purchase.",
    detailIntro:
      "Listings help buyers find products; a shop website helps them remember you. OLOVARA includes tools to publish pages that reflect your brand and present your catalog in a cohesive way.",
    detailSections: [
      {
        heading: "Brand-forward presentation",
        body: [
          "Independent makers win on story, style, and trust. A dedicated shop experience gives space for your aesthetic not only a single product card.",
          "Use your site to highlight bestsellers, categories, policies, and contact points so new visitors understand what you offer at a glance.",
        ],
      },
      {
        heading: "Discovery plus destination",
        body: [
          "Marketplace discovery brings new eyes; your shop website helps convert interest into followers and repeat purchases. Together they support both short-term sales and long-term customer relationships.",
        ],
      },
    ],
  },
  {
    slug: "seller-dashboard-insights",
    audience: "seller",
    title: "Dashboard & order workflow",
    summary:
      "See orders, revenue trends, and day-to-day shop operations in one place so you always know what needs shipping or follow-up.",
    metaTitle: "Seller Dashboard & Order Management | OLOVARA",
    metaDescription:
      "Run your handmade shop from OLOVARA's seller dashboard: orders, performance signals, and workflows designed around real fulfillment tasks.",
    detailIntro:
      "Selling handmade is operational: inventory, packing, shipping, messages, and promotions. The seller dashboard is meant to centralize the operational picture so nothing slips through the cracks.",
    detailSections: [
      {
        heading: "Operational clarity",
        body: [
          "When order states are easy to scan, you ship faster and reduce mistakes. That matters for reviews, repeat buyers, and stress levels during busy seasons.",
          "Revenue and activity signals help you notice what is working without needing a separate spreadsheet for every question.",
        ],
      },
      {
        heading: "Built for small teams and solo makers",
        body: [
          "Whether you are a one-person studio or a tiny team, the goal is the same: fewer clicks to answer “what do I need to do today?”",
        ],
      },
    ],
  },
  {
    slug: "fair-pricing-aligned-growth",
    audience: "seller",
    title: "Fair pricing, aligned incentives",
    summary:
      "No listing fees so you are not paying rent before you sell. When the marketplace grows with real sales, incentives stay aligned.",
    metaTitle: "No Listing Fees & Fair Seller Pricing | OLOVARA",
    metaDescription:
      "Sell handmade on OLOVARA without listing fees. A model oriented around sales aligns marketplace success with artisan success.",
    detailIntro:
      "Upfront listing costs can punish experimentation and slow down new listings. OLOVARA emphasizes fee structures that scale with actual sales so risk stays lower for independent sellers testing ideas.",
    detailSections: [
      {
        heading: "Pay as you earn",
        body: [
          "When fees track performance, you are not penalized for maintaining a broad catalog or trying seasonal releases.",
          "Aligned incentives mean the platform succeeds when you convert not when you pay for shelf space.",
        ],
      },
      {
        heading: "Room to iterate",
        body: [
          "Handmade businesses evolve quickly: new materials, new collections, and custom offerings. Pricing that does not rely on heavy fixed listing costs makes iteration less painful.",
        ],
      },
    ],
  },
];

const buyer: MarketingFeature[] = [
  {
    slug: "curated-handmade-discovery",
    audience: "buyer",
    title: "Curated handmade discovery",
    summary:
      "Browse products from independent makers in a marketplace designed for craft not generic bulk goods.",
    metaTitle: "Discover Handmade Products from Independent Makers | OLOVARA",
    metaDescription:
      "Shop curated handmade goods on OLOVARA. Find artisan products from verified independent creators in a marketplace built for real craft.",
    detailIntro:
      "OLOVARA focuses on handmade and human-centered selling. That focus shapes discovery: you are less likely to wade through irrelevant mass-market noise while searching for something special.",
    detailSections: [
      {
        heading: "A catalog with intent",
        body: [
          "Many shoppers come to handmade marketplaces because they want unique items and to support independent work. Curation and seller standards help keep results aligned with that intent.",
          "You still have variety: different mediums, styles, and price points but within a frame that respects artisan selling.",
        ],
      },
      {
        heading: "Support independent work",
        body: [
          "When purchases flow to real shops, more resources return to small studios and local supply chains rather than anonymous bulk importers.",
        ],
      },
    ],
  },
  {
    slug: "secure-checkout-trust",
    audience: "buyer",
    title: "Secure checkout you can trust",
    summary:
      "Checkout uses modern payment tooling so your purchase is handled with the security buyers expect online.",
    metaTitle: "Secure Checkout for Handmade Purchases | OLOVARA",
    metaDescription:
      "Buy handmade on OLOVARA with secure checkout powered by trusted payment processing. Shop independent makers with confidence.",
    detailIntro:
      "Buying from a smaller brand should still feel safe. OLOVARA uses industry-standard payment processing so transactions follow familiar, secure patterns.",
    detailSections: [
      {
        heading: "Familiar buyer experience",
        body: [
          "Recognizable checkout flows reduce hesitation, especially for first-time buyers discovering a new maker.",
          "Strong payment infrastructure helps protect sensitive information using modern security practices.",
        ],
      },
      {
        heading: "Confidence for gifting and special items",
        body: [
          "Handmade purchases are often gifts or meaningful treats. A trustworthy checkout supports those higher-stakes moments.",
        ],
      },
    ],
  },
  {
    slug: "direct-messages-with-makers",
    audience: "buyer",
    title: "Talk directly with makers",
    summary:
      "Ask sizing, materials, or customization questions before you buy, handmade purchases often need a human answer.",
    metaTitle: "Message Artisan Sellers Before You Buy | OLOVARA",
    metaDescription:
      "Contact sellers on OLOVARA before purchasing. Ask about materials, sizing, lead times, and custom options for handmade goods.",
    detailIntro:
      "Mass-market shopping hides the maker. Handmade shopping often requires conversation: lead times, variations, and personalization. Messaging connects you to the person who actually makes the item.",
    detailSections: [
      {
        heading: "Reduce uncertainty",
        body: [
          "Photos cannot always answer every question. Direct messaging helps you confirm details that matter fit, color batches, fragrance notes, or shipping windows.",
          "Clear communication prevents mismatched expectations, which protects both buyer and seller.",
        ],
      },
      {
        heading: "Start custom projects",
        body: [
          "If you want something bespoke, messaging is often the first step. You can align on scope before committing.",
        ],
      },
    ],
  },
  {
    slug: "wishlists-and-planning",
    audience: "buyer",
    title: "Wishlists for planning purchases",
    summary:
      "Save pieces you love and return when you are ready perfect for gifts, seasonal shopping, or budgeting.",
    metaTitle: "Wishlists for Handmade Shopping | OLOVARA",
    metaDescription:
      "Save favorite handmade items to your wishlist on OLOVARA. Plan gifts and purchases from independent makers at your pace.",
    detailIntro:
      "Handmade shopping is rarely a single impulse click. Wishlists let you keep track of favorites while you compare options, wait for payday, or plan a gift timeline.",
    detailSections: [
      {
        heading: "Buy when it makes sense",
        body: [
          "A saved list reduces the anxiety of losing track of a shop you liked. Return when you are ready seasonal sales, restocks, or special occasions.",
        ],
      },
      {
        heading: "Gift planning",
        body: [
          "Wishlists are useful for birthdays and holidays. Collect ideas early so you are not scrambling at the last minute.",
        ],
      },
    ],
  },
  {
    slug: "shop-pages-and-stories",
    audience: "buyer",
    title: "Shop pages that tell a story",
    summary:
      "Visit full shop profiles to see a maker's world not just one isolated product photo.",
    metaTitle: "Browse Artisan Shop Profiles | OLOVARA",
    metaDescription:
      "Explore independent shop pages on OLOVARA. Learn about makers, see collections, and buy handmade goods in context.",
    detailIntro:
      "A single listing shows an item; a shop page shows a maker. Profiles help you understand style, values, and range so purchases feel intentional.",
    detailSections: [
      {
        heading: "Context builds confidence",
        body: [
          "Seeing multiple pieces from the same studio helps you judge consistency and quality. You buy with a fuller picture of what the maker offers.",
        ],
      },
      {
        heading: "Find your favorites",
        body: [
          "When you discover a maker you love, their shop becomes a place to return new drops, seasonal items, and commissions.",
        ],
      },
    ],
  },
  {
    slug: "reviews-and-community-trust",
    audience: "buyer",
    title: "Reviews & community trust",
    summary:
      "Learn from other buyers' experiences to choose makers and products with confidence.",
    metaTitle: "Reviews for Handmade Sellers & Products | OLOVARA",
    metaDescription:
      "Read buyer reviews on OLOVARA to choose handmade products and sellers with confidence. Community feedback supports smarter purchases.",
    detailIntro:
      "Handmade items vary by batch and maker. Reviews help translate past buyers' experiences into expectations you can use today.",
    detailSections: [
      {
        heading: "Signals beyond photos",
        body: [
          "Reviews can highlight shipping speed, packaging quality, sizing accuracy, and communication details that photos alone might not cover.",
        ],
      },
      {
        heading: "Reward excellent makers",
        body: [
          "Thoughtful feedback rewards sellers who deliver great work and helps them grow. It also steers new buyers toward reliable studios.",
        ],
      },
    ],
  },
];

export const SELLER_FEATURES: MarketingFeature[] = seller;
export const BUYER_FEATURES: MarketingFeature[] = buyer;

export const ALL_FEATURES: MarketingFeature[] = [...seller, ...buyer];

export function getFeatureBySlug(slug: string): MarketingFeature | undefined {
  return ALL_FEATURES.find((f) => f.slug === slug);
}

export function getAllFeatureSlugs(): string[] {
  return ALL_FEATURES.map((f) => f.slug);
}
