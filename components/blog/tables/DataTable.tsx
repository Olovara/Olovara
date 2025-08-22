import { TableBlock } from "../types/BlockTypes";
import { cn } from "@/lib/utils";

interface DataTableProps {
  block: TableBlock;
  className?: string;
}

export function DataTable({ block, className }: DataTableProps) {
  const variantStyles = {
    simple: "border-collapse",
    striped: "border-collapse",
    bordered: "border-collapse border border-gray-300",
  };

  const tableStyles = variantStyles[block.variant || "simple"];

  return (
    <div className={cn("space-y-4", className)}>
      {block.title && (
        <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
      )}

      <div className="overflow-x-auto">
        <table className={cn("w-full", tableStyles)}>
          <thead>
            <tr className="bg-gray-50">
              {block.headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-medium text-gray-900",
                    block.variant === "bordered" && "border border-gray-300",
                    block.variant === "striped" && "border-b border-gray-200"
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  block.variant === "striped" &&
                    rowIndex % 2 === 1 &&
                    "bg-gray-50",
                  block.variant === "bordered" && "border-b border-gray-300"
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-4 py-3 text-sm text-gray-600",
                      block.variant === "bordered" && "border border-gray-300"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {block.caption && (
        <p className="text-sm text-gray-500 italic text-center">
          {block.caption}
        </p>
      )}
    </div>
  );
}
