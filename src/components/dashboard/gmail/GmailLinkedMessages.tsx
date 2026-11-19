import Link from "next/link";
import { Mail, Paperclip } from "lucide-react";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export async function GmailLinkedMessages({ kind, recordId }: { kind: "QUOTATION" | "ORDER"; recordId: string }) {
  const { user } = await requireAuth();
  const links = await prisma.gmailThreadLink.findMany({
    where: { userId: user.id, ...(kind === "QUOTATION" ? { quotationId: recordId } : { salesOrderId: recordId }) },
    select: { threadId: true },
  });
  if (!links.length) return null;
  const messages = await prisma.gmailNotification.findMany({
    where: { userId: user.id, threadId: { in: links.map(link => link.threadId) } },
    orderBy: { receivedAt: "desc" }, take: 10,
    select: { id: true, subject: true, sender: true, hasAttachments: true },
  });
  if (!messages.length) return null;
  return <section aria-label="Linked customer emails" className="m-4 flex flex-col gap-2 rounded-lg border bg-muted/20 p-4 sm:m-6">
    <h2 className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-4" aria-hidden="true" />Customer emails</h2>
    <p className="text-xs text-muted-foreground">Open the original requirement, conversation and files in your sales inbox.</p>
    <ul className="flex flex-col gap-2">{messages.map(message => <li key={message.id}><Link href={`/dashboard/inbox?message=${message.id}`} className="flex min-w-0 items-center gap-2 text-sm underline-offset-4 hover:underline"><span className="min-w-0 truncate">{message.subject}<span className="ml-2 text-muted-foreground">{message.sender}</span></span>{message.hasAttachments && <Paperclip className="size-3.5 shrink-0" aria-label="Has files" />}</Link></li>)}</ul>
  </section>;
}
