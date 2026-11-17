import { GmailInbox } from "@/components/dashboard/gmail/GmailInbox";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gmail Sales Inbox" };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ gmail?: string; message?: string }> }) {
  const { gmail, message } = await searchParams;
  return <GmailInbox key={message || "inbox"} outcome={gmail} initialMessage={message} />;
}
