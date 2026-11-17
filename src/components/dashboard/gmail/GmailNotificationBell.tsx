"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useGmailNotifications } from "./GmailNotificationsProvider";

export function GmailNotificationBell() {
  const { data, loading, error } = useGmailNotifications();
  const count = data?.unreadCount ?? 0;
  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" aria-label={`Gmail notifications${count ? `, ${count} unread` : ""}${error ? ", sync unavailable" : ""}`}>
        <Bell aria-hidden="true" />
        {count > 0 && <Badge variant="secondary">{count > 99 ? "99+" : count}</Badge>}
        {error && <span aria-hidden="true">!</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
      <PopoverHeader><PopoverTitle>Gmail notifications</PopoverTitle></PopoverHeader>
      <div className="mt-3 flex flex-col gap-3">
        {loading ? <p className="text-sm text-muted-foreground">Checking your inbox…</p>
          : error ? <p role="status" className="text-sm text-destructive">{error}</p>
          : !data?.connection ? <p className="text-sm text-muted-foreground">Connect Gmail to see incoming orders and inquiries here.</p>
          : count === 0 ? <p className="text-sm text-muted-foreground">You’re all caught up.</p>
          : data.notifications.filter((item) => !item.read).slice(0, 3).map((item) => <Link key={item.id} href={`/dashboard/inbox?message=${item.id}`} className="flex min-w-0 flex-col gap-1 text-sm hover:underline">
            <span className="truncate font-medium">{item.subject}</span>
            <span className="truncate text-muted-foreground">{item.sender}</span>
          </Link>)}
        <Button asChild variant="outline" size="sm"><Link href="/dashboard/inbox">Open sales inbox</Link></Button>
      </div>
    </PopoverContent>
  </Popover>;
}
