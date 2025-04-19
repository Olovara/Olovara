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

interface Material {
  name: string;
  cost: string;
  size: string;
  quantity: string;
  total: number;
}

interface Props {
  materials: Material[];
  setMaterials: (materials: Material[]) => void;
}

export default function MaterialsSection({ materials, setMaterials }: Props) {
  const [miscCost, setMiscCost] = useState<string>(""); // State for Miscellaneous Cost

  // Function to update material values
  const updateMaterial = (
    index: number,
    field: keyof Material,
    value: string
  ) => {
    const updatedMaterials = [...materials];
    (updatedMaterials[index] as any)[field] = value;

    const cost = parseFloat(updatedMaterials[index].cost || "0");
    const size = parseFloat(updatedMaterials[index].size || "1");
    const quantity = parseFloat(updatedMaterials[index].quantity || "0");
    updatedMaterials[index].total = (cost / size) * quantity || 0;

    setMaterials(updatedMaterials);
  };

  // Calculate total materials cost including miscellaneous costs
  const totalMaterialsCost =
    materials.reduce((sum, material) => sum + material.total, 0) +
    parseFloat(miscCost || "0");

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Materials Cost</h2>

      {/* Table Structure using shadcn */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Item Cost</TableHead>
              <TableHead>Item Size</TableHead>
              <TableHead>Quantity Used</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={material.name}
                    onChange={(e) =>
                      updateMaterial(index, "name", e.target.value)
                    }
                    placeholder="Material Name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={material.cost}
                    onChange={(e) =>
                      updateMaterial(index, "cost", e.target.value)
                    }
                    placeholder="Cost"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={material.size}
                    onChange={(e) =>
                      updateMaterial(index, "size", e.target.value)
                    }
                    placeholder="Size"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={material.quantity}
                    onChange={(e) =>
                      updateMaterial(index, "quantity", e.target.value)
                    }
                    placeholder="Quantity"
                  />
                </TableCell>
                <TableCell className="text-center">
                  ${material.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() =>
                      setMaterials(materials.filter((_, i) => i !== index))
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

      {/* Add Material Button */}
      <div className="mt-4">
        <Button
          onClick={() =>
            setMaterials([
              ...materials,
              { name: "", cost: "", size: "", quantity: "", total: 0 },
            ])
          }
        >
          <Plus size={16} /> Add Material
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

      {/* Total Materials Cost */}
      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="font-semibold">Total Materials Cost:</span>
        <span className="font-semibold text-lg">
          ${totalMaterialsCost.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
