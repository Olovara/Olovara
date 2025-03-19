"use client";

import { useState } from "react";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import MaterialsSection from "@/components/pricing-calculator/MaterialsSection";
import LaborSection from "@/components/pricing-calculator/LaborSection";
import PackagingSection from "@/components/pricing-calculator/PackagingSection";
import CraftShowCostsSection from "@/components/pricing-calculator/CraftShowCostsSection";
import PricingOverviewSection from "@/components/pricing-calculator/PricingOverviewSection";
import PricingBreakdownSection from "@/components/pricing-calculator/PricingBreakdownSection";

Chart.register(ArcElement, Tooltip, Legend);

export default function PricingCalculator() {
  const [materials, setMaterials] = useState([
    { name: "", cost: "", size: "", quantity: "", total: 0 },
  ]);
  const [packaging, setPackaging] = useState([
    { description: "", cost: "", size: "", quantity: "", total: 0 },
  ]);
  const [labor, setLabor] = useState([
    { description: "", hourlyWage: "", time: "", total: 0 },
  ]);
  const [otherCosts, setOtherCosts] = useState([
    { description: "", total: "" },
  ]);

  const [discount, setDiscount] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [salesTax, setSalesTax] = useState(0);
  const [transactionFeePercent, setTransactionFeePercent] = useState(2.9);
  const [transactionFeeDollar, setTransactionFeeDollar] = useState(0.25);
  const [boothFee, setBoothFee] = useState(0);
  const [averageItemsSold, setAverageItemsSold] = useState(1);

  // Calculate total costs
  const totalMaterialCost = materials.reduce(
    (acc, item) => acc + (item.total || 0),
    0
  );
  const totalPackagingCost = packaging.reduce(
    (acc, item) => acc + (item.total || 0),
    0
  );
  const totalLaborCost = labor.reduce(
    (acc, item) => acc + (item.total || 0),
    0
  );
  const totalOtherCosts = otherCosts.reduce(
    (acc, item) => acc + parseFloat(item.total || "0"),
    0
  );

  // Calculate booth cost per item
  const boothCostPerItem = boothFee / (averageItemsSold || 1);
  const totalBoothFees = boothCostPerItem;

  // Calculate total cost before markup
  const totalCost =
    totalMaterialCost +
    totalPackagingCost +
    totalLaborCost +
    totalOtherCosts +
    totalBoothFees;

  // Initial selling price before transaction fees (excludes transaction fees)
  let sellingPrice =
    totalCost *
    (1 + markup / 100) *
    (1 - discount / 100) *
    (1 + salesTax / 100);

  // Calculate transaction fees based on this initial selling price
  const transactionFees =
    (sellingPrice * transactionFeePercent) / 100 + transactionFeeDollar;

  // Final selling price, including transaction fees
  sellingPrice += transactionFees;

  // Calculate profit
  const profit = sellingPrice - (totalCost + transactionFees);

  // Function to update costs dynamically
  const updateField = (
    setState: Function,
    stateArray: any[],
    index: number,
    field: string,
    value: string
  ) => {
    const updatedState = [...stateArray];
    updatedState[index][field] = value;

    if (setState === setLabor) {
      const hourlyWage = parseFloat(updatedState[index].hourlyWage || "0");
      const time = parseFloat(updatedState[index].time || "0");
      updatedState[index].total = hourlyWage * time || 0;
    } else {
      const cost = parseFloat(updatedState[index].cost || "0");
      const size = parseFloat(updatedState[index].size || "1");
      const quantity = parseFloat(updatedState[index].quantity || "0");
      updatedState[index].total = (cost / size) * quantity || 0;
    }

    setState(updatedState);
  };

  return (
    <div className="p-4 space-y-6">
      <h1>
        A powerful tool to help take the guesswork out of pricing so you can
        spend more time making
      </h1>

      <MaterialsSection materials={materials} setMaterials={setMaterials} />

      <LaborSection labor={labor} setLabor={setLabor} />

      <PackagingSection packaging={packaging} setPackaging={setPackaging} />

      <CraftShowCostsSection
        transactionFeePercent={transactionFeePercent}
        setTransactionFeePercent={setTransactionFeePercent}
        transactionFeeDollar={transactionFeeDollar}
        setTransactionFeeDollar={setTransactionFeeDollar}
        boothFee={boothFee}
        setBoothFee={setBoothFee}
        averageItemsSold={averageItemsSold}
        setAverageItemsSold={setAverageItemsSold}
        transactionFees={transactionFees}
        totalBoothFees={totalBoothFees}
        updateField={updateField}
      />

      <PricingOverviewSection
        markup={markup}
        setMarkup={setMarkup}
        discount={discount}
        setDiscount={setDiscount}
        salesTax={salesTax}
        setSalesTax={setSalesTax}
      />

      <PricingBreakdownSection
        totalMaterialCost={totalMaterialCost}
        totalPackagingCost={totalPackagingCost}
        totalLaborCost={totalLaborCost}
        totalOtherCosts={totalOtherCosts}
        totalBoothFees={totalBoothFees}
        transactionFees={transactionFees}
        totalCost={totalCost}
        sellingPrice={sellingPrice}
        profit={profit}
      />
    </div>
  );
}
