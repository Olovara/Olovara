"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomOrderSubmissionDetailModal from "@/components/seller/CustomOrderSubmissionDetailModal";
import RejectCustomOrderSubmissionDialog from "@/components/seller/RejectCustomOrderSubmissionDialog";
import SendCustomOrderQuoteDialog from "@/components/seller/SendCustomOrderQuoteDialog";
import {
  sellerStartCustomOrderWork,
} from "@/actions/customOrderFormActions";
import { ensureConversationForCustomOrderSubmission } from "@/actions/conversationActions";
import { toast } from "sonner";
import {
  Eye,
  Inbox,
  MessageCircle,
  MoreHorizontal,
  Play,
  Send,
  XCircle,
} from "lucide-react";

export type SubmissionListItem = {
  id: string;
  formId: string;
  userId: string;
  status: string;
  customerEmail: string;
  customerName: string | null;
  quoteDepositMinor: number | null;
  finalPaymentAmount: number | null;
  totalAmount: number | null;
  currency: string;
  quoteDepositPaid: boolean;
  finalPaymentPaid: boolean;
  createdAt: Date;
  form: { title: string };
  _count: { payments: number };
};

type FormOption = { id: string; title: string };

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "QUOTED":
    case "REVIEWED":
    case "APPROVED":
    case "PENDING_SELLER_START":
    case "IN_PROGRESS":
    case "READY_FOR_FINAL_PAYMENT":
      return "default";
    case "COMPLETED":
      return "outline";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

