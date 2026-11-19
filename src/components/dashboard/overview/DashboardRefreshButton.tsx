"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => router.refresh())}>
      <RefreshCw data-icon="inline-start" />
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
