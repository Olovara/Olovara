"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button"; // Shadcn Button
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Popover
import { Calendar } from "@/components/ui/calendar"; // Calendar
import { cn, formatPriceInCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  SellerDashboardRevenueChart,
  type RevenueSeriesPoint,
} from "./SellerDashboardRevenueChart";

interface SellerData {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  activeProducts: number;
  hiddenProducts: number;
  disabledProducts: number;
  soldOutProducts: number;
  draftProducts: number;
  mostPopularProduct: string;
  averageOrderValue: number;
  revenueSeries: RevenueSeriesPoint[];
  /** Seller preference — same source as ProductForm default currency */
  preferredCurrency?: string | null;
}

type SellerDashboardInfoProps = {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
};

const SellerDashboardInfo = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: SellerDashboardInfoProps) => {
  const { data: session } = useSession();
  const [sellerData, setSellerData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = (await dashboardResponse.json()) as SellerData;
        // API may omit this on older clients; normalize for the chart
        setSellerData({
          ...data,
          revenueSeries: Array.isArray(data.revenueSeries)
            ? data.revenueSeries
            : [],
          preferredCurrency:
            typeof data.preferredCurrency === "string"
              ? data.preferredCurrency
              : undefined,
        });
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
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Start date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full min-w-[200px] justify-start text-left font-normal sm:w-[200px]",
                  "border-brand-dark-neutral-200",
                  "hover:border-brand-primary-300 hover:bg-brand-primary-100 hover:text-brand-primary-900",
                  "focus-visible:ring-brand-primary-500",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">End date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full min-w-[200px] justify-start text-left font-normal sm:w-[200px]",
                  "border-brand-dark-neutral-200",
                  "hover:border-brand-primary-300 hover:bg-brand-primary-100 hover:text-brand-primary-900",
                  "focus-visible:ring-brand-primary-500",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Display Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sellerData ? (
          <>
            <DashboardCard title="Total Orders" value={sellerData.totalOrders} />
            <DashboardCard
              title="Total Sales"
              value={sellerData.totalSales}
              currencyCode={sellerData.preferredCurrency}
            />
            <DashboardCard
              title="Average Order Value"
              value={sellerData.averageOrderValue}
              currencyCode={sellerData.preferredCurrency}
            />
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

      {sellerData && (
        <SellerDashboardRevenueChart
          series={sellerData.revenueSeries}
          currencyCode={
            sellerData.preferredCurrency?.trim() || "USD"
          }
        />
      )}
    </div>
  );
};

function ProductStatusRow({
  tone,
  label,
  value,
}: {
  tone: "success" | "warn" | "error";
  label: string;
  value: number;
}) {
  const dotClass =
    tone === "success"
      ? "bg-brand-success-500"
      : tone === "warn"
        ? "bg-brand-warn-500"
        : "bg-brand-error-500";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn("size-2 shrink-0 rounded-full", dotClass)}
        aria-hidden
      />
      <span className="min-w-0 truncate">
        {label}: {value}
      </span>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  sellerData,
  currencyCode,
}: {
  title: string;
  value: string | number;
  sellerData?: SellerData;
  /** ISO currency for money cards — matches seller `preferredCurrency` / product form */
  currencyCode?: string | null;
}) {
  const code = currencyCode?.trim() || "USD";
  const displayValue =
    title === "Total Sales" || title === "Average Order Value"
      ? formatPriceInCurrency(Number(value), code, true)
      : value;

  const valueClassName =
    title === "Most Popular Product"
      ? "text-sm font-normal text-muted-foreground"
      : "text-2xl font-bold";

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <div className="font-semibold text-lg">{title}</div>
      <div className={valueClassName}>{displayValue}</div>
      {title === "Total Products" && sellerData && (
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
          <ProductStatusRow tone="success" label="Active" value={sellerData.activeProducts} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <ProductStatusRow tone="warn" label="Draft" value={sellerData.draftProducts ?? 0} />
            <ProductStatusRow tone="warn" label="Hidden" value={sellerData.hiddenProducts} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <ProductStatusRow tone="error" label="Sold Out" value={sellerData.soldOutProducts} />
            <ProductStatusRow tone="error" label="Disabled" value={sellerData.disabledProducts} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboardInfo;
