"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Download, ExternalLink, File, Mail, Paperclip, RefreshCw, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { getGmailConversationAction, updateGmailMessageAction, type GmailConversation } from "@/lib/actions/dashboard/gmail/messageActions";
import { cn } from "@/lib/utils";
import { GmailSalesLinksPanel } from "./GmailSalesLinksPanel";
import { GmailPdfOrderImport } from "./GmailPdfOrderImport";
import { attachmentUrl, fileSize, InboxSelect, mailDate } from "./GmailInboxControls";

function ConversationMessage({ message, id, initiallyOpen, onChanged }: { message: GmailConversation["messages"][number]; id: string; initiallyOpen: boolean; onChanged: () => void }) {
  const [formatted, setFormatted] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  return <details open={initiallyOpen} className="border-b last:border-b-0">
    <summary className="cursor-pointer px-4 py-4 text-sm marker:text-muted-foreground sm:px-6"><span className="break-all font-medium">{message.sender}</span><time dateTime={message.receivedAt} className="ml-3 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{mailDate(message.receivedAt)} IST</time>{message.hasAttachments && <Paperclip className="ml-2 inline size-3.5" aria-label="Has files" />}</summary>
    <div className="flex flex-col gap-4 px-4 pb-5 sm:px-6">
      <div className="flex flex-col gap-1 text-xs text-muted-foreground"><p className="break-all">To: {message.to || "—"}</p>{message.cc && <p className="break-all">Cc: {message.cc}</p>}</div>
      {message.bodyDocument && <div><Button size="sm" variant="ghost" onClick={() => setFormatted(value => !value)}>{formatted ? "Show plain text" : "Show formatted message"}</Button></div>}
      {formatted ? <iframe title={`Formatted email: ${message.subject}`} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={message.bodyDocument} className="h-[440px] w-full rounded-md border bg-white" /> : <div className="whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">{message.bodyText || "This message has no readable text. Check its files or open the original in Gmail."}</div>}
      {message.attachments.length > 0 && <section aria-label="Email files" className="flex flex-col gap-2"><h3 className="text-sm font-medium">Files ({message.attachments.length})</h3><ul className="divide-y rounded-lg border">{message.attachments.map(file => <li key={file.partId} className="flex flex-wrap items-center gap-2 p-3"><File className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-all text-sm font-medium">{file.filename}</p><p className="text-xs text-muted-foreground">{fileSize(file.size)}</p></div><div className="flex flex-wrap gap-1">{(file.mimeType === "application/pdf" || file.filename.toLowerCase().endsWith(".pdf")) && <GmailPdfOrderImport id={id} messageId={message.messageId} partId={file.partId} filename={file.filename} onCreated={onChanged} />}{file.previewable && <Button size="sm" variant="ghost" onClick={() => setPreview(attachmentUrl(id, message.messageId, file.partId, true))}>View</Button>}<Button asChild size="sm" variant="outline"><a href={attachmentUrl(id, message.messageId, file.partId)} target="_blank" rel="noopener noreferrer"><Download data-icon="inline-start" />Download</a></Button></div></li>)}</ul></section>}
      {preview && <section aria-label="File preview" className="flex flex-col gap-2"><div className="flex items-center justify-between"><h3 className="text-sm font-medium">File preview</h3><Button variant="ghost" size="icon-sm" aria-label="Close file preview" onClick={() => setPreview(null)}><X /></Button></div><iframe title="Email attachment preview" src={preview} referrerPolicy="no-referrer" className="h-[560px] w-full rounded-md border bg-white" /><p className="text-xs text-muted-foreground">If your browser cannot display this file, use Download.</p></section>}
    </div>
  </details>;
}

export function GmailConversationPane({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const [data, setData] = useState<GmailConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [revision, setRevision] = useState(0);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let active = true;
    getGmailConversationAction(id, undefined, revision > 0).then(result => { if (active) { setData(result); setNote(result.internalNote); setError(null); onChanged(); } }).catch(() => { if (active) setError("Could not open this conversation. Fetch mail and try again, or reconnect Gmail if its access has expired."); });
    return () => { active = false; };
  }, [id, revision, onChanged]);

  const update = (patch: Parameters<typeof updateGmailMessageAction>[1]) => startTransition(async () => {
    try { await updateGmailMessageAction(id, patch); setData(previous => previous ? { ...previous, ...patch } : previous); onChanged(); if (patch.internalNote !== undefined) toast.success("Internal note saved."); }
    catch { toast.error("Could not save this change. Please try again."); }
  });
  if (error) return <div className="flex flex-col items-start gap-3 p-6"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" size="sm" onClick={() => setRevision(value => value + 1)}>Try again</Button><Button variant="ghost" size="sm" onClick={onBack}>Back to inbox</Button></div>;
  if (!data) return <div className="flex flex-col gap-4 p-6"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-20 w-full" /><Skeleton className="h-64 w-full" /></div>;
  const gmailUrl = `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(data.email)}#all/${encodeURIComponent(data.threadId)}`;
  return <article className="flex min-w-0 flex-col">
    <header className="flex flex-col gap-3 p-4 sm:p-6"><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="ghost" className="lg:hidden" onClick={onBack}><ArrowLeft data-icon="inline-start" />Inbox</Button><div className="ml-auto flex flex-wrap items-center gap-2"><Button variant="ghost" size="icon-sm" disabled={pending} aria-label={data.starred ? "Unstar email" : "Star email"} aria-pressed={data.starred} onClick={() => update({ starred: !data.starred })}><Star className={cn(data.starred && "fill-current")} /></Button><Button variant="ghost" size="icon-sm" aria-label="Reload conversation" disabled={pending} onClick={() => setRevision(value => value + 1)}><RefreshCw /></Button><div className="w-32"><InboxSelect label="Email work status" value={data.status} onChange={value => update({ status: value as GmailConversation["status"] })} options={[["NEW", "New"], ["IN_PROGRESS", "Working"], ["DONE", "Done"]]} /></div><Button size="sm" variant="ghost" disabled={pending} onClick={() => update({ read: false })}><Mail data-icon="inline-start" />Mark unread</Button><Button asChild size="sm" variant="outline"><a href={gmailUrl} target="_blank" rel="noopener noreferrer">Gmail<ExternalLink data-icon="inline-end" /></a></Button></div></div><h2 className="break-words text-xl font-semibold leading-8 [overflow-wrap:anywhere]">{data.subject}</h2></header>
    <GmailSalesLinksPanel id={id} onChanged={onChanged} />
    {data.warning && <p role="status" className="border-b bg-muted/30 px-4 py-3 text-sm leading-6 sm:px-6">{data.warning}</p>}
    <details className="border-b px-4 py-3 sm:px-6"><summary className="cursor-pointer text-sm font-medium">Internal note{data.internalNote ? " · saved" : ""}</summary><div className="mt-3 flex flex-col gap-2"><Field><FieldLabel className="sr-only" htmlFor={`email-note-${id}`}>Internal note</FieldLabel><Textarea id={`email-note-${id}`} value={note} onChange={event => setNote(event.target.value)} maxLength={10_000} rows={3} placeholder="Add customer context, a call summary, or the next action…" /><FieldDescription>Private to your dashboard account. This note is never sent to the customer.</FieldDescription></Field><div><Button size="sm" variant="outline" disabled={pending || note === data.internalNote} onClick={() => update({ internalNote: note })}>Save note</Button></div></div></details>
    {data.omitted > 0 && <div className="px-4 py-3 sm:px-6"><Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
      try { const earlier = await getGmailConversationAction(id, data.messages[0]?.messageId); setData(previous => previous ? { ...previous, messages: [...new Map([...earlier.messages, ...previous.messages].map(message => [message.messageId, message])).values()], omitted: earlier.warning ? previous.omitted : earlier.omitted, warning: earlier.warning || previous.warning } : previous); }
      catch { toast.error("Earlier messages could not be loaded. Try again."); }
    })}>Load earlier messages ({data.omitted})</Button></div>}
    {data.messages.map((message, index) => <ConversationMessage key={message.messageId} message={message} id={id} initiallyOpen={index === data.messages.length - 1} onChanged={onChanged} />)}
  </article>;
}
