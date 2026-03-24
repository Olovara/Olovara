"use client";

import { useId } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn, formatPriceInCurrency } from "@/lib/utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export type RevenueSeriesPoint = {
  label: string;
  revenueCents: number;
};

/** Brand primary — ChartStyle maps this to `--color-revenue` for fills/strokes */
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "rgb(var(--brand-primary-500))",
  },
} as const;

type SellerDashboardRevenueChartProps = {
  /** Buckets from `/api/seller/dashboard` for the current date range */
  series: RevenueSeriesPoint[];
  /** Seller preferred currency (same as product form / `formatPriceInCurrency`) */
  currencyCode: string;
};

/**
 * Area chart of paid order totals (same filters as dashboard stats), in the seller's currency.
 */
export function SellerDashboardRevenueChart({
  series,
  currencyCode,
}: SellerDashboardRevenueChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const data = series.map((p) => ({
    label: p.label,
    revenue: p.revenueCents / 100,
  }));

  if (series.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground shadow-sm">
        No revenue in this period, or add a start and end date to load the
        chart.
      </div>
    );
  }

  const code = currencyCode.trim() || "USD";
  // Chart `revenue` is in major units (from cents / 100)
  const formatMajor = (n: number) =>
    formatPriceInCurrency(n, code, false);

  return (
    <div className="overflow-x-hidden rounded-lg border p-4 shadow-md">
      <h2 className="mb-4 text-lg font-semibold">Revenue</h2>
      {/*
        Mobile: outline buttons use browser default touch scrolling; horizontal drags were
        moving the page. touch-action pan-y keeps vertical page scroll but lets horizontal
        movement reach Recharts for tooltip scrubbing. overscroll-x-contain reduces chaining.
      */}
      <ChartContainer
        config={chartConfig}
        className={cn(
          "aspect-auto h-[280px] w-full max-w-full select-none",
          "touch-pan-y overscroll-x-contain",
          "[&_.recharts-responsive-container]:touch-pan-y",
          "[&_.recharts-wrapper]:touch-pan-y",
          "[&_.recharts-surface]:touch-pan-y"
        )}
      >
        <AreaChart
          data={data}
          margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-revenue)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-revenue)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={56}
            tickFormatter={(v) => formatMajor(Number(v))}
          />
          <ChartTooltip
            cursor={{
              stroke: "rgb(var(--brand-primary-400))",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-mono tabular-nums">
                    {formatMajor(Number(value))}
                  </span>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: "var(--color-revenue)",
              fill: "hsl(var(--background))",
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
