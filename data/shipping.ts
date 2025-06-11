export const SHIPPING_ZONES = [
  {
    id: "NORTH_AMERICA",
    name: "North America",
    description: "United States, Canada, and Mexico",
  },
  {
    id: "EUROPE",
    name: "Europe",
    description: "European Union and United Kingdom",
  },
  {
    id: "ASIA",
    name: "Asia",
    description: "China, Japan, Korea, and other Asian countries",
  },
  {
    id: "OCEANIA",
    name: "Oceania",
    description: "Australia, New Zealand, and Pacific Islands",
  },
  {
    id: "SOUTH_AMERICA",
    name: "South America",
    description: "All South American countries",
  },
  {
    id: "AFRICA",
    name: "Africa",
    description: "All African countries",
  },
  {
    id: "MIDDLE_EAST",
    name: "Middle East",
    description: "Middle Eastern countries including UAE, Saudi Arabia, Israel, etc.",
  },
  {
    id: "REST_OF_WORLD",
    name: "Rest of World",
    description: "All other countries not covered above",
  },
] as const;

export const SHIPPING_SERVICE_LEVELS = [
  {
    id: "STANDARD",
    name: "Standard Shipping",
    description: "Regular shipping service",
  },
  {
    id: "EXPRESS",
    name: "Express Shipping",
    description: "Faster shipping service",
  },
] as const;

export type ShippingZone = typeof SHIPPING_ZONES[number]["id"];
export type ShippingServiceLevel = typeof SHIPPING_SERVICE_LEVELS[number]["id"]; 