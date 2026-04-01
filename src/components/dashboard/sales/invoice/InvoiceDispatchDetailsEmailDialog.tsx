"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendInvoiceDispatchDetailsEmailAction } from "@/lib/actions/dashboard/sales/invoice/sendInvoiceDispatchDetailsEmailAction";

type Props = {
  invoiceId: string;
  defaultEmail: string;
  disabled?: boolean;
};

export default function InvoiceDispatchDetailsEmailDialog({
  invoiceId,
  defaultEmail,
  disabled = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState(defaultEmail || "");
  const [isSending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!open) return;
    setEmail((current) => (current.trim() ? current : defaultEmail || ""));
  }, [defaultEmail, open]);

  const onSend = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Please enter recipient email");
      return;
    }

    startTransition(async () => {
      const res = await sendInvoiceDispatchDetailsEmailAction(invoiceId, trimmed);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Mail className="mr-2 h-4 w-4" />
          Send Dispatch Details
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Dispatch Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Recipient is prefilled from order&apos;s received email. You can edit
            before sending.
          </div>

          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="client@example.com"
          />

          <div className="text-xs text-muted-foreground">
            You can add multiple recipients separated by comma.
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSending}>
              Cancel
            </Button>
            <Button type="button" onClick={onSend} disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
