import { Card } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";

interface PricingBreakdownProps {
  totalMaterialCost: number;
  totalPackagingCost: number;
  totalLaborCost: number;
  totalOtherCosts: number;
  totalBoothFees: number;
  totalCost: number;
  sellingPrice: number;
  transactionFees: number;
  websiteFees?: number;
  profit: number;
}

export default function PricingBreakdownSection({
  totalMaterialCost,
  totalPackagingCost,
  totalLaborCost,
  totalOtherCosts,
  totalBoothFees,
  totalCost,
  sellingPrice,
  transactionFees,
  websiteFees = 0,
  profit,
}: PricingBreakdownProps) {
  const resolveRgbVar = (cssVarName: string, fallbackRgb: string) => {
    // Canvas can't resolve CSS variables like `rgb(var(--x))` reliably.
    // Our tokens store space-separated RGB: "R G B".
    if (typeof window === "undefined") return `rgb(${fallbackRgb})`;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVarName)
      .trim();
    return raw ? `rgb(${raw})` : `rgb(${fallbackRgb})`;
  };

  // Chart data with brand palette
  const bg = [
    resolveRgbVar("--brand-primary-700", "124 58 237"),
    resolveRgbVar("--brand-primary-600", "139 92 246"),
    resolveRgbVar("--brand-primary-500", "168 139 250"),
    resolveRgbVar("--brand-primary-300", "216 180 254"),
    resolveRgbVar("--brand-primary-200", "233 213 255"),
    resolveRgbVar("--brand-light-neutral-300", "209 213 219"),
    resolveRgbVar("--brand-primary-100", "243 232 255"),
    resolveRgbVar("--brand-primary-800", "109 40 217"),
  ];

  const stroke = [
    resolveRgbVar("--brand-primary-800", "109 40 217"),
    resolveRgbVar("--brand-primary-700", "124 58 237"),
    resolveRgbVar("--brand-primary-600", "139 92 246"),
    resolveRgbVar("--brand-primary-500", "168 139 250"),
    resolveRgbVar("--brand-primary-300", "216 180 254"),
    resolveRgbVar("--brand-light-neutral-400", "156 163 175"),
    resolveRgbVar("--brand-primary-200", "233 213 255"),
    resolveRgbVar("--brand-primary-900", "91 33 182"),
  ];

  const legendColor = resolveRgbVar("--brand-dark-neutral-700", "55 65 81");
  const tooltipBg = resolveRgbVar("--brand-dark-neutral-900", "17 24 39");

  const chartData = {
    labels: [
      "Materials",
      "Packaging",
      "Labor",
      "Other Costs",
      "Booth Fees",
      "Transaction Fees",
      "Website Fees",
      "Profit",
    ],
    datasets: [
      {
        data: [
          totalMaterialCost,
          totalPackagingCost,
          totalLaborCost,
          totalOtherCosts,
          totalBoothFees,
          transactionFees,
          websiteFees,
          profit,
        ],
        backgroundColor: [
          ...bg,
        ],
        borderColor: [
          ...stroke,
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: legendColor,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
      },
    },
  } as const;

  return (
    <Card className="p-4 bg-brand-light-neutral-50">
      <h2 className="text-lg font-semibold mb-4 text-brand-dark-neutral-900">Cost Breakdown</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-2">
          <p className="flex justify-between text-brand-dark-neutral-700">
            <span className="font-medium">Materials:</span>
            <span className="font-medium">${totalMaterialCost.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-brand-dark-neutral-700">
            <span className="font-medium">Packaging:</span>
            <span className="font-medium">
              ${totalPackagingCost.toFixed(2)}
            </span>
          </p>
          <p className="flex justify-between text-brand-dark-neutral-700">
            <span className="font-medium">Labor:</span>
            <span className="font-medium">${totalLaborCost.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-brand-dark-neutral-700">
            <span className="font-medium">Other Costs:</span>
            <span className="font-medium">${totalOtherCosts.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-brand-dark-neutral-700">
            <span className="font-medium">Booth Fees:</span>
            <span className="font-medium">${totalBoothFees.toFixed(2)}</span>
          </p>
          <p className="flex justify-between text-brand-dark-neutral-700">
            <span className="font-medium">Transaction Fees:</span>
            <span className="font-medium">${transactionFees.toFixed(2)}</span>
          </p>
          {websiteFees > 0 && (
            <p className="flex justify-between text-brand-dark-neutral-700">
              <span className="font-medium">Website Fees:</span>
              <span className="font-medium">${websiteFees.toFixed(2)}</span>
            </p>
          )}
          <div className="border-t border-brand-light-neutral-200 pt-2 mt-4">
            <p className="flex justify-between text-lg font-bold text-brand-dark-neutral-900">
              <span>Total Cost:</span>
              <span>${totalCost.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-lg font-bold text-brand-secondary-700">
              <span>Selling Price:</span>
              <span>${sellingPrice.toFixed(2)}</span>
            </p>
            <p className="flex justify-between text-lg font-bold text-brand-primary-700">
              <span>Profit:</span>
              <span>${profit.toFixed(2)}</span>
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </Card>
  );
}
