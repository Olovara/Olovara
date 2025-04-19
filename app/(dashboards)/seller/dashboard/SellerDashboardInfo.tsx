"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button"; // Shadcn Button
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Popover
import { Calendar } from "@/components/ui/calendar"; // Calendar
import { cn } from "@/lib/utils"; // For className utilities

interface SellerData {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  mostPopularProduct: string;
}

const SellerDashboardInfo = () => {
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const query = new URLSearchParams();
        query.append("sellerId", "some-seller-id"); // Replace with actual sellerId
        if (startDate) query.append("startDate", startDate.toISOString());
        if (endDate) query.append("endDate", endDate.toISOString());

        const response = await fetch(`/api/seller/dashboard?${query.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data: SellerData = await response.json();
        setSellerData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [startDate, endDate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div>
        {/* Start Date */}
        <div className="mb-4">
          <label>Start Date:</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[280px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="mb-4">
          <label>End Date:</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[280px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Display Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          {sellerData ? (
            <>
              <DashboardCard title="Total Sales" value={sellerData.totalSales} />
              <DashboardCard title="Total Revenue" value={`$${sellerData.totalRevenue.toFixed(2)}`} />
              <DashboardCard title="Total Products" value={sellerData.totalProducts} />
              <DashboardCard title="Most Popular Product" value={sellerData.mostPopularProduct} />
            </>
          ) : (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading seller data...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <div className="font-semibold text-lg">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default SellerDashboardInfo;
