import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingOverviewProps {
  markup: number;
  setMarkup: (value: number) => void;
  discount: number;
  setDiscount: (value: number) => void;
  salesTax: number;
  setSalesTax: (value: number) => void;
}

export default function PricingOverviewSection({
  markup,
  setMarkup,
  discount,
  setDiscount,
  salesTax,
  setSalesTax,
}: PricingOverviewProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">Pricing Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {/* Markup Field */}
        <div>
          <Label className="block text-sm font-medium mb-2">Markup %</Label>
          <Input
            type="number"
            value={markup}
            onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        {/* Discount Field */}
        <div>
          <Label className="block text-sm font-medium mb-2">Discount %</Label>
          <Input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        {/* Sales Tax Field */}
        <div>
          <Label className="block text-sm font-medium mb-2">Sales Tax %</Label>
          <Input
            type="number"
            value={salesTax}
            onChange={(e) => setSalesTax(parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>
    </Card>
  );
}
