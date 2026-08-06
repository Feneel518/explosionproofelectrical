"use client";

import React from "react";
import { format } from "date-fns";
import { useRouter } from "nextjs-toploader/app";
import { CalendarIcon, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CastingCombobox } from "@/components/dashboard/global/CastingCombobox";
import { RawMaterialCombobox } from "@/components/dashboard/global/RawMaterialCombobox";
import { SupplierCombobox } from "@/components/dashboard/global/SupplierCombobox";
import { CastingSearchItem } from "@/lib/types/CastingSearchItem";
import { RawMaterialSearchItem } from "@/lib/types/RawMaterialSearchItem";
import { CastingJobDraftData } from "@/lib/actions/dashboard/manufacturing/casting-job/createDraftCastingJobAction";
import { finalizeCastingJobAction } from "@/lib/actions/dashboard/manufacturing/casting-job/finalizeCastingJobAction";
import { getRawMaterialIssueBalancesAction } from "@/lib/actions/dashboard/manufacturing/material-issue/getRawMaterialIssueBalancesAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { cn } from "@/lib/utils";
import { useCastingJobDraftAutosave } from "@/hooks/use-casting-job-draft-autosave";

function toDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

export default function CastingJobForm({
  castingJobId,
  jobNo,
  jobFy,
  initialDraft,
  initialDraftVersion,
  workers,
}: {
  castingJobId: string;
  jobNo: number;
  jobFy: string;
  initialDraft: CastingJobDraftData;
  initialDraftVersion: number;
  workers: Array<{ id: string; name: string; code: string; role: string }>;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<CastingJobDraftData>(initialDraft);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const hydratedRef = React.useRef(false);
  const [balanceByRawMaterialId, setBalanceByRawMaterialId] = React.useState<
    Record<string, number>
  >({});

  const documentNo = formatFinancialDocumentNumber(jobFy, jobNo);

  const autosave = useCastingJobDraftAutosave({
    castingJobId,
    initialVersion: initialDraftVersion,
    enabled: Boolean(castingJobId),
    getDraft: () => draft,
    debounceMs: 1200,
  });

  React.useEffect(() => {
    if (!castingJobId) return;

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    autosave.triggerSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  React.useEffect(() => {
    let cancelled = false;

    const ids = Array.from(
      new Set(
        (draft.items ?? [])
          .map((item) => item.inputRawMaterialId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    async function loadBalances() {
      if (ids.length === 0) {
        if (!cancelled) setBalanceByRawMaterialId({});
        return;
      }

      const res = await getRawMaterialIssueBalancesAction(ids);
      if (!res.ok || cancelled) return;

      const next: Record<string, number> = {};
      for (const row of res.balances) {
        next[row.rawMaterialId] = Number(row.qtyOnHand || 0);
      }
      if (!cancelled) setBalanceByRawMaterialId(next);
    }

    loadBalances();

    return () => {
      cancelled = true;
    };
  }, [draft.items]);

  const workerType =
    draft.header.workerType === "JOB_WORK"
      ? "JOB_WORK"
      : draft.header.workerType === "CONTRACT"
        ? "CONTRACT"
        : "IN_HOUSE";

  const saveIndicator = (() => {
    if (!castingJobId) return <Badge variant="secondary">Creating draft...</Badge>;

    if (autosave.status === "saving") {
      return <Badge variant="secondary">Saving...</Badge>;
    }

    if (autosave.status === "saved") {
      return (
        <Badge variant="outline">
          Saved {autosave.savedAt ? new Date(autosave.savedAt).toLocaleTimeString() : ""}
        </Badge>
      );
    }

    if (autosave.status === "conflict") {
      return <Badge variant="destructive">Conflict (open in 2 tabs)</Badge>;
    }

    if (autosave.status === "error") {
      return <Badge variant="destructive">Not saved</Badge>;
    }

    return <Badge variant="secondary">Idle</Badge>;
  })();

  const setHeaderValue = <K extends keyof CastingJobDraftData["header"]>(
    key: K,
    value: CastingJobDraftData["header"][K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [key]: value,
      },
    }));
  };

  const addItem = () => {
    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          inputRawMaterialId: null,
          outputCastingId: null,
          inputTitle: "",
          outputTitle: "",
          inputUnit: "Nos",
          outputUnit: "Nos",
          issuedQty: 1,
          issuedWeightKg: 0,
          sortOrder: prev.items.length,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, sortOrder: i })),
    }));
  };

  const updateItem = (
    index: number,
    key: keyof CastingJobDraftData["items"][number],
    value: string | number | null,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateInputFromRawMaterial = (
    index: number,
    rawMaterial: RawMaterialSearchItem,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              inputRawMaterialId: rawMaterial.id,
              inputTitle: rawMaterial.companyItemName,
              inputUnit: rawMaterial.unit || item.inputUnit || "Nos",
            }
          : item,
      ),
    }));
  };

  const updateOutputFromCasting = (
    index: number,
    casting: CastingSearchItem,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              outputCastingId: casting.id,
              outputTitle: casting.castingItemName,
              outputUnit: casting.unit || item.outputUnit || "Nos",
            }
          : item,
      ),
    }));
  };

  const totalIssuedQty = draft.items.reduce(
    (sum, item) => sum + Number(item.issuedQty || 0),
    0,
  );
  const totalIssuedWeightKg = draft.items.reduce(
    (sum, item) => sum + Number(item.issuedWeightKg || 0),
    0,
  );

  const getAvailableBalance = (rawMaterialId?: string | null) => {
    if (!rawMaterialId) return 0;
    return Number(balanceByRawMaterialId[rawMaterialId] ?? 0);
  };

  const getMaxIssueWeightForRow = (rowIndex: number) => {
    const row = draft.items[rowIndex];
    if (!row?.inputRawMaterialId) return Number.MAX_SAFE_INTEGER;

    const available = getAvailableBalance(row.inputRawMaterialId);
    const allocatedInOtherRows = draft.items.reduce((sum, item, idx) => {
      if (idx === rowIndex) return sum;
      if (item.inputRawMaterialId !== row.inputRawMaterialId) return sum;
      return sum + Number(item.issuedWeightKg || 0);
    }, 0);

    return Math.max(0, available - allocatedInOtherRows);
  };

  const selectWorker = (workerId: string) => {
    const worker = workers.find((row) => row.id === workerId);
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        workerId: worker?.id ?? null,
        workerName: worker?.name ?? "",
      },
    }));
  };

  async function handleManualSave() {
    try {
      setIsSaving(true);
      let res = await autosave.flushSave();
      if (!res.ok && (res as any).skipped) {
        res = await autosave.flushSave();
      }

      if (!res.ok) {
        if ((res as any).code === "VERSION_CONFLICT") {
          toast.error("Draft conflict detected. Please reload this page.");
          return;
        }

        if (!(res as any).skipped) {
          toast.error((res as any).message || "Failed to save draft.");
        }
        return;
      }

      toast.success("Draft saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onFinalize() {
    setIsFinalizing(true);

    try {
      let saveRes = await autosave.flushSave();
      if (!saveRes.ok && (saveRes as any).skipped) {
        saveRes = await autosave.flushSave();
      }

      if (!saveRes.ok) {
        if ((saveRes as any).code === "VERSION_CONFLICT") {
          toast.error("Draft conflict detected. Please reload this page.");
          return;
        }

        if (!(saveRes as any).skipped) {
          toast.error((saveRes as any).message || "Failed to save draft.");
          return;
        }
      }

      const res = await finalizeCastingJobAction(castingJobId);
      if (!res.ok) {
        toast.error(res.message || "Failed to finalize casting job.");
        return;
      }

      toast.success(res.message);
      router.push(`/dashboard/manufacturing/casting-jobs/${castingJobId}`);
      router.refresh();
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Casting Job Draft</h1>
          <p className="text-sm text-muted-foreground">
            Document: {documentNo}. Draft autosaves automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveIndicator}

          <Button type="button" variant="secondary" onClick={handleManualSave}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save now
              </>
            )}
          </Button>

          <Button type="button" onClick={onFinalize}>
            {isFinalizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Post OUT / Issue Material
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="header" className="w-full">
        <TabsList className="h-11 gap-2">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Header Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm">Issue Date</label>
                <DatePickerField
                  value={toDate(draft.header.issueDate)}
                  onChange={(date) =>
                    setHeaderValue("issueDate", date ? date.toISOString() : null)
                  }
                  placeholder="Select issue date"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Expected Return Date</label>
                <DatePickerField
                  value={toDate(draft.header.expectedReturnDate)}
                  onChange={(date) =>
                    setHeaderValue(
                      "expectedReturnDate",
                      date ? date.toISOString() : null,
                    )
                  }
                  placeholder="Select expected return"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Worker Type</label>
                <Select
                  value={workerType}
                  onValueChange={(value) => {
                    const nextType =
                      value === "JOB_WORK"
                        ? "JOB_WORK"
                        : value === "CONTRACT"
                          ? "CONTRACT"
                          : "IN_HOUSE";
                    setHeaderValue("workerType", nextType);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_HOUSE">In House</SelectItem>
                    <SelectItem value="JOB_WORK">Job Work</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm">Worker</label>
                <Select
                  value={draft.header.workerId ?? "__none"}
                  onValueChange={selectWorker}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select worker</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.name} ({worker.code}) · {worker.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {workers.length === 0 ? (
                  <p className="text-xs text-destructive">
                    Add an active worker under Contractors → Workers first.
                  </p>
                ) : null}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm">Supplier (Optional)</label>
                <SupplierCombobox
                  value={draft.header.supplierId ?? null}
                  onChange={(supplierId) => setHeaderValue("supplierId", supplierId)}
                />
              </div>

              <div className="space-y-1 lg:col-span-3">
                <label className="text-sm">Remarks</label>
                <Textarea
                  value={draft.header.remarks ?? ""}
                  onChange={(event) => setHeaderValue("remarks", event.target.value)}
                  placeholder="Optional remarks"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Conversion Items</CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.items.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No items added.
                </div>
              ) : (
                draft.items.map((item, index) => (
                  <div key={item.id} className="space-y-3 rounded-xl border p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Item #{index + 1}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm">Input Raw Material (Aluminium)</label>
                        <RawMaterialCombobox
                          value={item.inputRawMaterialId}
                          inventoryOnly
                          placeholder="Select aluminum scrap or ingot"
                          onChange={(rawMaterial) => {
                            if (!rawMaterial) {
                              updateItem(index, "inputRawMaterialId", null);
                              return;
                            }
                            updateInputFromRawMaterial(index, rawMaterial);
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Output Casting Material</label>
                        <CastingCombobox
                          value={item.outputCastingId}
                          onChange={(casting) => {
                            if (!casting) {
                              updateItem(index, "outputCastingId", null);
                              return;
                            }
                            updateOutputFromCasting(index, casting);
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Input Title</label>
                        <Input
                          value={item.inputTitle ?? ""}
                          onChange={(event) =>
                            updateItem(index, "inputTitle", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Output Title</label>
                        <Input
                          value={item.outputTitle ?? ""}
                          onChange={(event) =>
                            updateItem(index, "outputTitle", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Issued Lots / Pieces (Optional)</label>
                        <Input
                          type="number"
                          min={0}
                          value={item.issuedQty}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "issuedQty",
                              Math.max(0, Number(event.target.value || 0)),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Issued Weight (Kg)</label>
                        <Input
                          type="number"
                          min={0}
                          step="0.001"
                          value={item.issuedWeightKg}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "issuedWeightKg",
                              Math.max(
                                0,
                                Math.min(
                                  toNumber(event.target.value, 0),
                                  getMaxIssueWeightForRow(index),
                                ),
                              ),
                            )
                          }
                        />
                        {item.inputRawMaterialId ? (
                          <p className="text-xs text-muted-foreground">
                            Available stock: {getAvailableBalance(item.inputRawMaterialId).toFixed(3)} kg
                          </p>
                        ) : null}
                      </div>

                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Document</span>
                <span>{documentNo}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Worker Type</span>
                <span>{workerType}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Lines</span>
                <span>{draft.items.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Issued Qty</span>
                <span>{totalIssuedQty}</span>
              </div>

              <div className="flex items-center justify-between font-semibold">
                <span>Total Issued Weight</span>
                <span>{totalIssuedWeightKg.toFixed(3)} kg</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
