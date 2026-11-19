import type { GmailNotification } from "@prisma/client";
import { gmailGet, isGmailRateLimit } from "./google";
import { emailDocument, parseGmailMessage, type GmailMessage, type ParsedGmailMessage } from "./mime";

export type GmailConversationContent = { warning: string | null; omitted: number; messages: (ParsedGmailMessage & { bodyDocument: string })[] };

export async function getGmailConversationContent(accessToken: string, notification: GmailNotification, beforeMessageId?: string, saved?: GmailConversationContent): Promise<GmailConversationContent> {
  let thread: { messages?: GmailMessage[] };
  try {
    thread = await gmailGet<{ messages?: GmailMessage[] }>(accessToken, `threads/${encodeURIComponent(notification.threadId)}?format=full`);
  } catch (error) {
    if (!isGmailRateLimit(error) || !notification.contentIndexedAt) throw error;
    if (saved) return { ...saved, warning: "Gmail reached its temporary request limit. Showing the saved conversation. Reload in about a minute to check for newer replies." };
    return {
      omitted: 0,
      warning: "Gmail reached its temporary request limit. Showing the saved message. Reload in about a minute for the full conversation and files, or open Gmail.",
      messages: [{ messageId: notification.messageId, threadId: notification.threadId, subject: notification.subject, sender: notification.sender,
        to: "", cc: "", receivedAt: notification.receivedAt.toISOString(), snippet: notification.snippet || "", bodyText: notification.bodyText || "",
        bodyHtml: "", bodyDocument: "", attachments: [], hasAttachments: notification.hasAttachments }],
    };
  }
  const all = thread.messages ?? [];
  const before = beforeMessageId ? all.findIndex(message => message.id === beforeMessageId) : all.length;
  if (before < 0) throw new Error("Earlier message not found. Reload the conversation.");
  return {
    warning: null,
    omitted: Math.max(0, before - 20),
    messages: all.slice(Math.max(0, before - 20), before).map(parseGmailMessage).map(message => ({ ...message, bodyDocument: message.bodyHtml ? emailDocument(message.bodyHtml) : "" })),
  };
}
