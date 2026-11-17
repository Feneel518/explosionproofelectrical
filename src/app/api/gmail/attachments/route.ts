import { requireAuth } from "@/lib/check/requireAuth";
import { ownedGmailMessage } from "@/lib/gmail/access";
import { gmailGet } from "@/lib/gmail/google";
import { flattenParts } from "@/lib/gmail/mime";
import { z } from "zod";
import { prisma } from "@/lib/prisma/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { user } = await requireAuth();
  const query = new URL(request.url).searchParams;
  const parsed = z.object({ id: z.string().uuid(), messageId: z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/), partId: z.string().regex(/^[\d.]{1,200}$/) }).safeParse(Object.fromEntries(query));
  if (!parsed.success) return new Response("Invalid attachment request.", { status: 400 });
  try {
    const { message, accessToken, connectedAt } = await ownedGmailMessage(user.id, parsed.data.id, parsed.data.messageId);
    const part = flattenParts(message.payload).find(p => (p.partId || "0") === parsed.data.partId && (!!p.filename || !!p.body?.attachmentId));
    if (!part?.body) return new Response("Attachment not found.", { status: 404 });
    const body = part.body.attachmentId ? await gmailGet<{ data: string }>(accessToken, `messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(part.body.attachmentId)}`) : part.body;
    if (!await prisma.gmailConnection.count({ where: { userId: user.id, connectedAt } })) return new Response("Mailbox changed. Reload the inbox.", { status: 409 });
    if (!body.data) return new Response("This attachment is empty.", { status: 404 });
    const bytes = Buffer.from(body.data, "base64url");
    if (bytes.length > 35 * 1024 * 1024) return new Response("Open this large attachment in Gmail.", { status: 413 });
    const filename = (part.filename || "Attachment").replace(/[\r\n"\\/\x00-\x1f]/g, "_").slice(0, 180);
    const mime = part.mimeType || "application/octet-stream";
    const preview = query.get("preview") === "1" && ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp", "text/plain"].includes(mime);
    // Stream the response so normal email attachments are not limited to a JSON/action payload.
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) {
      if (offset >= bytes.length) { controller.close(); return; }
      controller.enqueue(new Uint8Array(bytes.subarray(offset, offset + 64 * 1024))); offset += 64 * 1024;
    } });
    return new Response(stream, { headers: {
      "Content-Type": preview ? mime : "application/octet-stream",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; object-src 'none'; frame-ancestors 'self'",
    } });
  } catch {
    return new Response("Could not load this attachment. Reconnect Gmail if access has expired.", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
