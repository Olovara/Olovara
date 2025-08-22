// Types
export * from "./types/BlockTypes";

// Components
export { FeatureCard } from "./cards/FeatureCard";
export { StepGuide } from "./steps/StepGuide";
export { InfoAlert } from "./alerts/InfoAlert";
export { DataTable } from "./tables/DataTable";
export { Requirements } from "./requirements/Requirements";
export { FeatureGrid } from "./feature-grid/FeatureGrid";
export { ContentBlockRenderer } from "./ContentBlockRenderer";
export { ContentBlockEditor } from "./ContentBlockEditor";
export { BlogPostPreview } from "./BlogPostPreview";

// Block configurations for the editor
export const BLOCK_CONFIGS = [
  {
    type: "card",
    label: "Feature Card",
    description: "Display features, tips, or information in a card format",
    icon: "Star",
    defaultData: {
      type: "card",
      variant: "feature",
      title: "Feature Title",
      content: "Feature description goes here...",
      color: "purple",
    },
  },
  {
    type: "step",
    label: "Step Guide",
    description: "Create step-by-step instructions with details and tips",
    icon: "Settings",
    defaultData: {
      type: "step",
      stepNumber: 1,
      title: "Step Title",
      description: "Step description",
      details: ["Detail 1", "Detail 2"],
      tips: ["Tip 1", "Tip 2"],
      estimatedTime: "5 minutes",
    },
  },
  {
    type: "alert",
    label: "Alert Box",
    description: "Display important information, warnings, or tips",
    icon: "AlertCircle",
    defaultData: {
      type: "alert",
      variant: "note",
      title: "Important Note",
      content: "Alert content goes here...",
    },
  },
  {
    type: "table",
    label: "Data Table",
    description: "Display data in a structured table format",
    icon: "Grid",
    defaultData: {
      type: "table",
      title: "Table Title",
      headers: ["Column 1", "Column 2", "Column 3"],
      rows: [
        ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
        ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"],
      ],
      variant: "simple",
    },
  },
  {
    type: "feature-grid",
    label: "Feature Grid",
    description: "Display features in a responsive grid layout",
    icon: "Grid",
    defaultData: {
      type: "feature-grid",
      title: "Feature Grid",
      description: "A grid of features with icons and descriptions",
      features: [
        {
          title: "Feature 1",
          description: "Description of feature 1",
          icon: "Star",
          color: "purple",
        },
        {
          title: "Feature 2",
          description: "Description of feature 2",
          icon: "CheckCircle",
          color: "blue",
        },
      ],
      columns: "2",
      variant: "simple",
    },
  },
  {
    type: "requirements",
    label: "Requirements",
    description: "Display a list of requirements with icons and hover effects",
    icon: "CheckCircle",
    defaultData: {
      type: "requirements",
      title: "Requirements",
      description: "Before proceeding, ensure you meet all requirements:",
      requirements: [
        {
          title: "Age Requirement",
          description: "Must be 18 years or older",
          icon: "Shield",
        },
        {
          title: "Valid Documentation",
          description: "Government ID and proof of address required",
          icon: "FileText",
        },
      ],
      columns: "2",
      variant: "cards",
    },
  },
] as const;
