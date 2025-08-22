import React from "react";
import * as LucideIcons from "lucide-react";
import { FeatureGridBlock } from "../types/BlockTypes";
import { CheckCircle } from "lucide-react";

interface FeatureGridProps {
  block: FeatureGridBlock;
}

export function FeatureGrid({ block }: FeatureGridProps) {
  // Function to render an icon by name
  const renderIcon = (iconName: string, className: string = "h-5 w-5") => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return null;
  };

  const gridCols = {
    "2": "grid-cols-1 md:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  // Color variants for feature grid
  const colorVariants = {
    purple: {
      border: "border-purple-200 hover:border-purple-300",
      icon: "text-purple-600",
      bg: "bg-purple-50",
      text: "text-purple-800",
    },
    blue: {
      border: "border-blue-200 hover:border-blue-300",
      icon: "text-blue-600",
      bg: "bg-blue-50",
      text: "text-blue-800",
    },
    green: {
      border: "border-green-200 hover:border-green-300",
      icon: "text-green-600",
      bg: "bg-green-50",
      text: "text-green-800",
    },
    yellow: {
      border: "border-yellow-200 hover:border-yellow-300",
      icon: "text-yellow-600",
      bg: "bg-yellow-50",
      text: "text-yellow-800",
    },
    red: {
      border: "border-red-200 hover:border-red-300",
      icon: "text-red-600",
      bg: "bg-red-50",
      text: "text-red-800",
    },
    gray: {
      border: "border-gray-200 hover:border-gray-300",
      icon: "text-gray-600",
      bg: "bg-gray-50",
      text: "text-gray-800",
    },
  };

  // Helper function to get colors for a feature
  const getFeatureColors = (featureColor?: string) => {
    return (
      colorVariants[featureColor as keyof typeof colorVariants] ||
      colorVariants.purple
    );
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "Critical":
        return "bg-red-100 text-red-700";
      case "High":
        return "bg-yellow-100 text-yellow-700";
      case "Medium":
        return "bg-blue-100 text-blue-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (block.variant === "detailed") {
    return (
      <div className="space-y-4">
        {block.title && (
          <h2 className="text-2xl font-semibold text-gray-900">
            {block.title}
          </h2>
        )}
        {block.description && (
          <p className="text-gray-600">{block.description}</p>
        )}

        <div className={`grid ${gridCols[block.columns || "2"]} gap-4`}>
          {block.features.map((feature, index) => {
            const featureColors = getFeatureColors(feature.color);
            return (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-colors ${featureColors.border}`}
              >
                <div className="flex items-start space-x-3">
                  {feature.icon &&
                    renderIcon(
                      feature.icon,
                      `h-5 w-5 mt-0.5 flex-shrink-0 ${featureColors.icon}`
                    )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {feature.title}
                      </h3>
                      {feature.importance && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getImportanceColor(feature.importance)}`}
                        >
                          {feature.importance}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {feature.description}
                    </p>
                    {feature.tips && feature.tips.length > 0 && (
                      <ul className="space-y-1">
                        {feature.tips.map((tip, tipIndex) => (
                          <li
                            key={tipIndex}
                            className="flex items-start space-x-2 text-xs text-gray-600"
                          >
                            <CheckCircle
                              className={`h-3 w-3 mt-0.5 flex-shrink-0 ${featureColors.icon}`}
                            />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Simple variant (default)
  return (
    <div className="space-y-4">
      {block.title && (
        <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      )}
      {block.description && (
        <p className="text-gray-600">{block.description}</p>
      )}

      <div className={`grid ${gridCols[block.columns || "2"]} gap-4`}>
        {block.features.map((feature, index) => {
          const featureColors = getFeatureColors(feature.color);
          return (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-colors ${featureColors.border}`}
            >
              <div className="flex items-start space-x-3">
                {feature.icon &&
                  renderIcon(
                    feature.icon,
                    `h-5 w-5 mt-0.5 flex-shrink-0 ${featureColors.icon}`
                  )}
                <div>
                  <h3 className="font-medium text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
