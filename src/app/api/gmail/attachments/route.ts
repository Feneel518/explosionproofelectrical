import { requireAuth } from "@/lib/check/requireAuth";
import { getGmailAttachment, gmailAttachmentRequest } from "@/lib/gmail/attachments";
import { isGmailRateLimit } from "@/lib/gmail/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { user } = await requireAuth();
  const query = new URL(request.url).searchParams;
  const parsed = gmailAttachmentRequest.safeParse(Object.fromEntries(query));
  if (!parsed.success) return new Response("Invalid attachment request.", { status: 400 });
  try {
    const { bytes, filename, mimeType: mime } = await getGmailAttachment(user.id, parsed.data);
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
  } catch (error) {
    if (isGmailRateLimit(error)) return new Response(error.message, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
    return new Response("Could not load this attachment. Reconnect Gmail if access has expired.", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
