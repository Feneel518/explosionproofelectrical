"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { GmailPdfAttachment } from "@/lib/gmail/attachments";

async function checkResponse(response: Response) {
  if (response.ok && !response.redirected) return response;
  const body = await response.json().catch(() => null);
  throw new Error(body?.error || "Could not load the PDF. Refresh the page and try again.");
}

function PdfDocument({ endpoint, attachment }: { endpoint: string; attachment: GmailPdfAttachment }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; url?: string; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    fetch(`${endpoint}?${new URLSearchParams({ partId: attachment.partId })}`, { cache: "no-store", signal: controller.signal })
      .then(checkResponse).then(async response => {
        if (response.headers.get("Content-Type")?.split(";")[0] !== "application/pdf") throw new Error("Could not load the PDF. Refresh the page and try again.");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setResult({ attempt, url: objectUrl });
      }).catch(error => {
        if (!controller.signal.aborted) setResult({ attempt, error: error instanceof Error ? error.message : "Could not load the PDF. Please try again." });
      });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [endpoint, attachment.partId, attempt]);
  const current = result?.attempt === attempt ? result : null;
  if (current?.error) return <div className="flex flex-1 flex-col items-start justify-center gap-3 p-4"><p role="alert" className="text-sm text-foreground">{current.error}</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Try again</Button></div>;
  if (!current?.url) return <p role="status" className="p-4 text-sm text-muted-foreground">Loading PDF…</p>;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="min-w-0 break-all text-sm font-medium">{attachment.filename}</p>
      <Button asChild variant="outline" size="sm"><a href={current.url} target="_blank" rel="noopener noreferrer">Open PDF in new tab<ExternalLink aria-hidden="true" data-icon="inline-end" /></a></Button>
    </div>
    <iframe src={current.url} title={`PDF preview: ${attachment.filename}`} className="min-h-0 w-full flex-1 rounded-md border bg-muted" />
    <p className="text-xs text-muted-foreground">If your browser cannot display the preview, use Open PDF in new tab.</p>
  </>;
}

function PdfAttachments({ endpoint }: { endpoint: string }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; attachments?: GmailPdfAttachment[]; error?: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(checkResponse).then(response => response.json())
      .then(data => { if (!controller.signal.aborted) setResult({ attempt, attachments: data.attachments }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ attempt, error: error instanceof Error ? error.message : "Could not load attachments. Please try again." }); });
    return () => controller.abort();
  }, [endpoint, attempt]);
  const current = result?.attempt === attempt ? result : null;
  const attachment = current?.attachments?.find(item => item.partId === selected) ?? current?.attachments?.[0];
  if (current?.error) return <div className="flex flex-col items-start gap-3 py-6"><p role="alert" className="text-sm text-foreground">{current.error}</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Try again</Button></div>;
  if (!current?.attachments) return <p role="status" className="py-6 text-sm text-muted-foreground">Checking this email for PDF attachments…</p>;
  if (!attachment) return <p role="status" className="py-6 text-sm text-muted-foreground">This email has no PDF attachments. Use Open in Gmail to check other files or links in the message.</p>;
  return <div className="flex min-h-0 flex-1 flex-col gap-3">
    {current.attachments.length > 1 && <div className="flex flex-col gap-2"><label htmlFor="gmail-pdf-file" className="text-sm font-medium">PDF attachment</label><select id="gmail-pdf-file" value={attachment.partId} onChange={event => setSelected(event.target.value)} className="h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">{current.attachments.map(item => <option key={item.partId} value={item.partId}>{item.filename}</option>)}</select></div>}
    <PdfDocument key={attachment.partId} endpoint={endpoint} attachment={attachment} />
  </div>;
}

export function GmailPdfAttachments({ notificationId, subject, gmailUrl }: { notificationId: string; subject: string; gmailUrl: string }) {
  return <Dialog>
    <DialogTrigger asChild><Button size="sm" variant="outline"><FileText aria-hidden="true" data-icon="inline-start" />View PDFs</Button></DialogTrigger>
    <DialogContent className="flex h-[90dvh] min-w-0 flex-col overflow-hidden sm:max-w-6xl">
      <DialogHeader className="min-w-0 pr-6 text-left"><DialogTitle>PDF attachments</DialogTitle><DialogDescription className="break-words [overflow-wrap:anywhere] line-clamp-2">{subject}</DialogDescription></DialogHeader>
      <PdfAttachments endpoint={`/api/gmail/notifications/${encodeURIComponent(notificationId)}/attachments`} />
      <div className="flex justify-end"><Button asChild variant="ghost" size="sm"><a href={gmailUrl} target="_blank" rel="noopener noreferrer">Open in Gmail<ExternalLink aria-hidden="true" data-icon="inline-end" /></a></Button></div>
    </DialogContent>
  </Dialog>;
}
