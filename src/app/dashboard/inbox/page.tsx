import { GmailInbox } from "@/components/dashboard/gmail/GmailInbox";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gmail Inbox Alerts" };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ gmail?: string }> }) {
  const { gmail } = await searchParams;
  return <GmailInbox outcome={gmail} />;
}
