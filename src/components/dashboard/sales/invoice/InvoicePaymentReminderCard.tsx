"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPaymentReminderState,
  getPaymentTermsLabel,
} from "@/lib/helpers/globalHelpers/invoicePaymentReminder";
import { setInvoicePaymentReceivedAction } from "@/lib/actions/dashboard/sales/invoice/setInvoicePaymentReceivedAction";
import { sendInvoicePaymentReminderEmailAction } from "@/lib/actions/dashboard/sales/invoice/sendInvoicePaymentReminderEmailAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

type Props = {
  invoice: {
    id: string;
    status: string;
    invoiceNo: number;
    invoiceFy: string;
    invoiceDate?: Date | string | null;
    dispatchDate?: Date | string | null;
    grandTotal?: number | string | null;
    paymentReceived?: boolean | null;
    paymentReceivedAt?: Date | string | null;
    paymentReminderLastSentAt?: Date | string | null;
    paymentReminderCount?: number | null;
    salesOrder: {
      paymentTerms?: string | null;
      receivedFromEmail?: string | null;
      customer?: {
        companyEmail?: string | null;
      } | null;
    };
  };
};

function formatDate(value?: Date | string | null) {
  if (!value) return "N/A";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "N/A";
  }
}

function formatCurrency(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
}

function getStatusBadgeVariant({
  isPaid,
  isOverdue,
  isDueToday,
}: {
  isPaid: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
}) {
  if (isPaid) return "default";
  if (isOverdue) return "destructive";
  if (isDueToday) return "outline";
  return "secondary";
}

export default function InvoicePaymentReminderCard({ invoice }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const paymentTerms = invoice.salesOrder?.paymentTerms ?? null;
  const paymentTermsLabel = getPaymentTermsLabel(paymentTerms);
  const reminderState = getPaymentReminderState({
    paymentTerms,
    invoiceDate: invoice.invoiceDate,
    dispatchDate: invoice.dispatchDate,
    paymentReceived: invoice.paymentReceived,
  });

  const recipientEmail =
    invoice.salesOrder?.customer?.companyEmail?.trim() ||
    invoice.salesOrder?.receivedFromEmail?.trim() ||
    "";

  const invoiceNumber = formatFinancialDocumentNumber(
    invoice.invoiceFy,
    invoice.invoiceNo,
  );

  const canUpdatePayment = invoice.status === "FINALIZED";
  const canSendReminder =
    invoice.status === "FINALIZED" &&
    !reminderState.isPaid &&
    Boolean(recipientEmail);

  const onMarkReceived = (received: boolean) => {
    startTransition(async () => {
      const res = await setInvoicePaymentReceivedAction(invoice.id, received);

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.refresh();
    });
  };

  const onSendReminder = () => {
    if (!recipientEmail) {
      toast.error("Customer email is not available");
      return;
    }

    const dueDateText = reminderState.dueDate
      ? formatDate(reminderState.dueDate)
      : "N/A";

    const isEarlyReminder =
      reminderState.daysUntilDue !== null && reminderState.daysUntilDue > 0;

    const confirmMessage = isEarlyReminder
      ? `Payment is not due yet (due on ${dueDateText}). Send reminder email anyway?`
      : `Send payment reminder email for invoice ${invoiceNumber} to ${recipientEmail}?`;

    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const res = await sendInvoicePaymentReminderEmailAction(invoice.id);

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Follow-up</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Payment Terms</div>
            <div className="font-medium">{paymentTermsLabel}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Due Date</div>
            <div className="font-medium">
              {reminderState.dueDate ? formatDate(reminderState.dueDate) : "N/A"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Payment Status</div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  getStatusBadgeVariant({
                    isPaid: reminderState.isPaid,
                    isOverdue: reminderState.isOverdue,
                    isDueToday: reminderState.isDueToday,
                  }) as "default" | "destructive" | "outline" | "secondary"
                }>
                {reminderState.statusText}
              </Badge>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Invoice Amount</div>
            <div className="font-medium">{formatCurrency(invoice.grandTotal)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Recipient Email</div>
            <div className="font-medium break-all">{recipientEmail || "N/A"}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Reminders Sent</div>
            <div className="font-medium">{Number(invoice.paymentReminderCount ?? 0)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Last Reminder</div>
            <div className="font-medium">
              {invoice.paymentReminderLastSentAt
                ? formatDate(invoice.paymentReminderLastSentAt)
                : "Not sent"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Payment Received At</div>
            <div className="font-medium">
              {invoice.paymentReceivedAt ? formatDate(invoice.paymentReceivedAt) : "N/A"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            onClick={() => onMarkReceived(true)}
            disabled={isPending || !canUpdatePayment || reminderState.isPaid}>
            Mark as Received
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onMarkReceived(false)}
            disabled={isPending || !canUpdatePayment || !reminderState.isPaid}>
            Mark as Pending
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onSendReminder}
            disabled={isPending || !canSendReminder}>
            Send Reminder Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
