import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

interface Packaging {
  description: string;
  cost: string;
  size: string;
  quantity: string;
  total: number;
}

interface Props {
  packaging: any[];
  setPackaging: (value: any[]) => void;
}

export default function PackagingSection({ packaging, setPackaging }: Props) {
  const [miscCost, setMiscCost] = useState<string>(""); // State for Miscellaneous Cost

  // Function to update material values
  const updatePackaging = (
    index: number,
    field: keyof Packaging,
    value: string
  ) => {
    const updatedPackaging = [...packaging];
    updatedPackaging[index][field] = value;

    const cost = parseFloat(updatedPackaging[index].cost || "0");
    const size = parseFloat(updatedPackaging[index].size || "1");
    const quantity = parseFloat(updatedPackaging[index].quantity || "0");
    updatedPackaging[index].total = (cost / size) * quantity || 0;

    setPackaging(updatedPackaging);
  };

  // Calculate total packaging cost including miscellaneous costs
  const totalPackagingCost =
    packaging.reduce((sum, packaging) => sum + packaging.total, 0) +
    parseFloat(miscCost || "0");

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Packaging Cost</h2>

      {/* Table Structure using shadcn */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Item Cost</TableHead>
              <TableHead>Item Size</TableHead>
              <TableHead>Quantity Used</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packaging.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updatePackaging(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Description"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.cost}
                    onChange={(e) =>
                      updatePackaging(
                        index,
                        "cost",
                        e.target.value
                      )
                    }
                    placeholder="Cost"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.size}
                    onChange={(e) =>
                      updatePackaging(
                        index,
                        "size",
                        e.target.value
                      )
                    }
                    placeholder="Size"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updatePackaging(
                        index,
                        "quantity",
                        e.target.value
                      )
                    }
                    placeholder="Quantity"
                  />
                </TableCell>
                <TableCell>{item.total.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() =>
                      setPackaging(packaging.filter((_, i) => i !== index))
                    }
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

      {/* Add Packaging Button */}
      <div className="mt-4">
        <Button
          onClick={() =>
            setPackaging([
              ...packaging,
              { description: "", cost: "", size: "", quantity: "", total: 0 },
            ])
          }
        >
          <Plus size={16} /> Add Packaging
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

      {/* Total Packaging Cost */}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="font-semibold">Total Packaging Cost:</span>
        <span className="font-semibold text-lg">
          ${totalPackagingCost.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
