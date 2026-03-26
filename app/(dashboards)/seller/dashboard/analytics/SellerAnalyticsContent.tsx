"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPriceInCurrency } from "@/lib/utils";

type TopByViews = { productId: string; productName: string; views: number };
type TopBySales = {
  productId: string;
  productName: string;
  revenueCents: number;
};

type AnalyticsPayload = {
  preferredCurrency?: string | null;
  totalProductViews: number;
  totalShopViews: number;
  totalOrders: number;
  totalRevenueCents: number;
  topProductsByViews: TopByViews[];
  topProductsBySales: TopBySales[];
};

export function SellerAnalyticsContent() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!session?.user?.id) {
        setError("Not signed in");
        setLoading(false);
        return;
      }
      try {
        const q = new URLSearchParams({ sellerId: session.user.id });
        const res = await fetch(`/api/seller/analytics?${q}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load analytics");
        }
        setData((await res.json()) as AnalyticsPayload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [session?.user?.id]);

  const currency = data?.preferredCurrency?.trim() || "USD";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Product and shop traffic, orders, and revenue (all paid orders, no
          date filter).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Product views" value={data.totalProductViews} />
        <StatCard title="Shop views" value={data.totalShopViews} />
        <StatCard title="Orders" value={data.totalOrders} />
        <StatCard
          title="Revenue"
          value={formatPriceInCurrency(data.totalRevenueCents, currency, true)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-brand-light-neutral-50 dark:bg-card">
          <CardHeader>
            <CardTitle>Top products by views</CardTitle>
            <CardDescription>
              Ranked by recorded product page views across your catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopList
              empty="No product views recorded yet."
              rows={data.topProductsByViews.map((p, i) => ({
                key: p.productId,
                rank: i + 1,
                label: p.productName,
                sub: `${p.views.toLocaleString()} views`,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="bg-brand-light-neutral-50 dark:bg-card">
          <CardHeader>
            <CardTitle>Top products by sales</CardTitle>
            <CardDescription>
              Ranked by total revenue from completed paid orders per product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopList
              empty="No sales yet."
              rows={data.topProductsBySales.map((p, i) => ({
                key: p.productId,
                rank: i + 1,
                label: p.productName,
                sub: formatPriceInCurrency(p.revenueCents, currency, true),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="bg-brand-light-neutral-50 dark:bg-card">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function TopList({
  rows,
  empty,
}: {
  rows: { key: string; rank: number; label: string; sub: string }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">{empty}</p>
    );
  }
  return (
    <ol className="space-y-3">
      {rows.map((r) => (
        <li
          key={r.key}
          className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary-100 text-sm font-semibold text-brand-primary-900 dark:bg-brand-primary-900/30 dark:text-brand-primary-100">
            {r.rank}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{r.label}</div>
            <div className="text-sm text-muted-foreground">{r.sub}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
