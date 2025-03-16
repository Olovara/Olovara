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
}: PricingBreakdownProps) {
    const profit = sellingPrice - (totalCost + transactionFees) || 0;
  // Chart data
  const chartData = {
    labels: [
      "Materials",
      "Packaging",
      "Labor",
      "Other Costs",
      "Booth Fees",
      "Transaction Fees",
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
          profit,
        ],
        backgroundColor: [
          "#FF6384", // Materials
          "#36A2EB", // Packaging
          "#FFCE56", // Labor
          "#4CAF50", // Other Costs
          "#FF9800", // Booth Fees
          "#9C27B0", // Transaction Fees
          "#4A90E2", // Profit
        ],
      },
    ],
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold">Cost Breakdown</h2>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <p>Materials: ${totalMaterialCost.toFixed(2)}</p>
          <p>Packaging: ${totalPackagingCost.toFixed(2)}</p>
          <p>Labor: ${totalLaborCost.toFixed(2)}</p>
          <p>Other Costs: ${totalOtherCosts.toFixed(2)}</p>
          <p>Booth Fees: ${totalBoothFees.toFixed(2)}</p>
          <p>Transaction Fees: ${transactionFees.toFixed(2)}</p>
          <h3 className="text-xl font-bold mt-4">
            Total Cost: ${totalCost.toFixed(2)}
          </h3>
          <h3 className="text-xl font-bold text-blue-600">
            Selling Price: ${sellingPrice.toFixed(2)}
          </h3>
          <h3 className="text-xl font-bold text-green-600">
            Profit: ${profit.toFixed(2)}
          </h3>
        </div>
        <div>
          <Doughnut data={chartData} />
        </div>
      </div>
    </Card>
  );
}
