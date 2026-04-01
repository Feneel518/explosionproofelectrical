"use client";

import React from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
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
import { RawMaterialCombobox } from "@/components/dashboard/global/RawMaterialCombobox";
import { RawMaterialSearchItem } from "@/lib/types/RawMaterialSearchItem";
import { MaterialIssueDraftData } from "@/lib/actions/dashboard/manufacturing/material-issue/createDraftMaterialIssueAction";
import { finalizeMaterialIssueAction } from "@/lib/actions/dashboard/manufacturing/material-issue/finalizeMaterialIssueAction";
import { getRawMaterialIssueBalancesAction } from "@/lib/actions/dashboard/manufacturing/material-issue/getRawMaterialIssueBalancesAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { cn } from "@/lib/utils";
import { useMaterialIssueDraftAutosave } from "@/hooks/use-material-issue-draft-autosave";

function toDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
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
          )}>
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

export default function MaterialIssueForm({
  materialIssueId,
  issueNo,
  issueFy,
  initialDraft,
  initialDraftVersion,
}: {
  materialIssueId: string;
  issueNo: number;
  issueFy: string;
  initialDraft: MaterialIssueDraftData;
  initialDraftVersion: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<MaterialIssueDraftData>(initialDraft);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const hydratedRef = React.useRef(false);
  const [balanceByRawMaterialId, setBalanceByRawMaterialId] = React.useState<
    Record<string, number>
  >({});

  const documentNo = formatFinancialDocumentNumber(issueFy, issueNo);

  const autosave = useMaterialIssueDraftAutosave({
    materialIssueId,
    initialVersion: initialDraftVersion,
    enabled: Boolean(materialIssueId),
    getDraft: () => draft,
    debounceMs: 1200,
  });

  React.useEffect(() => {
    if (!materialIssueId) return;

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
          .map((item) => item.rawMaterialId)
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

  const issueType =
    draft.header.issueType === "DIRECT_SALE" ? "DIRECT_SALE" : "INTERNAL_USE";

  const saveIndicator = (() => {
    if (!materialIssueId) return <Badge variant="secondary">Creating draft...</Badge>;

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

  const setHeaderValue = <K extends keyof MaterialIssueDraftData["header"]>(
    key: K,
    value: MaterialIssueDraftData["header"][K],
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
          rawMaterialId: null,
          title: "",
          supplierItemName: "",
          sku: "",
          hsnCode: "",
          unit: "Nos",
          qtyIssued: 1,
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
    key: keyof MaterialIssueDraftData["items"][number],
    value: string | number | null,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateItemFromRawMaterial = (
    index: number,
    rawMaterial: RawMaterialSearchItem,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              rawMaterialId: rawMaterial.id,
              title: rawMaterial.companyItemName,
              supplierItemName: rawMaterial.supplierItemName ?? "",
              sku: rawMaterial.itemCode ?? "",
              hsnCode: rawMaterial.hsnCode ?? "",
              unit: rawMaterial.unit || item.unit || "Nos",
            }
          : item,
      ),
    }));
  };

  const totalQty = draft.items.reduce(
    (sum, item) => sum + Number(item.qtyIssued || 0),
    0,
  );

  const getAvailableBalance = (rawMaterialId?: string | null) => {
    if (!rawMaterialId) return 0;
    return Number(balanceByRawMaterialId[rawMaterialId] ?? 0);
  };

  const getMaxIssueQtyForRow = (rowIndex: number) => {
    const row = draft.items[rowIndex];
    if (!row?.rawMaterialId) return Number.MAX_SAFE_INTEGER;

    const available = getAvailableBalance(row.rawMaterialId);
    const allocatedInOtherRows = draft.items.reduce((sum, item, idx) => {
      if (idx === rowIndex) return sum;
      if (item.rawMaterialId !== row.rawMaterialId) return sum;
      return sum + Number(item.qtyIssued || 0);
    }, 0);

    return Math.max(0, available - allocatedInOtherRows);
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

      const res = await finalizeMaterialIssueAction(materialIssueId);
      if (!res.ok) {
        toast.error(res.message || "Failed to finalize material issue.");
        return;
      }

      toast.success(res.message);
      router.push(`/dashboard/manufacturing/material-issues/${materialIssueId}`);
      router.refresh();
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Material Issue Draft</h1>
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
                Finalizing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Finalize
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
              <CardTitle>Issue Header Details</CardTitle>
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
                <label className="text-sm">Issue Type</label>
                <Select
                  value={issueType}
                  onValueChange={(value) => {
                    const nextType =
                      value === "DIRECT_SALE" ? "DIRECT_SALE" : "INTERNAL_USE";
                    setDraft((prev) => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        issueType: nextType,
                        // keep values; just switch UI mode
                      },
                    }));
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL_USE">Internal Use</SelectItem>
                    <SelectItem value="DIRECT_SALE">Direct Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm">Issued By</label>
                <Input
                  value={draft.header.issuedByName ?? ""}
                  onChange={(event) =>
                    setHeaderValue("issuedByName", event.target.value)
                  }
                  placeholder="Store incharge"
                />
              </div>

              {issueType === "INTERNAL_USE" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-sm">Issued To</label>
                    <Input
                      value={draft.header.issuedToName ?? ""}
                      onChange={(event) =>
                        setHeaderValue("issuedToName", event.target.value)
                      }
                      placeholder="Person taking material"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Department</label>
                    <Input
                      value={draft.header.department ?? ""}
                      onChange={(event) =>
                        setHeaderValue("department", event.target.value)
                      }
                      placeholder="Production / Maintenance"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Purpose</label>
                    <Input
                      value={draft.header.purpose ?? ""}
                      onChange={(event) =>
                        setHeaderValue("purpose", event.target.value)
                      }
                      placeholder="Job purpose"
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-3">
                    <label className="text-sm">Work Reference</label>
                    <Input
                      value={draft.header.workReference ?? ""}
                      onChange={(event) =>
                        setHeaderValue("workReference", event.target.value)
                      }
                      placeholder="WO / Job card / Order ref"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-sm">Customer Name</label>
                    <Input
                      value={draft.header.directSaleCustomerName ?? ""}
                      onChange={(event) =>
                        setHeaderValue("directSaleCustomerName", event.target.value)
                      }
                      placeholder="Customer for direct sale"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm">Sale Reference</label>
                    <Input
                      value={draft.header.directSaleReferenceNo ?? ""}
                      onChange={(event) =>
                        setHeaderValue("directSaleReferenceNo", event.target.value)
                      }
                      placeholder="Invoice / Cash memo / Ref no"
                    />
                  </div>
                </>
              )}

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
              <CardTitle>Items</CardTitle>
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
                        onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm">Raw Material</label>
                        <RawMaterialCombobox
                          value={item.rawMaterialId}
                          onChange={(rawMaterial) => {
                            if (!rawMaterial) {
                              updateItem(index, "rawMaterialId", null);
                              return;
                            }
                            updateItemFromRawMaterial(index, rawMaterial);
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Our Item Name</label>
                        <Input
                          value={item.title ?? ""}
                          onChange={(event) =>
                            updateItem(index, "title", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Supplier Item Name</label>
                        <Input
                          value={item.supplierItemName ?? ""}
                          onChange={(event) =>
                            updateItem(index, "supplierItemName", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Item Code</label>
                        <Input
                          value={item.sku ?? ""}
                          onChange={(event) =>
                            updateItem(index, "sku", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">HSN</label>
                        <Input
                          value={item.hsnCode ?? ""}
                          onChange={(event) =>
                            updateItem(index, "hsnCode", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Unit</label>
                        <Input
                          value={item.unit ?? ""}
                          onChange={(event) =>
                            updateItem(index, "unit", event.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Quantity Issued</label>
                        <Input
                          type="number"
                          min={0}
                          value={item.qtyIssued}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "qtyIssued",
                              Math.max(
                                0,
                                Math.min(
                                  Number(event.target.value || 0),
                                  getMaxIssueQtyForRow(index),
                                ),
                              ),
                            )
                          }
                        />
                        {item.rawMaterialId ? (
                          <p className="text-xs text-muted-foreground">
                            Balance Qty: {getAvailableBalance(item.rawMaterialId)}
                          </p>
                        ) : null}
                        {item.rawMaterialId &&
                        Number(item.qtyIssued || 0) > getMaxIssueQtyForRow(index) ? (
                          <p className="text-xs text-destructive">
                            Issued qty cannot be greater than balance qty.
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
                <span>Issue Type</span>
                <span>{issueType === "DIRECT_SALE" ? "Direct Sale" : "Internal Use"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Items</span>
                <span>{draft.items.length}</span>
              </div>

              <div className="flex items-center justify-between font-semibold">
                <span>Total Quantity Issued</span>
                <span>{totalQty}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