function formatMoney(cents: number | null, currency: string) {
  if (cents == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(cents / 100);
}

/** Form filter Select: primary highlight instead of default accent (tertiary). */
const FORM_FILTER_SELECT_ITEM =
  "cursor-pointer data-[highlighted]:bg-brand-primary-700 data-[highlighted]:text-brand-light-neutral-50 focus:bg-brand-primary-700 focus:text-brand-light-neutral-50";

/** Shared ⋮ menu for table row and mobile card (matches seller ProductTable pattern). */
function SubmissionActionsDropdown({
  s,
  busySubmissionId,
  onView,
  onOpenRejectDialog,
  onOpenQuoteDialog,
  onMessageBuyer,
  onStartWork,
  rejectDisabled: rejectOff,
  quoteDisabled: quoteOff,
}: {
  s: SubmissionListItem;
  busySubmissionId: string | null;
  onView: (id: string) => void;
  onOpenRejectDialog: (id: string) => void;
  onOpenQuoteDialog: (id: string, currency: string) => void;
  onMessageBuyer: (id: string) => void;
  onStartWork: (id: string) => void;
  rejectDisabled: (status: string) => boolean;
  quoteDisabled: (status: string) => boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outlinePrimary"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={busySubmissionId === s.id}
          aria-label="Submission actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 border-brand-dark-neutral-200 bg-brand-light-neutral-50"
      >
        <DropdownMenuItem
          onClick={() => onView(s.id)}
          className="cursor-pointer data-[highlighted]:bg-brand-primary-700 data-[highlighted]:text-brand-light-neutral-50 focus:bg-brand-primary-700 focus:text-brand-light-neutral-50"
        >
          <Eye className="mr-2 h-4 w-4" />
          View details
        </DropdownMenuItem>
        {s.status === "PENDING_SELLER_START" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={busySubmissionId === s.id}
              onClick={() => onStartWork(s.id)}
              className="cursor-pointer data-[highlighted]:bg-brand-primary-700 data-[highlighted]:text-brand-light-neutral-50 focus:bg-brand-primary-700 focus:text-brand-light-neutral-50"
            >
              <Play className="mr-2 h-4 w-4" />
              {"Confirm & start work"}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busySubmissionId === s.id || quoteOff(s.status)}
          onClick={() => onOpenQuoteDialog(s.id, s.currency)}
          className="cursor-pointer data-[highlighted]:bg-brand-primary-700 data-[highlighted]:text-brand-light-neutral-50 focus:bg-brand-primary-700 focus:text-brand-light-neutral-50"
        >
          <Send className="mr-2 h-4 w-4" />
          {s.status === "QUOTED" ? "Update quote" : "Send quote"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busySubmissionId === s.id || rejectOff(s.status)}
          onClick={() => onOpenRejectDialog(s.id)}
          className="cursor-pointer text-destructive data-[highlighted]:bg-destructive data-[highlighted]:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busySubmissionId === s.id}
          onClick={() => void onMessageBuyer(s.id)}
          className="cursor-pointer data-[highlighted]:bg-brand-primary-700 data-[highlighted]:text-brand-light-neutral-50 focus:bg-brand-primary-700 focus:text-brand-light-neutral-50"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Message buyer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CustomOrderSubmissionsView({
  submissions,
  forms,
  initialFormId,
}: {
  submissions: SubmissionListItem[];
  forms: FormOption[];
  initialFormId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSubmissionId, setDetailSubmissionId] = useState<string | null>(
    null,
  );
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteTargetId, setQuoteTargetId] = useState<string | null>(null);
  const [quoteCurrency, setQuoteCurrency] = useState("USD");
  const [detailRefreshTrigger, setDetailRefreshTrigger] = useState(0);

  const filterValue = initialFormId ?? "all";

  const openRejectDialog = (submissionId: string) => {
    setRejectTargetId(submissionId);
    setRejectDialogOpen(true);
  };

  const openSubmissionDetail = (id: string) => {
    setDetailSubmissionId(id);
    setDetailOpen(true);
  };

  const openQuoteDialog = (id: string, currency: string) => {
    setQuoteTargetId(id);
    setQuoteCurrency(currency?.trim() || "USD");
    setQuoteDialogOpen(true);
  };

  // After deposit: PENDING_SELLER_START → seller confirms start → IN_PROGRESS.

  const handleStartWork = async (submissionId: string) => {
    setBusySubmissionId(submissionId);
    try {
      const res = await sellerStartCustomOrderWork(submissionId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? "Order in progress");
      router.refresh();
      setDetailRefreshTrigger((n) => n + 1);
    } finally {
      setBusySubmissionId(null);
    }
  };

  const handleMessageBuyer = async (submissionId: string) => {
    setBusySubmissionId(submissionId);
    try {
      const res =
        await ensureConversationForCustomOrderSubmission(submissionId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const conversationId = res.data?.conversationId;
      if (!conversationId) {
        toast.error("Could not open conversation");
        return;
      }
      toast.success("Opening messages");
      router.push(
        `/seller/dashboard/messages?conversationId=${conversationId}`,
      );
    } finally {
      setBusySubmissionId(null);
    }
  };

  const acceptDisabled = (_status: string) => true;

  const quoteDisabled = (status: string) =>
    status === "APPROVED" ||
    status === "REVIEWED" ||
    status === "PENDING_SELLER_START" ||
    status === "IN_PROGRESS" ||
    status === "READY_FOR_FINAL_PAYMENT" ||
    status === "COMPLETED" ||
    status === "REJECTED";

  const rejectDisabled = (status: string) =>
    status === "REJECTED" || status === "COMPLETED";

  const setFormFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("formId");
    } else {
      params.set("formId", value);
    }
    const q = params.toString();
    router.push(
      q
        ? `/seller/dashboard/custom-orders/submissions?${q}`
        : "/seller/dashboard/custom-orders/submissions",
    );
  };

  return (
    <div className="space-y-6">
      <RejectCustomOrderSubmissionDialog
        open={rejectDialogOpen}
        onOpenChange={(next) => {
          setRejectDialogOpen(next);
          if (!next) setRejectTargetId(null);
        }}
        submissionId={rejectTargetId}
        onRejected={() => {
          router.refresh();
          setDetailRefreshTrigger((n) => n + 1);
        }}
      />
      <SendCustomOrderQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={(next) => {
          setQuoteDialogOpen(next);
          if (!next) setQuoteTargetId(null);
        }}
        submissionId={quoteTargetId}
        currency={quoteCurrency}
        onSent={() => {
          router.refresh();
          setDetailRefreshTrigger((n) => n + 1);
        }}
      />
      <CustomOrderSubmissionDetailModal
        submissionId={detailSubmissionId}
        open={detailOpen}
        refreshTrigger={detailRefreshTrigger}
        onRequestReject={() => {
          if (detailSubmissionId) openRejectDialog(detailSubmissionId);
        }}
        onOpenChange={(next) => {
          setDetailOpen(next);
          if (!next) setDetailSubmissionId(null);
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground">
            Custom order requests from customers across your forms
          </p>
        </div>
        {forms.length > 0 && (
          <div className="space-y-2 sm:w-72">
            <Label htmlFor="form-filter">Filter by form</Label>
            <Select value={filterValue} onValueChange={setFormFilter}>
              <SelectTrigger
                id="form-filter"
                className="border-brand-dark-neutral-200 bg-brand-light-neutral-50"
              >
                <SelectValue placeholder="All forms" />
              </SelectTrigger>
              <SelectContent className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
                <SelectItem value="all" className={FORM_FILTER_SELECT_ITEM}>
                  All forms
                </SelectItem>
                {forms.map((f) => (
                  <SelectItem
                    key={f.id}
                    value={f.id}
                    className={FORM_FILTER_SELECT_ITEM}
                  >
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
        <CardHeader>
          <CardTitle>
            {submissions.length === 0
              ? "No submissions"
              : `${submissions.length} submission${submissions.length === 1 ? "" : "s"}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Inbox className="mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">Nothing here yet</p>
              <p className="mt-1 max-w-sm text-sm">
                When customers submit your custom order forms, their requests
                will show up in this list.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop: table (same breakpoint as seller ProductTable) */}
              <div className="hidden md:block w-full overflow-x-auto rounded-md border border-brand-dark-neutral-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-light-neutral-100 hover:bg-brand-light-neutral-100">
                      <TableHead>Form</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Submitted
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Payments
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Totals
                      </TableHead>
                      <TableHead className="w-[1%] whitespace-nowrap text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((s) => (
                      <TableRow
                        key={s.id}
                        className="bg-brand-light-neutral-50 hover:bg-brand-light-neutral-100"
                      >
                        <TableCell className="max-w-[10rem] font-medium">
                          <span className="line-clamp-2">{s.form.title}</span>
                        </TableCell>
                        <TableCell className="max-w-[14rem]">
                          <div className="text-sm">
                            {s.customerName && (
                              <div className="font-medium">
                                {s.customerName}
                              </div>
                            )}
                            <div className="text-muted-foreground break-all">
                              {s.customerEmail || "—"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(s.createdAt), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(s.status)}>
                            {s.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">
                          <div className="space-y-0.5">
                            <div>
                              Deposit: {s.quoteDepositPaid ? "Paid" : "Unpaid"}
                            </div>
                            <div>
                              Final: {s.finalPaymentPaid ? "Paid" : "Unpaid"}
                            </div>
                            {s._count.payments > 0 && (
                              <div className="text-muted-foreground">
                                {s._count.payments} charge
                                {s._count.payments === 1 ? "" : "s"}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm md:table-cell">
                          <div className="space-y-0.5">
                            {s.totalAmount != null && (
                              <div>
                                Total: {formatMoney(s.totalAmount, s.currency)}
                              </div>
                            )}
                            {s.quoteDepositMinor != null && (
                              <div className="text-muted-foreground">
                                Deposit:{" "}
                                {formatMoney(s.quoteDepositMinor, s.currency)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <SubmissionActionsDropdown
                            s={s}
                            busySubmissionId={busySubmissionId}
                            onView={openSubmissionDetail}
                            onOpenRejectDialog={openRejectDialog}
                            onOpenQuoteDialog={openQuoteDialog}
                            onMessageBuyer={handleMessageBuyer}
                            onStartWork={handleStartWork}
                            rejectDisabled={rejectDisabled}
                            quoteDisabled={quoteDisabled}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: stacked cards (matches seller ProductTable md:hidden pattern) */}
              <div className="md:hidden w-full max-w-full space-y-4">
                {submissions.map((s) => (
                  <Card
                    key={s.id}
                    className="w-full max-w-full border-brand-dark-neutral-200 bg-brand-light-neutral-100"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug">
                            {s.form.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(
                              new Date(s.createdAt),
                              "MMM d, yyyy h:mm a",
                            )}
                          </p>
                        </div>
                        <SubmissionActionsDropdown
                          s={s}
                          busySubmissionId={busySubmissionId}
                          onView={openSubmissionDetail}
                          onOpenRejectDialog={openRejectDialog}
                          onOpenQuoteDialog={openQuoteDialog}
                          onMessageBuyer={handleMessageBuyer}
                          onStartWork={handleStartWork}
                          rejectDisabled={rejectDisabled}
                          quoteDisabled={quoteDisabled}
                        />
                      </div>

                      <div className="mt-3 text-sm">
                        {s.customerName && (
                          <p className="font-medium">{s.customerName}</p>
                        )}
                        <p className="break-all text-muted-foreground">
                          {s.customerEmail || "—"}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadgeVariant(s.status)}>
                          {s.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-brand-dark-neutral-200 pt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Payments:{" "}
                          </span>
                          <span>
                            Deposit {s.quoteDepositPaid ? "paid" : "unpaid"}
                            {" · "}
                            Final {s.finalPaymentPaid ? "paid" : "unpaid"}
                          </span>
                          {s._count.payments > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({s._count.payments} charge
                              {s._count.payments === 1 ? "" : "s"})
                            </span>
                          )}
                        </div>
                        {(s.totalAmount != null ||
                          s.quoteDepositMinor != null) && (
                          <div className="flex flex-col gap-1">
                            {s.totalAmount != null && (
                              <div>
                                <span className="text-muted-foreground">
                                  Total:{" "}
                                </span>
                                <span className="font-medium">
                                  {formatMoney(s.totalAmount, s.currency)}
                                </span>
                              </div>
                            )}
                            {s.quoteDepositMinor != null && (
                              <div className="text-muted-foreground">
                                Deposit:{" "}
                                {formatMoney(s.quoteDepositMinor, s.currency)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
