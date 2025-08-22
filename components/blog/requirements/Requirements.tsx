import React from "react";
import * as LucideIcons from "lucide-react";
import { RequirementsBlock } from "../types/BlockTypes";

interface RequirementsProps {
  block: RequirementsBlock;
}

export function Requirements({ block }: RequirementsProps) {
  // Function to render an icon by name
  const renderIcon = (iconName: string, className: string = "h-5 w-5") => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return null;
  };

  const gridCols = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 md:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  };

  if (block.variant === "list") {
    return (
      <div className="space-y-4">
        {block.title && (
          <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
        )}
        {block.description && (
          <p className="text-gray-600">{block.description}</p>
        )}
        
        <ul className="space-y-3">
          {block.requirements.map((req, index) => (
            <li key={index} className="flex items-start space-x-3">
              {renderIcon(req.icon, "h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0")}
              <div>
                <h3 className="font-medium text-gray-900">{req.title}</h3>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {block.title && (
        <h2 className="text-2xl font-semibold text-gray-900">{block.title}</h2>
      )}
      {block.description && (
        <p className="text-gray-600">{block.description}</p>
      )}
      
      <div className={`grid ${gridCols[block.columns]} gap-4`}>
        {block.requirements.map((req, index) => (
          <div 
            key={index} 
            className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors duration-200"
          >
            {renderIcon(req.icon, "h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0")}
            <div>
              <h3 className="font-medium text-gray-900">{req.title}</h3>
              <p className="text-sm text-gray-600">{req.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
