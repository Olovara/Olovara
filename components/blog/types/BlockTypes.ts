// Base interface for all content blocks
export interface BaseBlock {
  id: string;
  type: string;
  order: number;
}

// Card block types
export interface CardBlock extends BaseBlock {
  type: "card";
  variant: "feature" | "tip" | "alert" | "info";
  title: string;
  content: string;
  icon?: string;
  color?: "purple" | "blue" | "green" | "yellow" | "red" | "gray";
  solution?: string; // Solution field for warning/alert cards
  link?: {
    text: string;
    url: string;
  };
}

// Step block types
export interface StepBlock extends BaseBlock {
  type: "step";
  stepNumber: number;
  title: string;
  description: string;
  details: string[];
  tips: string[];
  estimatedTime?: string;
  icon?: string;
}

// Alert block types
export interface AlertBlock extends BaseBlock {
  type: "alert";
  variant: "info" | "note" | "warning" | "success" | "error";
  title?: string;
  content: string;
  icon?: string;
}

// Table block types
export interface TableBlock extends BaseBlock {
  type: "table";
  title?: string;
  headers: string[];
  rows: string[][];
  variant?: "simple" | "striped" | "bordered";
  caption?: string;
}

// Feature grid block types
export interface FeatureGridBlock extends BaseBlock {
  type: "feature-grid";
  title?: string;
  description?: string;
  features: {
    title: string;
    description: string;
    icon?: string;
    color?: "purple" | "blue" | "green" | "yellow" | "red" | "gray";
    importance?: "Critical" | "High" | "Medium" | "Low";
    tips?: string[];
  }[];
  columns?: "2" | "3" | "4";
  variant?: "simple" | "detailed";
}

// Two column layout block types
export interface TwoColumnBlock extends BaseBlock {
  type: "two-column";
  leftContent: string;
  rightContent: string;
  leftTitle?: string;
  rightTitle?: string;
  leftIcon?: string;
  rightIcon?: string;
}

// Comparison table block types
export interface ComparisonTableBlock extends BaseBlock {
  type: "comparison-table";
  title?: string;
  headers: string[];
  rows: {
    feature: string;
    values: string[];
  }[];
  highlightColumn?: number;
}

// Requirements block types
export interface RequirementsBlock extends BaseBlock {
  type: "requirements";
  title: string;
  description?: string;
  requirements: {
    title: string;
    description: string;
    icon: string;
  }[];
  columns: "1" | "2" | "3";
  variant: "cards" | "list";
}

// Rich text block types
export interface RichTextBlock extends BaseBlock {
  type: "rich-text";
  title?: string;
  content: string;
}

// Union type for all block types
export type ContentBlock =
  | CardBlock
  | StepBlock
  | AlertBlock
  | TableBlock
  | FeatureGridBlock
  | TwoColumnBlock
  | ComparisonTableBlock
  | RequirementsBlock
  | RichTextBlock;

// Block configuration for the editor
export interface BlockConfig {
  type: string;
  label: string;
  description: string;
  icon: string;
  defaultData: Partial<ContentBlock>;
}

// Available icons for blocks
export const AVAILABLE_ICONS = [
  "Truck",
  "Globe",
  "DollarSign",
  "Clock",
  "Settings",
  "AlertCircle",
  "CheckCircle",
  "Info",
  "MapPin",
  "Package",
  "Star",
  "Heart",
  "Shield",
  "Zap",
  "Target",
  "TrendingUp",
  "Users",
  "BookOpen",
  "Lightbulb",
  "Award",
  "Gift",
  "ShoppingCart",
  "CreditCard",
  "Truck",
  "Home",
  "Search",
  "Filter",
  "Grid",
  "List",
] as const;

export type AvailableIcon = (typeof AVAILABLE_ICONS)[number];
