import React from "react";
import { ContentBlock } from "./types/BlockTypes";
import { FeatureCard } from "./cards/FeatureCard";
import { StepGuide } from "./steps/StepGuide";
import { InfoAlert } from "./alerts/InfoAlert";
import { DataTable } from "./tables/DataTable";
import { Requirements } from "./requirements/Requirements";
import { FeatureGrid } from "./feature-grid/FeatureGrid";

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

export function ContentBlockRenderer({
  blocks,
  className,
}: ContentBlockRendererProps) {
  const renderBlock = (block: ContentBlock): React.ReactElement => {
    const blockId = (block as any).id || "unknown";
    const blockType = (block as any).type || "unknown";

    switch (blockType) {
      case "card":
        return <FeatureCard key={blockId} block={block as any} />;

      case "step":
        return <StepGuide key={blockId} block={block as any} />;

      case "alert":
        return <InfoAlert key={blockId} block={block as any} />;

      case "table":
        return <DataTable key={blockId} block={block as any} />;

      case "requirements":
        return <Requirements key={blockId} block={block as any} />;

      case "feature-grid":
        return <FeatureGrid key={blockId} block={block as any} />;

      // Add more block types here as we create them
      case "two-column":
        return <div key={blockId}>Two Column Component (Coming Soon)</div>;

      case "comparison-table":
        return (
          <div key={blockId}>Comparison Table Component (Coming Soon)</div>
        );

      default:
        return <div key={blockId}>Unknown block type: {blockType}</div>;
    }
  };

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className={className}>
      {sortedBlocks.map((block, index) => (
        <div key={block.id || index} className="mb-6 last:mb-0">
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
}
