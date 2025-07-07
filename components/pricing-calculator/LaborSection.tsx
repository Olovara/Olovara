import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export interface LaborCostItem {
  description: string;
  hourlyWage: string;
  time: string;
  total: number;
}

interface LaborSectionProps {
  labor: LaborCostItem[];
  setLabor: (labor: LaborCostItem[]) => void;
  onTotalChange?: (total: number) => void;
}

type EditableLaborField = Extract<keyof LaborCostItem, "description" | "hourlyWage" | "time">;

export default function LaborSection({ labor, setLabor, onTotalChange }: LaborSectionProps) {
  const [miscCost, setMiscCost] = useState<string>(""); // State for Miscellaneous Cost

  const updateLabor = (
    index: number,
    field: EditableLaborField,
    value: string
  ) => {
    const updatedLabor = [...labor];
    updatedLabor[index][field] = value;
  
    const hourlyWage = parseFloat(updatedLabor[index].hourlyWage || "0");
    const time = parseFloat(updatedLabor[index].time || "0");
    updatedLabor[index].total = hourlyWage * time;
  
    setLabor(updatedLabor);
  };

  // Calculate total labor cost including miscellaneous costs
  const totalLaborCost =
    labor.reduce((sum, labor) => sum + labor.total, 0) +
    parseFloat(miscCost || "0");

  // Report total back to parent component
  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(totalLaborCost);
    }
  }, [totalLaborCost, onTotalChange]);

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Labor Costs</h2>
      
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Hourly Wage</TableHead>
              <TableHead>Time (hours)</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labor.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateLabor(index, "description", e.target.value)
                    }
                    placeholder="Description"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.hourlyWage}
                    onChange={(e) =>
                      updateLabor(index, "hourlyWage", e.target.value)
                    }
                    placeholder="Hourly Wage"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.time}
                    onChange={(e) => updateLabor(index, "time", e.target.value)}
                    placeholder="Time"
                  />
                </TableCell>
                <TableCell>${item.total.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => setLabor(labor.filter((_, i) => i !== index))}
                    variant="ghost"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-4">
        {labor.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Activity {index + 1}</h4>
              <Button
                onClick={() => setLabor(labor.filter((_, i) => i !== index))}
                variant="ghost"
                size="sm"
              >
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateLabor(index, "description", e.target.value)
                  }
                  placeholder="Description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Hourly Wage</label>
                  <Input
                    type="number"
                    value={item.hourlyWage}
                    onChange={(e) =>
                      updateLabor(index, "hourlyWage", e.target.value)
                    }
                    placeholder="Hourly Wage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time (hours)</label>
                  <Input
                    type="number"
                    value={item.time}
                    onChange={(e) => updateLabor(index, "time", e.target.value)}
                    placeholder="Time"
                  />
                </div>
              </div>
              
              <div className="text-right">
                <span className="font-semibold text-lg">
                  Total: ${item.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Activity Button */}
      <div className="mt-4">
        <Button
          onClick={() =>
            setLabor([
              ...labor,
              { description: "", hourlyWage: "", time: "", total: 0 },
            ])
          }
        >
          <Plus size={16} /> Add Activity
        </Button>
      </div>

      {/* Miscellaneous Costs Input */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="font-semibold">Miscellaneous Costs:</span>
        <Input
          type="number"
          value={miscCost}
          onChange={(e) => setMiscCost(e.target.value)}
          placeholder="Misc."
          className="w-full sm:w-32"
        />
      </div>

      {/* Total Labor Cost */}
      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-2 gap-2">
        <span className="font-semibold">Total Labor Cost:</span>
        <span className="font-semibold text-lg">
          ${totalLaborCost.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
