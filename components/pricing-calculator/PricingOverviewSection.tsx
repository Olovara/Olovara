import { Card } from "@/components/ui/card";

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
      <div className="grid grid-cols-3 gap-4 mt-4">
        {/* Markup Field */}
        <div>
          <label className="block text-sm font-medium">Markup %</label>
          <input
            type="number"
            value={markup}
            onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Discount Field */}
        <div>
          <label className="block text-sm font-medium">Discount %</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Sales Tax Field */}
        <div>
          <label className="block text-sm font-medium">Sales Tax %</label>
          <input
            type="number"
            value={salesTax}
            onChange={(e) => setSalesTax(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>
    </Card>
  );
}
