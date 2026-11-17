import sanitizeHtml from "sanitize-html";

export type GmailPart = {
  partId?: string; mimeType?: string; filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; attachmentId?: string; size?: number };
  parts?: GmailPart[];
};
export type GmailMessage = { id: string; threadId: string; internalDate: string; snippet?: string; payload?: GmailPart };
export type MailAttachment = { partId: string; filename: string; mimeType: string; size: number; previewable: boolean };

export function header(part: GmailPart | undefined, name: string) {
  return part?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

export function flattenParts(part?: GmailPart): GmailPart[] {
  return part ? [part, ...(part.parts ?? []).flatMap(flattenParts)] : [];
}

export function decodePart(part: GmailPart) {
  if (!part.body?.data) return "";
  const bytes = Buffer.from(part.body.data, "base64url");
  const charset = header(part, "content-type").match(/charset=["']?([^\s;"']+)/i)?.[1] || "utf-8";
  try { return new TextDecoder(charset).decode(bytes); } catch { return bytes.toString("utf8"); }
}

export function safeEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "div", "span", "br", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6", "a", "hr"],
    allowedAttributes: { a: ["href", "target", "rel"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
    allowedSchemes: ["https", "http", "mailto"], allowProtocolRelative: false,
    transformTags: { a: (_tag, attrs) => ({ tagName: "a", attribs: { href: attrs.href || "", target: "_blank", rel: "noopener noreferrer" } }) },
  });
}

export function htmlToPlainText(html: string) {
  return sanitizeHtml(html.replace(/<\/(p|div|tr|li|h[1-6]|blockquote)>|<br\s*\/?\s*>/gi, "$&\n"), { allowedTags: [], allowedAttributes: {} })
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (all, code: string) => {
      const value = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : all;
    }).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, key: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[key] || "")
    .replace(/\n{3,}/g, "\n\n").trim();
}

export function parseGmailMessage(message: GmailMessage) {
  const parts = flattenParts(message.payload);
  const attachments: MailAttachment[] = parts.filter(p => !!p.filename || (!!p.body?.attachmentId && !["text/plain", "text/html"].includes(p.mimeType || "")))
    .map(p => ({ partId: p.partId || "0", filename: p.filename || "Attachment", mimeType: p.mimeType || "application/octet-stream", size: p.body?.size || 0,
      previewable: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain"].includes(p.mimeType || "") }));
  const plain = parts.filter(p => !p.filename && p.mimeType === "text/plain").map(decodePart).filter(Boolean).join("\n\n");
  const html = parts.filter(p => !p.filename && p.mimeType === "text/html").map(decodePart).filter(Boolean).join("\n");
  return {
    messageId: message.id, threadId: message.threadId,
    subject: (header(message.payload, "subject") || "(No subject)").slice(0, 1000),
    sender: (header(message.payload, "from") || "Unknown sender").slice(0, 1000),
    to: header(message.payload, "to").slice(0, 2000), cc: header(message.payload, "cc").slice(0, 2000),
    receivedAt: new Date(Number(message.internalDate)).toISOString(),
    snippet: (message.snippet || plain || htmlToPlainText(html)).slice(0, 1000),
    bodyText: (plain || htmlToPlainText(html)).slice(0, 50_000),
    bodyHtml: html ? safeEmailHtml(html.slice(0, 300_000)).slice(0, 80_000) : "", attachments,
    hasAttachments: attachments.length > 0,
  };
}

export type ParsedGmailMessage = ReturnType<typeof parseGmailMessage>;

export function emailDocument(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><style>body{font:14px/1.65 system-ui,sans-serif;color:#17212b;padding:16px;margin:0;overflow-wrap:anywhere}table{border-collapse:collapse;max-width:100%}td,th{padding:6px;border:1px solid #dce1e6}a{color:#16548f}pre{white-space:pre-wrap}blockquote{margin-left:0;padding-left:14px;border-left:1px solid #cbd5e1}</style></head><body>${safeEmailHtml(html)}</body></html>`;
}

export function senderIdentity(sender: string) {
  const email = sender.match(/<([^>]+)>/)?.[1] || sender.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || "";
  return { email: email.trim().toLowerCase(), name: sender.replace(/<[^>]*>/g, "").trim().replace(/^["']|["']$/g, "") || email };
}
