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
import { useState } from "react";

interface LaborCostItem {
  description: string;
  hourlyWage: string;
  time: string;
  total: number;
}

interface LaborSectionProps {
  labor: LaborCostItem[];
  setLabor: (labor: LaborCostItem[]) => void;
}

export default function LaborSection({ labor, setLabor }: LaborSectionProps) {
    const [miscCost, setMiscCost] = useState<string>(""); // State for Miscellaneous Cost

  const updateLabor = (
    index: number,
    field: keyof LaborCostItem,
    value: string
  ) => {
    const updatedLabor = [...labor];
    updatedLabor[index][field] = value;

    // Convert hourly wage and time to numbers for calculation
    const hourlyWage = parseFloat(updatedLabor[index].hourlyWage || "0");
    const time = parseFloat(updatedLabor[index].time || "1");

    // Calculate total cost
    updatedLabor[index].total = hourlyWage * time;

    setLabor(updatedLabor);
  };

  // Calculate total labor cost including miscellaneous costs
  const totalLaborCost =
    labor.reduce((sum, labor) => sum + labor.total, 0) +
    parseFloat(miscCost || "0");

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Labor Costs</h2>
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
      <div className="mt-4 flex items-center justify-between">
        <span className="font-semibold">Miscellaneous Costs:</span>
        <Input
          type="number"
          value={miscCost}
          onChange={(e) => setMiscCost(e.target.value)}
          placeholder="Misc."
          className="w-32"
        />
      </div>

      {/* Total Labor Cost */}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="font-semibold">Total Labor Cost:</span>
        <span className="font-semibold text-lg">
          ${totalLaborCost.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
