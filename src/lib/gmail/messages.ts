import { gmailGet } from "./google";

type MessageList = { messages?: { id: string }[]; nextPageToken?: string };
type GmailMessage = {
  id: string; threadId: string; internalDate: string;
  payload?: { headers?: { name: string; value: string }[] };
};

export async function getMatchingGmailMessages(accessToken: string, query: string) {
  const ids = new Set<string>();
  let pageToken: string | undefined;
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({ q: query, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const result = await gmailGet<MessageList>(accessToken, `messages?${params}`);
    for (const message of result.messages ?? []) ids.add(message.id);
    pageToken = result.nextPageToken;
    if (!pageToken) break;
  }
  if (pageToken) throw new Error("too_many_messages");

  const messages: GmailMessage[] = [];
  const allIds = [...ids];
  // Bound concurrency to avoid flooding Gmail for an initial import.
  for (let index = 0; index < allIds.length; index += 10) {
    messages.push(...await Promise.all(allIds.slice(index, index + 10).map((id) => {
      const params = new URLSearchParams({ format: "metadata" });
      params.append("metadataHeaders", "Subject");
      params.append("metadataHeaders", "From");
      return gmailGet<GmailMessage>(accessToken, `messages/${encodeURIComponent(id)}?${params}`);
    })));
  }
  return messages.map((message) => {
    const header = (name: string) => message.payload?.headers?.find((item) => item.name.toLowerCase() === name)?.value;
    return {
      messageId: message.id, threadId: message.threadId,
      subject: (header("subject") || "(No subject)").slice(0, 1000),
      sender: (header("from") || "Unknown sender").slice(0, 1000),
      receivedAt: new Date(Number(message.internalDate)),
    };
  });
}
