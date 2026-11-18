"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createQuotationFromEnquiryAction, retryEnquiryNotificationAction } from "@/lib/enquiries/actions";

export function EnquiryActions({ id, quotationId, readOnly = false }: { id: string; quotationId: string | null; readOnly?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function quote() {
    setBusy(true);
    try { const result = await createQuotationFromEnquiryAction(id); router.push(`/dashboard/sales/quotations/${result.id}/edit`); }
    catch { toast.error("Could not create a quotation. Check your access and try again."); }
    finally { setBusy(false); }
  }
  async function retry() {
    setBusy(true);
    try {
      const result = await retryEnquiryNotificationAction(id);
      if (result.status === "SENT") toast.success("Notification delivered");
      else if (result.status === "MISSING") toast.error("No notification is queued for this enquiry.");
      else toast.info("Email is still pending. The enquiry is saved; check the mail service before retrying.");
      router.refresh();
    }
    catch { toast.error("Could not retry the notification. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-wrap gap-2">{quotationId ? <Button size="sm" asChild><Link href={`/dashboard/sales/quotations/${quotationId}`}>Open quotation</Link></Button> : <Button size="sm" disabled={busy || readOnly} onClick={quote}>Review & create quotation</Button>}<Button size="sm" variant="outline" disabled={busy || readOnly} onClick={retry}>{busy ? "Working..." : "Retry notification"}</Button></div>;
}
