"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Mail, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultQuotationMessage, quotationMessageHtml } from "@/lib/quotations/emailMessage";
import { getQuotationReplyOptionsAction, getQuotationReplyContextAction, type QuotationReplyOption } from "@/lib/actions/dashboard/sales/quotation/getQuotationReplyOptionsAction";
import { useGmailNotifications } from "@/components/dashboard/gmail/GmailNotificationsProvider";
import { sendQuotationEmailAction } from "@/lib/actions/dashboard/sales/quotation/sendQuotationEmailAction";
import { istDateInput, sendFollowupDate, type FollowupChoice } from "@/lib/quotations/followupDate";

type Props = {
  quotationId: string;
  quotationNumber: string;
  updatedAt: string;
  defaultEmail: string;
  customerName: string;
  disabled?: boolean;
  canScheduleFollowup?: boolean;
};

export default function SendQuotationEmailDialog({ quotationId, quotationNumber, updatedAt, defaultEmail, disabled, canScheduleFollowup = true }: Props) {
  const router = useRouter();
  const { data, loading } = useGmailNotifications();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [followupChoice, setFollowupChoice] = useState<FollowupChoice>("3");
  const [customFollowupDate, setCustomFollowupDate] = useState("");
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [replyOptions, setReplyOptions] = useState<QuotationReplyOption[]>([]);
  const [replyId, setReplyId] = useState("new");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyReady, setReplyReady] = useState(true);
  const requestVersion = useRef(0);
  const busy = useRef(false);
  const connection = data?.connection;
  const canSend = !!data?.configured && !!connection?.canSend;
  const pdfUrl = `/api/quotations/${encodeURIComponent(quotationId)}/pdf?version=${encodeURIComponent(updatedAt)}`;
  const gmailSentUrl = `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(connection?.email ?? "")}#sent`;

  async function selectConversation(value: string) {
    const version = ++requestVersion.current;
    setReplyId(value);
    setError(null);
    if (value === "new") {
      setRecipient(defaultEmail);
      setSubject(`Quotation ${quotationNumber} - Explosion Proof Electrical Control`);
      setReplyLoading(false); setReplyReady(true); return;
    }
    setReplyLoading(true); setReplyReady(false);
    try {
      const context = await getQuotationReplyContextAction(quotationId, value);
      if (version !== requestVersion.current) return;
      setRecipient(context.recipient); setSubject(context.subject); setReplyReady(true);
    } catch {
      if (version === requestVersion.current) setError("Could not load the conversation's reply details. Select it again or choose a new email.");
    } finally { if (version === requestVersion.current) setReplyLoading(false); }
  }

  function changeOpen(next: boolean) {
    if (busy.current) return;
    const version = ++requestVersion.current;
    if (next) {
      setRecipient(defaultEmail);
      setSubject(`Quotation ${quotationNumber} - Explosion Proof Electrical Control`);
      setMessage(defaultQuotationMessage(quotationNumber));
      setFollowupChoice(canScheduleFollowup ? "3" : "none"); setCustomFollowupDate("");
      setRequestId(crypto.randomUUID());
      setError(null);
      setAttempted(false);
      setReplyId("new"); setReplyOptions([]); setReplyLoading(true); setReplyReady(true);
      void getQuotationReplyOptionsAction(quotationId).then((options) => {
        if (version !== requestVersion.current) return;
        setReplyOptions(options); setReplyLoading(false);
        const linked = options.filter((option) => option.linked);
        const preferred = linked.length === 1 ? linked[0] : options.length === 1 ? options[0] : null;
        if (preferred) void selectConversation(preferred.id);
      }).catch(() => {
        if (version !== requestVersion.current) return;
        setReplyLoading(false);
        setError("Could not load original conversations. Reopen this dialog to try again, or send a new email.");
      });
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
        if (!canSend || busy.current || attempted || replyLoading || !replyReady) return;
        let followupAt: string | null;
        try { followupAt = sendFollowupDate(followupChoice, customFollowupDate); }
        catch (error) { setError(error instanceof Error ? error.message : "Choose a future follow-up date."); return; }
        busy.current = true;
        setError(null);
        setAttempted(true);
        startTransition(async () => {
          try {
            const result = await sendQuotationEmailAction({ quotationId, expectedUpdatedAt: updatedAt, requestId,
              recipient: recipient.trim(), subject: subject.trim(), message: message.trim(), replyNotificationId: replyId === "new" ? null : replyId, followupAt });
            if (!result.ok) { setError(result.message); return; }
            toast.success(result.message);
            setOpen(false);
            router.refresh();
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
            <FieldLabel htmlFor={`${id}-conversation`}>Conversation</FieldLabel>
            <Select value={replyId} onValueChange={(value) => { void selectConversation(value); }} disabled={pending || attempted || replyLoading}>
              <SelectTrigger id={`${id}-conversation`}><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup>
                <SelectItem value="new">Send a new email</SelectItem>
                {replyOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.linked ? "Linked: " : "Reply: "}{option.subject} · {new Date(option.receivedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</SelectItem>)}
              </SelectGroup></SelectContent>
            </Select>
            <FieldDescription>{replyLoading ? "Loading conversation details…" : replyId !== "new" ? "The PDF will be sent as a reply in this conversation. The original subject and reply address are preserved." : replyOptions.length ? "Choose the customer's original conversation above to reply in the same thread." : "To reply to an original email, link it to this quotation from the Gmail sales inbox."}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-recipient`}>To</FieldLabel>
            <Input id={`${id}-recipient`} type="email" autoComplete="email" required maxLength={254} value={recipient} readOnly={replyId !== "new"} disabled={pending || attempted || replyLoading} onChange={(event) => setRecipient(event.target.value)} />
            <FieldDescription>{replyId === "new" ? "Prefilled from the enquiry email or customer record. You can change it before sending." : "Replies go to the original email's Reply-To address, or its sender."}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-subject`}>Subject</FieldLabel>
            <Input id={`${id}-subject`} required maxLength={998} value={subject} readOnly={replyId !== "new"} disabled={pending || attempted || replyLoading} onChange={(event) => setSubject(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-message`}>Message</FieldLabel>
            <Textarea id={`${id}-message`} required maxLength={10000} rows={10} value={message} disabled={pending || attempted} onChange={(event) => setMessage(event.target.value)} />
          </Field>
          {canScheduleFollowup && <Field>
            <FieldLabel htmlFor={`${id}-followup`}>Remind me to follow up</FieldLabel>
            <Select value={followupChoice} onValueChange={(value) => setFollowupChoice(value as FollowupChoice)} disabled={pending || attempted}>
              <SelectTrigger id={`${id}-followup`}><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup>
                <SelectItem value="1">Tomorrow at 10:00 AM IST</SelectItem>
                <SelectItem value="3">In 3 days at 10:00 AM IST</SelectItem>
                <SelectItem value="7">In a week at 10:00 AM IST</SelectItem>
                <SelectItem value="custom">Choose a date</SelectItem>
                <SelectItem value="none">No new reminder</SelectItem>
              </SelectGroup></SelectContent>
            </Select>
            <FieldDescription>Scheduled only after a successful send. Earlier pending follow-ups stay in place.</FieldDescription>
          </Field>}
          {followupChoice === "custom" && <Field>
            <FieldLabel htmlFor={`${id}-followup-date`}>Follow-up date</FieldLabel>
            <Input id={`${id}-followup-date`} type="date" required min={istDateInput()} value={customFollowupDate} disabled={pending || attempted} onChange={(event) => setCustomFollowupDate(event.target.value)} />
            <FieldDescription>Your reminder will be set for 10:00 AM IST.</FieldDescription>
          </Field>}
        </FieldGroup>
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">Preview message and signature</summary>
          <iframe title="Quotation email preview" sandbox="" className="mt-3 h-96 w-full rounded bg-white" srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'"></head><body style="padding:12px;margin:0">${quotationMessageHtml(message)}</body></html>`} />
        </details>
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
          <Button type="submit" disabled={!canSend || pending || attempted || replyLoading || !replyReady}>
            {pending ? <><Loader2 data-icon="inline-start" className="animate-spin" />Sending…</> : <><Mail data-icon="inline-start" />{followupChoice !== "none" ? replyId === "new" ? "Send & schedule follow-up" : "Reply & schedule follow-up" : replyId === "new" ? "Send with PDF" : "Reply with PDF"}</>}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
