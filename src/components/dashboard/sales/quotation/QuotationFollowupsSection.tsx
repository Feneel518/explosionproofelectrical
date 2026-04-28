"use client";

import * as React from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Trash2,
  Pencil,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { deleteQuotationFollowupAction } from "@/lib/actions/dashboard/sales/quotation/deleteQuotationFollowupAction";
import { toast } from "sonner";
import ScheduleFollowupDialog from "./ScheduleFollowupDialog";
import CompleteFollowupDialog from "./CompleteFollowupDialog";
import RescheduleFollowupDialog from "./RescheduleFollowupDialog";

type Props = {
  quotationId: string;
  followups: any[];
  nextFollowupAt?: string | Date | null;
};

function fmtDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function outcomeBadge(outcome?: string | null) {
  if (!outcome) return <Badge variant="secondary">Pending</Badge>;
  return <Badge variant="outline">{outcome}</Badge>;
}

export default function QuotationFollowupsSection({
  quotationId,
  followups,
  nextFollowupAt,
}: Props) {
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [completeId, setCompleteId] = React.useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const completeItem = followups.find((f) => f.id === completeId) ?? null;
  const rescheduleItem = followups.find((f) => f.id === rescheduleId) ?? null;

  async function onDelete(followupId: string) {
    try {
      setDeletingId(followupId);
      const res = await deleteQuotationFollowupAction({ followupId });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Follow-up deleted");
      window.dispatchEvent(new Event("quotation-followups-changed"));
    } finally {
      setDeletingId(null);
    }
  }

  const pending = followups.filter((f) => !f.doneAt);
  const completed = followups.filter((f) => !!f.doneAt);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Follow-ups</CardTitle>
            <p className="text-sm text-muted-foreground">
              Schedule, complete, reschedule and track quotation follow-ups.
            </p>
          </div>

          <Button type="button" onClick={() => setScheduleOpen(true)}>
            <CalendarClock className="mr-2 h-4 w-4" />
            Schedule Follow-up
          </Button>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Next Follow-up</div>
            <div className="mt-1 text-lg font-semibold">
              {fmtDate(nextFollowupAt)}
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="mt-1 text-lg font-semibold">{pending.length}</div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="mt-1 text-lg font-semibold">{completed.length}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Follow-ups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No pending follow-ups.
            </div>
          ) : (
            pending.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {fmtDate(f.scheduledAt)}
                    </span>
                    {outcomeBadge(f.outcome)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {f.note || "No note added"}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created by:{" "}
                    {f.createdBy?.name || f.createdBy?.email || "Unknown"}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => setCompleteId(f.id)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRescheduleId(f.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Reschedule
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(f.id)}
                    disabled={deletingId === f.id}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingId === f.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Follow-ups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completed.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No completed follow-ups yet.
            </div>
          ) : (
            completed.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border p-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{f.outcome || "Done"}</Badge>
                  <span className="text-sm">
                    Scheduled:{" "}
                    <span className="font-medium">
                      {fmtDate(f.scheduledAt)}
                    </span>
                  </span>
                  <span className="text-sm">
                    Done:{" "}
                    <span className="font-medium">{fmtDate(f.doneAt)}</span>
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {f.note || "No note added"}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ScheduleFollowupDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        quotationId={quotationId}
      />

      <CompleteFollowupDialog
        open={!!completeItem}
        onOpenChange={(v) => !v && setCompleteId(null)}
        followup={completeItem}
      />

      <RescheduleFollowupDialog
        open={!!rescheduleItem}
        onOpenChange={(v) => !v && setRescheduleId(null)}
        followup={rescheduleItem}
      />
    </div>
  );
}
