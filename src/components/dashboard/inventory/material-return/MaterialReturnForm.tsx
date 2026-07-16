"use client";

import React from "react";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAndFinalizeMaterialReturnAction, getReturnableMaterialIssueAction } from "@/lib/actions/dashboard/inventory/material-returns/materialReturnActions";

type IssueOption = { id: string; label: string; employee: string };
type LoadedIssue = {
  id: string;
  issueNo: number;
  issueFy: string;
  issueDate: Date;
  issuedToNameSnapshot: string;
  issuedToEmployeeId: string | null;
  department: string | null;
  purpose: string | null;
  items: Array<{
    id: string;
    rawMaterialId: string | null;
    title: string;
    unit: string | null;
    qtyIssued: number;
    qtyReturned: number;
    qtyPending: number;
  }>;
};

export default function MaterialReturnForm({ issues, initialIssueId }: { issues: IssueOption[]; initialIssueId?: string }) {
  const router = useRouter();
  const [issue, setIssue] = React.useState<LoadedIssue | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [receivedByName, setReceivedByName] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [rows, setRows] = React.useState<Record<string, { qty: number; condition: "REUSABLE" | "DAMAGED" | "SCRAP"; remarks: string }>>({});

  React.useEffect(() => {
    if (initialIssueId && issues.some((row) => row.id === initialIssueId)) void selectIssue(initialIssueId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIssueId]);

  async function selectIssue(id: string) {
    setLoading(true);
    const result = await getReturnableMaterialIssueAction(id);
    setLoading(false);
    if (!result.ok) return toast.error(result.message);
    setIssue(result.issue as LoadedIssue);
    setRows(Object.fromEntries(result.issue.items.map((item) => [item.id, { qty: 0, condition: "REUSABLE" as const, remarks: "" }])));
  }

  async function submit() {
    if (!issue) return;
    setSubmitting(true);
    const result = await createAndFinalizeMaterialReturnAction({
      materialIssueId: issue.id,
      returnDate: new Date().toISOString(),
      receivedByName,
      remarks,
      items: issue.items.map((item) => ({ materialIssueItemId: item.id, ...rows[item.id] })),
    });
    setSubmitting(false);
    if (!result.ok) return toast.error(result.message);
    toast.success(result.message);
    router.push("/dashboard/inventory/returns");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-5">
        <label className="mb-2 block text-sm font-medium">Original Material Issue</label>
        <Select defaultValue={initialIssueId} onValueChange={selectIssue}>
          <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "Select finalized issue"} /></SelectTrigger>
          <SelectContent>{issues.map((row) => <SelectItem key={row.id} value={row.id}>{row.label} · {row.employee}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {issue ? (
        <>
          <div className="rounded-xl border p-5 text-sm"><span className="font-medium">Returned by:</span> {issue.issuedToNameSnapshot}{issue.department ? ` · ${issue.department}` : ""}</div>
          <div className="space-y-3">
            {issue.items.map((item) => {
              const row = rows[item.id];
              return (
                <div key={item.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_150px_180px_1fr]">
                  <div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">Issued {item.qtyIssued} · Returned {item.qtyReturned} · Pending {item.qtyPending} {item.unit}</p></div>
                  <Input type="number" min={0} max={item.qtyPending} step="0.001" value={row?.qty ?? 0} onChange={(event) => setRows((prev) => ({ ...prev, [item.id]: { ...prev[item.id], qty: Math.min(item.qtyPending, Math.max(0, Number(event.target.value))) } }))} />
                  <Select value={row?.condition ?? "REUSABLE"} onValueChange={(value: "REUSABLE" | "DAMAGED" | "SCRAP") => setRows((prev) => ({ ...prev, [item.id]: { ...prev[item.id], condition: value } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REUSABLE">Reusable</SelectItem><SelectItem value="DAMAGED">Damaged</SelectItem><SelectItem value="SCRAP">Scrap</SelectItem></SelectContent>
                  </Select>
                  <Input placeholder="Item remarks" value={row?.remarks ?? ""} onChange={(event) => setRows((prev) => ({ ...prev, [item.id]: { ...prev[item.id], remarks: event.target.value } }))} />
                </div>
              );
            })}
          </div>
          <div className="grid gap-4 rounded-xl border p-5 md:grid-cols-2">
            <Input placeholder="Received by (storekeeper)" value={receivedByName} onChange={(event) => setReceivedByName(event.target.value)} />
            <Textarea placeholder="Return remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
          </div>
          <div className="flex justify-end"><Button onClick={submit} disabled={submitting}>{submitting ? "Finalizing..." : "Finalize Return"}</Button></div>
        </>
      ) : null}
    </div>
  );
}
