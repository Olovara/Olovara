"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import type { MyCustomOrderSubmissionRow } from "@/actions/customOrderFormActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BuyerCustomOrderDetailModal from "@/components/member/BuyerCustomOrderDetailModal";
import {
  buyerCustomOrderTabForStatus,
  BUYER_CUSTOM_ORDER_TAB_ORDER,
  type BuyerCustomOrderTabId,
} from "@/lib/buyer-custom-order-tabs";

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "QUOTED":
    case "REVIEWED":
    case "APPROVED":
    case "READY_FOR_FINAL_PAYMENT":
      return "default";
    case "COMPLETED":
      return "outline";
    case "REJECTED":
    case "DECLINED_BY_BUYER":
    case "BUYER_DECLINED":
      return "destructive";
    default:
      return "outline";
  }
}

const TAB_LABELS: Record<BuyerCustomOrderTabId, string> = {
  requests: "Requests",
  quotes: "Quotes",
  active: "Active",
  completed: "Completed",
  declined: "Declined",
};

/** Per-tab copy when the list is empty but the user has other submissions. */
const TAB_EMPTY_HINT: Record<BuyerCustomOrderTabId, string> = {
  requests:
    "Nothing waiting on the seller right now. Check Quotes or Active for updates.",
  quotes: "No open quotes. The seller will send an estimate here when ready.",
  active:
    "No orders in progress. After you accept a quote, work in progress appears here.",
  completed: "No completed custom orders yet.",
  declined:
    "Nothing here yet. Seller rejections and quotes you decline will appear in this tab.",
};

function SubmissionsTable({
  items,
  onView,
}: {
  items: MyCustomOrderSubmissionRow[];
  onView: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Shop</TableHead>
          <TableHead>Form</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((s) => (
          <TableRow key={s.id}>
            <TableCell>
              <Link
                href={`/shops/${s.shopNameSlug}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {s.shopName}
              </Link>
            </TableCell>
            <TableCell className="max-w-[200px] truncate md:max-w-none">
              {s.formTitle}
            </TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(s.status)}>
                {s.status.replace(/_/g, " ")}
              </Badge>
              {s.quoteSentAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Quote sent
                </p>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {format(new Date(s.createdAt), "MMM d, yyyy")}
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="outlinePrimary"
                size="sm"
                onClick={() => onView(s.id)}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function BuyerCustomOrdersView({
  submissions,
}: {
  submissions: MyCustomOrderSubmissionRow[];
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const byTab = useMemo(() => {
    const map: Record<BuyerCustomOrderTabId, MyCustomOrderSubmissionRow[]> = {
      requests: [],
      quotes: [],
      active: [],
      completed: [],
      declined: [],
    };
    for (const s of submissions) {
      map[buyerCustomOrderTabForStatus(s.status)].push(s);
    }
    return map;
  }, [submissions]);

  const defaultTab = useMemo((): BuyerCustomOrderTabId => {
    for (const id of BUYER_CUSTOM_ORDER_TAB_ORDER) {
      if (byTab[id].length > 0) return id;
    }
    return "requests";
  }, [byTab]);

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-muted-foreground">
          You haven&apos;t submitted any custom order requests yet.
        </p>
        <Button variant="outlinePrimary" asChild>
          <Link href="/shops">Browse shops</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
          {BUYER_CUSTOM_ORDER_TAB_ORDER.map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              className="shrink-0 px-2.5 text-xs sm:px-3 sm:text-sm"
            >
              {TAB_LABELS[id]}{" "}
              <span className="ml-0.5 tabular-nums text-muted-foreground">
                ({byTab[id].length})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {BUYER_CUSTOM_ORDER_TAB_ORDER.map((id) => (
          <TabsContent key={id} value={id} className="mt-0">
            {byTab[id].length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {TAB_EMPTY_HINT[id]}
              </p>
            ) : (
              <SubmissionsTable items={byTab[id]} onView={openDetail} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <BuyerCustomOrderDetailModal
        submissionId={detailId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailId(null);
        }}
      />
    </>
  );
}
