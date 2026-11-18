import { z } from "zod";
import { gmailGet } from "./google";
import { header, senderIdentity, type GmailMessage } from "./mime";

export type QuotationReply = { threadId: string; inReplyTo: string; references: string[]; subject: string; recipient: string };
const messageIdPattern = /<[^<>\s\x00-\x1f]+@[^<>\s\x00-\x1f]+>/g;

export function quotationReplyFromMessage(message: GmailMessage, expectedThreadId: string): QuotationReply {
  if (message.threadId !== expectedThreadId) throw new Error("The original conversation changed. Please select it again.");
  const messageId = header(message.payload, "message-id").trim();
  if (!/^<[^<>\s\x00-\x1f]+@[^<>\s\x00-\x1f]+>$/.test(messageId)) throw new Error("The original email has no valid message identifier. Send a new email instead.");
  const subject = header(message.payload, "subject").trim();
  if (/[\r\n\x00-\x1f]/.test(subject) || subject.length > 998) throw new Error("The original email has an unsupported subject. Send a new email instead.");
  const address = header(message.payload, "reply-to") || header(message.payload, "from");
  const recipient = senderIdentity(address).email;
  if (!z.email().safeParse(recipient).success) throw new Error("The original email has no valid reply address.");
  return { threadId: message.threadId, inReplyTo: messageId,
    references: [...new Set([...(header(message.payload, "references").match(messageIdPattern) || []).slice(-20), messageId])],
    subject: subject || "", recipient };
}

export async function getQuotationReply(accessToken: string, messageId: string, threadId: string) {
  const headers = ["Message-ID", "References", "Subject", "From", "Reply-To"].map((name) => `metadataHeaders=${encodeURIComponent(name)}`).join("&");
  const message = await gmailGet<GmailMessage>(accessToken, `messages/${encodeURIComponent(messageId)}?format=metadata&${headers}`);
  return quotationReplyFromMessage(message, threadId);
}
