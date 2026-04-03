"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceInCurrency } from "@/lib/utils";

type TopByViews = { productId: string; productName: string; views: number };
type TopBySales = {
  productId: string;
  productName: string;
  revenueCents: number;
};

type ProductAnalyticsRow = {
  productId: string;
  productName: string;
  views: number;
  /** Paid order rows (checkouts) for this product */
  sales: number;
  /** Wishlist rows referencing this product (any buyer wishlist) */
  wishlists: number;
  /** Paid orders ÷ product views for this SKU; null if views = 0 */
  conversionRatePercent: number | null;
};

type ProductAnalyticsPage = {
  items: ProductAnalyticsRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CountryBreakdownRow = {
  countryKey: string;
  countryLabel: string;
  views: number;
  purchases: number;
};

type AnalyticsPayload = {
  preferredCurrency?: string | null;
  totalProductViews: number;
  totalShopViews: number;
  totalOrders: number;
  totalRevenueCents: number;
  averageOrderValueCents: number;
  /** Paid orders ÷ product views; null when there are no product views to compare. */
  conversionRatePercent: number | null;
  topProductsByViews: TopByViews[];
  topProductsBySales: TopBySales[];
  productAnalyticsPage: ProductAnalyticsPage;
  countryBreakdown: CountryBreakdownRow[];
};

export function SellerAnalyticsContent() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableBusy, setTableBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const isFirstAnalyticsFetch = useRef(true);

  useEffect(() => {
    const sellerUserId = session?.user?.id;
    if (!sellerUserId) {
      setError("Not signed in");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const first = isFirstAnalyticsFetch.current;
    if (first) {
      setLoading(true);
      isFirstAnalyticsFetch.current = false;
    } else {
      setTableBusy(true);
    }

    (async () => {
      try {
        const q = new URLSearchParams();
        q.set("sellerId", sellerUserId);
        q.set("productPage", String(productPage));
        const res = await fetch(`/api/seller/analytics?${q}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load analytics");
        }
        const payload = (await res.json()) as AnalyticsPayload;
        if (!cancelled) {
          setData(payload);
          setError(null);
          if (payload.productAnalyticsPage.page !== productPage) {
            setProductPage(payload.productAnalyticsPage.page);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTableBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, productPage]);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Product views" value={data.totalProductViews} />
        <StatCard title="Shop views" value={data.totalShopViews} />
        <StatCard title="Orders" value={data.totalOrders} />
        <StatCard
          title="Revenue"
          value={formatPriceInCurrency(data.totalRevenueCents, currency, true)}
        />
        <StatCard
          title="Avg. order value"
          value={
            data.totalOrders > 0
              ? formatPriceInCurrency(data.averageOrderValueCents, currency, true)
              : "—"
          }
          hint={
            data.totalOrders > 0
              ? "Mean revenue per paid order (checkout)"
              : "Shows after your first paid order"
          }
        />
        <StatCard
          title="Conversion rate"
          value={
            data.conversionRatePercent !== null
              ? `${data.conversionRatePercent.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}%`
              : "—"
          }
          hint={
            data.totalProductViews > 0
              ? "Paid orders ÷ product page views (approximate)"
              : "Needs at least one recorded product view"
          }
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

      <Card className="bg-brand-light-neutral-50 dark:bg-card">
        <CardHeader>
          <CardTitle>All products</CardTitle>
          <CardDescription>
            Paid orders, recorded product views, wishlist saves, and per-product
            conversion (paid orders ÷ views). Ten products per page.
          </CardDescription>
        </CardHeader>
        <CardContent
          className={`space-y-4 ${tableBusy ? "opacity-60 pointer-events-none" : ""}`}
        >
          {data.productAnalyticsPage.total === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No products in your catalog yet.
            </p>
          ) : (
            <>
              <div className="rounded-md border border-border/60 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Product name</TableHead>
                      <TableHead scope="col" className="text-right">
                        Product views
                      </TableHead>
                      <TableHead scope="col" className="text-right">
                        Product sales
                      </TableHead>
                      <TableHead scope="col" className="text-right">
                        Wishlists
                      </TableHead>
                      <TableHead scope="col" className="text-right">
                        Conversion rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.productAnalyticsPage.items.map((row) => (
                      <TableRow key={row.productId}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {row.productName}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.sales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.wishlists.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.conversionRatePercent !== null
                            ? `${row.conversionRatePercent.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}%`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {data.productAnalyticsPage.items.length === 0
                    ? 0
                    : (data.productAnalyticsPage.page - 1) *
                        data.productAnalyticsPage.pageSize +
                      1}
                  –
                  {(data.productAnalyticsPage.page - 1) *
                    data.productAnalyticsPage.pageSize +
                    data.productAnalyticsPage.items.length}{" "}
                  of {data.productAnalyticsPage.total.toLocaleString()} products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      tableBusy || data.productAnalyticsPage.page <= 1
                    }
                    onClick={() =>
                      setProductPage((p) => Math.max(1, p - 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" aria-hidden />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums px-2">
                    Page {data.productAnalyticsPage.page} of{" "}
                    {data.productAnalyticsPage.totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      tableBusy ||
                      data.productAnalyticsPage.page >=
                        data.productAnalyticsPage.totalPages
                    }
                    onClick={() =>
                      setProductPage((p) =>
                        Math.min(data.productAnalyticsPage.totalPages, p + 1)
                      )
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-brand-light-neutral-50 dark:bg-card">
        <CardHeader>
          <CardTitle>Traffic &amp; sales by country</CardTitle>
          <CardDescription>
            Product views use IP-based geolocation from analytics. Purchases use
            stored buyer location when available, otherwise the tax / checkout
            country from Stripe. Rows with no data appear as &quot;Unknown&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent
          className={tableBusy ? "opacity-60 pointer-events-none" : undefined}
        >
          {data.countryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No country data yet (needs recorded product views and/or paid
              orders with location).
            </p>
          ) : (
            <div className="rounded-md border border-border/60 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Country / region</TableHead>
                    <TableHead scope="col" className="text-right">
                      Product views
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Purchases
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.countryBreakdown.map((row) => (
                    <TableRow key={row.countryKey}>
                      <TableCell className="font-medium">
                        {row.countryLabel}
                        {row.countryKey !== row.countryLabel &&
                        row.countryKey !== "Unknown" ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                            ({row.countryKey})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.views.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.purchases.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="bg-brand-light-neutral-50 dark:bg-card">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        {hint ? (
          <p className="text-xs text-muted-foreground pt-1 leading-snug">{hint}</p>
        ) : null}
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
