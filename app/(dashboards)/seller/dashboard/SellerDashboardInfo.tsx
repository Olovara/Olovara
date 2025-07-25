"use client";

import React, { useEffect, useState } from "react";
import { format, subDays, startOfQuarter, startOfYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button"; // Shadcn Button
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Popover
import { Calendar } from "@/components/ui/calendar"; // Calendar
import { cn } from "@/lib/utils"; // For className utilities
import { useSession } from "next-auth/react";

interface SellerData {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  activeProducts: number;
  hiddenProducts: number;
  disabledProducts: number;
  soldOutProducts: number;
  mostPopularProduct: string;
  averageOrderValue: number;
}

const SellerDashboardInfo = () => {
  const { data: session } = useSession();
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Function to set date range based on days
  const setDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(start);
    setEndDate(end);
  };

  // Function to set date range for this quarter
  const setThisQuarter = () => {
    const end = new Date();
    const start = startOfQuarter(end);
    setStartDate(start);
    setEndDate(end);
  };

  // Function to set date range for year to date
  const setYearToDate = () => {
    const end = new Date();
    const start = startOfYear(end);
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // Check if we have a session
        if (!session?.user?.id) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        const query = new URLSearchParams();
        if (startDate) query.append("startDate", startDate.toISOString());
        if (endDate) query.append("endDate", endDate.toISOString());
        
        // Add the sellerId parameter using session
        query.append("sellerId", session.user.id);

        const dashboardResponse = await fetch(`/api/seller/dashboard?${query.toString()}`);
        if (!dashboardResponse.ok) {
          throw new Error("Failed to fetch data");
        }
        const data: SellerData = await dashboardResponse.json();
        setSellerData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [startDate, endDate, session?.user?.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setDateRange(1)}>
            Past 24 Hours
          </Button>
          <Button variant="outline" onClick={() => setDateRange(7)}>
            Past 7 Days
          </Button>
          <Button variant="outline" onClick={() => setDateRange(30)}>
            Past 30 Days
          </Button>
          <Button variant="outline" onClick={setThisQuarter}>
            This Quarter
          </Button>
          <Button variant="outline" onClick={setYearToDate}>
            Year to Date
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Start Date */}
          <div>
            <label className="text-sm font-medium mb-1 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
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
          <div>
            <label className="text-sm font-medium mb-1 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
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
        </div>
      </div>

      {/* Display Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sellerData ? (
          <>
            <DashboardCard title="Total Orders" value={sellerData.totalOrders} />
            <DashboardCard title="Total Sales" value={sellerData.totalSales} />
            <DashboardCard title="Average Order Value" value={sellerData.averageOrderValue} />
            <DashboardCard title="Total Products" value={sellerData.totalProducts} sellerData={sellerData} />
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
  );
};

function DashboardCard({
  title,
  value,
  sellerData,
}: {
  title: string;
  value: string | number;
  sellerData?: SellerData;
}) {
  // Convert cents to dollars if the title is "Total Sales" or "Average Order Value"
  const displayValue = title === "Total Sales" || title === "Average Order Value"
    ? `$${(Number(value) / 100).toFixed(2)}`
    : value;

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <div className="font-semibold text-lg">{title}</div>
      <div className="text-2xl font-bold">{displayValue}</div>
      {title === "Total Products" && sellerData && (
        <div className="text-sm text-muted-foreground mt-2 space-y-1">
          <div>Active: {sellerData.activeProducts}</div>
          <div>Hidden: {sellerData.hiddenProducts}</div>
          <div>Disabled: {sellerData.disabledProducts}</div>
          <div>Sold Out: {sellerData.soldOutProducts}</div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboardInfo;
