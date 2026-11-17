"use client";

import { useId, useRef, useState, useTransition } from "react";
import { ExternalLink, Loader2, Mail, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGmailNotifications } from "@/components/dashboard/gmail/GmailNotificationsProvider";
import { sendQuotationEmailAction } from "@/lib/actions/dashboard/sales/quotation/sendQuotationEmailAction";

type Props = {
  quotationId: string;
  quotationNumber: string;
  updatedAt: string;
  defaultEmail: string;
  customerName: string;
  disabled?: boolean;
};

export default function SendQuotationEmailDialog({ quotationId, quotationNumber, updatedAt, defaultEmail, customerName, disabled }: Props) {
  const { data, loading } = useGmailNotifications();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const connection = data?.connection;
  const canSend = !!data?.configured && !!connection?.canSend;
  const pdfUrl = `/api/quotations/${encodeURIComponent(quotationId)}/pdf?version=${encodeURIComponent(updatedAt)}`;
  const gmailSentUrl = `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(connection?.email ?? "")}#sent`;

  function changeOpen(next: boolean) {
    if (busy.current) return;
    if (next) {
      setRecipient(defaultEmail);
      setSubject(`Quotation ${quotationNumber} - Explosion Proof Electrical Control`);
      setMessage(`Dear ${customerName || "Customer"},\n\nPlease find attached our quotation ${quotationNumber} for your review.\n\nPlease contact us if you have any questions or require further information.\n\nRegards,\nExplosion Proof Electrical Control`);
      setRequestId(crypto.randomUUID());
      setError(null);
      setAttempted(false);
    }
    setOpen(next);
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>
      <Button type="button" variant="outline" disabled={disabled}><Mail data-icon="inline-start" />Send Quotation</Button>
    </DialogTrigger>
    <DialogContent showCloseButton={!pending}>
      <DialogHeader>
        <DialogTitle>Send quotation {quotationNumber}</DialogTitle>
        <DialogDescription>Your existing customer copy will be converted to PDF and attached. Review the email before sending.</DialogDescription>
      </DialogHeader>
      <form className="flex flex-col gap-4" onSubmit={(event) => {
        event.preventDefault();
        if (!canSend || busy.current || attempted) return;
        busy.current = true;
        setError(null);
        setAttempted(true);
        startTransition(async () => {
          try {
            const result = await sendQuotationEmailAction({ quotationId, expectedUpdatedAt: updatedAt, requestId,
              recipient: recipient.trim(), subject: subject.trim(), message: message.trim() });
            if (!result.ok) { setError(result.message); return; }
            toast.success(result.message);
            setOpen(false);
          } catch {
            setError("The send result could not be confirmed. Check Gmail Sent before sending this quotation again.");
          } finally { busy.current = false; }
        });
      }}>
        {loading ? <p role="status" className="text-sm text-muted-foreground">Checking your Gmail connection…</p>
          : canSend ? <p className="break-all text-sm text-muted-foreground">From: {connection?.email}</p>
          : <p role="status" className="text-sm text-muted-foreground">{data?.configured
            ? "Connect or reconnect Gmail and allow sending quotations to continue."
            : "Gmail setup must be completed on the server before you can send."}{" "}<a className="underline underline-offset-4" href="/dashboard/inbox">Open Inbox Alerts</a></p>}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-recipient`}>To</FieldLabel>
            <Input id={`${id}-recipient`} type="email" autoComplete="email" required maxLength={254} value={recipient} disabled={pending || attempted} onChange={(event) => setRecipient(event.target.value)} />
            <FieldDescription>Prefilled from the enquiry email or customer record. You can change it before sending.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-subject`}>Subject</FieldLabel>
            <Input id={`${id}-subject`} required maxLength={200} value={subject} disabled={pending || attempted} onChange={(event) => setSubject(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-message`}>Message</FieldLabel>
            <Textarea id={`${id}-message`} required maxLength={10000} rows={6} value={message} disabled={pending || attempted} onChange={(event) => setMessage(event.target.value)} />
          </Field>
        </FieldGroup>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Paperclip aria-hidden="true" className="size-4 shrink-0" />
          <span>Quotation-{quotationNumber}.pdf</span>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">Preview / download PDF<ExternalLink aria-hidden="true" className="size-3" /></a>
        </div>
        {error && <div className="flex flex-col gap-2">
          <p role="alert" className="text-sm text-destructive">{error}</p>
          {connection && <a href={gmailSentUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-4">Check Gmail Sent</a>}
        </div>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => changeOpen(false)}>Close</Button>
          <Button type="submit" disabled={!canSend || pending || attempted}>
            {pending ? <><Loader2 data-icon="inline-start" className="animate-spin" />Sending…</> : <><Mail data-icon="inline-start" />Send with PDF</>}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
