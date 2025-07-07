"use client";

import { useState } from "react";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import MaterialsSection from "@/components/pricing-calculator/MaterialsSection";
import LaborSection from "@/components/pricing-calculator/LaborSection";
import { LaborCostItem } from "@/components/pricing-calculator/LaborSection";
import PackagingSection from "@/components/pricing-calculator/PackagingSection";
import CraftShowCostsSection from "@/components/pricing-calculator/CraftShowCostsSection";
import WebsiteCostsSection from "@/components/pricing-calculator/WebsiteCostsSection";
import PricingOverviewSection from "@/components/pricing-calculator/PricingOverviewSection";
import PricingBreakdownSection from "@/components/pricing-calculator/PricingBreakdownSection";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

Chart.register(ArcElement, Tooltip, Legend);

export default function PricingCalculator() {
  const [materials, setMaterials] = useState([
    { name: "", cost: "", size: "", quantity: "", total: 0 },
  ]);
  const [packaging, setPackaging] = useState([
    { description: "", cost: "", size: "", quantity: "", total: 0 },
  ]);
  const [labor, setLabor] = useState<LaborCostItem[]>([
    { description: "", hourlyWage: "", time: "", total: 0 },
  ]);
  const [otherCosts, setOtherCosts] = useState([
    { description: "", total: "" },
  ]);

  // State to track total costs from each section (including misc costs)
  const [totalMaterialCost, setTotalMaterialCost] = useState(0);
  const [totalPackagingCost, setTotalPackagingCost] = useState(0);
  const [totalLaborCost, setTotalLaborCost] = useState(0);

  const [discount, setDiscount] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [salesTax, setSalesTax] = useState(0);
  
  // Transaction fees (shared between website and craft show)
  const [transactionFeePercent, setTransactionFeePercent] = useState(2.9);
  const [transactionFeeDollar, setTransactionFeeDollar] = useState(0.25);
  
  // Craft show specific fees
  const [boothFee, setBoothFee] = useState(0);
  const [averageItemsSold, setAverageItemsSold] = useState(1);
  
  // Website specific fees
  const [websiteFeePercent, setWebsiteFeePercent] = useState(10);
  const [websiteFeeDollar, setWebsiteFeeDollar] = useState(0);
  
  // Toggle between website and craft show costs
  const [isWebsiteMode, setIsWebsiteMode] = useState(false);

  // Calculate other costs
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
    (isWebsiteMode ? 0 : totalBoothFees);

  // Initial selling price before fees
  let sellingPrice =
    totalCost *
    (1 + markup / 100) *
    (1 - discount / 100) *
    (1 + salesTax / 100);

  // Calculate transaction fees based on this initial selling price
  const transactionFees =
    (sellingPrice * transactionFeePercent) / 100 + transactionFeeDollar;

  // Calculate website fees if in website mode
  const websiteFees = isWebsiteMode
    ? (sellingPrice * websiteFeePercent) / 100 + websiteFeeDollar
    : 0;

  // Final selling price, including all fees
  sellingPrice += transactionFees + websiteFees;

  // Calculate profit
  const profit = sellingPrice - (totalCost + transactionFees + websiteFees);

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
      <h1 className="text-2xl font-bold">Pricing Calculator</h1>
      <h1>
        A powerful tool to help take the guesswork out of pricing so you can
        spend more time making
      </h1>

      <MaterialsSection 
        materials={materials} 
        setMaterials={setMaterials} 
        onTotalChange={setTotalMaterialCost}
      />

      <LaborSection 
        labor={labor} 
        setLabor={setLabor} 
        onTotalChange={setTotalLaborCost}
      />

      <PackagingSection 
        packaging={packaging} 
        setPackaging={setPackaging} 
        onTotalChange={setTotalPackagingCost}
      />

      {/* Toggle between Website and Craft Show Costs */}
      <div className="flex items-center space-x-2 p-4 border rounded-lg">
        <Switch
          id="cost-mode"
          checked={isWebsiteMode}
          onCheckedChange={setIsWebsiteMode}
        />
        <Label htmlFor="cost-mode" className="text-lg font-semibold">
          {isWebsiteMode ? "Website Mode" : "Craft Show Mode"}
        </Label>
      </div>

      {isWebsiteMode ? (
        <WebsiteCostsSection
          transactionFeePercent={transactionFeePercent}
          setTransactionFeePercent={setTransactionFeePercent}
          transactionFeeDollar={transactionFeeDollar}
          setTransactionFeeDollar={setTransactionFeeDollar}
          websiteFeePercent={websiteFeePercent}
          setWebsiteFeePercent={setWebsiteFeePercent}
          websiteFeeDollar={websiteFeeDollar}
          setWebsiteFeeDollar={setWebsiteFeeDollar}
          transactionFees={transactionFees}
          websiteFees={websiteFees}
        />
      ) : (
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
      )}

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
        totalBoothFees={isWebsiteMode ? 0 : totalBoothFees}
        transactionFees={transactionFees}
        websiteFees={websiteFees}
        totalCost={totalCost}
        sellingPrice={sellingPrice}
        profit={profit}
      />
    </div>
  );
}
