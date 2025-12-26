import { HandHeart, Heart, Leaf, Rainbow, Trophy, Users } from "lucide-react";

/**
 * Valid shop value filter IDs - single source of truth
 * These match the field names in the Seller model
 */
export const validShopValueIds = [
    "isWomanOwned",
    "isMinorityOwned",
    "isLGBTQOwned",
    "isVeteranOwned",
    "isSustainable",
    "isCharitable",
] as const;

/**
 * Type for valid shop value IDs
 */
export type ShopValueId = typeof validShopValueIds[number];

/**
 * Basic shop value definition (id and name only)
 * Used in filters and simple displays
 */
export interface ShopValue {
    id: ShopValueId;
    name: string;
}

/**
 * Extended shop value definition (includes icon and description)
 * Used in ShopByValues component and marketing displays
 */
export interface ShopValueExtended extends ShopValue {
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

/**
 * Basic shop values array - single source of truth for id and name
 * Use this for filters and simple displays
 */
export const shopValues: ShopValue[] = [
    {
        id: "isWomanOwned",
        name: "Woman-Owned",
    },
    {
        id: "isMinorityOwned",
        name: "Minority-Owned",
    },
    {
        id: "isLGBTQOwned",
        name: "LGBTQ+ Owned",
    },
    {
        id: "isVeteranOwned",
        name: "Veteran-Owned",
    },
    {
        id: "isSustainable",
        name: "Sustainable",
    },
    {
        id: "isCharitable",
        name: "Charitable",
    },
];

/**
 * Extended shop values array - includes icons and descriptions
 * Use this for marketing displays like ShopByValues component
 */
export const shopValuesExtended: ShopValueExtended[] = [
    {
        id: "isWomanOwned",
        name: "Woman-Owned",
        icon: Heart,
        description: "Support women entrepreneurs",
    },
    {
        id: "isMinorityOwned",
        name: "Minority-Owned",
        icon: Users,
        description: "Support minority entrepreneurs",
    },
    {
        id: "isLGBTQOwned",
        name: "LGBTQ+ Owned",
        icon: Rainbow,
        description: "Support LGBTQ+ businesses",
    },
    {
        id: "isVeteranOwned",
        name: "Veteran-Owned",
        icon: Trophy,
        description: "Support veteran entrepreneurs",
    },
    {
        id: "isSustainable",
        name: "Sustainable",
        icon: Leaf,
        description: "Eco-friendly practices",
    },
    {
        id: "isCharitable",
        name: "Charitable",
        icon: HandHeart,
        description: "Businesses that give back",
    },
];

