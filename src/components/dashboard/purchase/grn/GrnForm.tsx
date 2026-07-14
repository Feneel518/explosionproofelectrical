"use client";

import React from "react";
import { format } from "date-fns";
import { useRouter } from "nextjs-toploader/app";
import { CalendarIcon, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { ProductMediaKind } from "@prisma/client";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/dashboard/global/FileUpload";
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
import { SupplierCombobox } from "@/components/dashboard/global/SupplierCombobox";
import { RawMaterialCombobox } from "@/components/dashboard/global/RawMaterialCombobox";
import { RawMaterialSearchItem } from "@/lib/types/RawMaterialSearchItem";
import { GrnDraftData } from "@/lib/actions/dashboard/purchase/grn/createDraftGrnAction";
import { finalizeGrnAction } from "@/lib/actions/dashboard/purchase/grn/finalizeGrnAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { cn } from "@/lib/utils";
import { useGrnDraftAutosave } from "@/hooks/use-grn-draft-autosave";

function toDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function toCurrency(value?: number | string | null) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampPercent(value: unknown) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return round2(n);
}

function recalculateDraftItem(item: GrnDraftData["items"][number]) {
  const qtyRaw = Number(item.qty ?? 0);
  const qty = Number.isFinite(qtyRaw) ? Math.max(0, Math.trunc(qtyRaw)) : 0;

  const unitCostRaw = Number(item.unitCost ?? 0);
  const unitCost = Number.isFinite(unitCostRaw) ? Math.max(0, unitCostRaw) : 0;

  const discountPercent = clampPercent(item.discountPercent ?? 0);

  const grossAmount = round2(qty * unitCost);
  const discountAmount = round2((grossAmount * discountPercent) / 100);
  const lineTotal = round2(Math.max(0, grossAmount - discountAmount));
  const effectiveUnitCost = qty > 0 ? round2(lineTotal / qty) : 0;

  return {
    ...item,
    qty,
    unitCost,
    discountPercent,
    grossAmount,
    discountAmount,
    effectiveUnitCost,
    lineTotal,
  };
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
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function GrnForm({
  grnId,
  grnNo,
  grnFy,
  initialDraft,
  initialDraftVersion,
}: {
  grnId: string;
  grnNo: number;
  grnFy: string;
  initialDraft: GrnDraftData;
  initialDraftVersion: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<GrnDraftData>(() => ({
    ...initialDraft,
    items: (initialDraft.items ?? []).map(recalculateDraftItem),
  }));
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const hydratedRef = React.useRef(false);

  const documentNo = formatFinancialDocumentNumber(grnFy, grnNo);

  const autosave = useGrnDraftAutosave({
    grnId,
    initialVersion: initialDraftVersion,
    enabled: Boolean(grnId),
    getDraft: () => draft,
    debounceMs: 1200,
  });

  React.useEffect(() => {
    if (!grnId) return;

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    autosave.triggerSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const saveIndicator = (() => {
    if (!grnId) return <Badge variant="secondary">Creating draft...</Badge>;

    if (autosave.status === "saving") {
      return <Badge variant="secondary">Saving...</Badge>;
    }

    if (autosave.status === "saved") {
      return (
        <Badge variant="outline">
          Saved{" "}
          {autosave.savedAt
            ? new Date(autosave.savedAt).toLocaleTimeString()
            : ""}
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

  const addItem = () => {
    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        recalculateDraftItem({
          id: crypto.randomUUID(),
          rawMaterialId: null,
          title: "",
          supplierItemName: "",
          sku: "",
          hsnCode: "",
          unit: "Nos",
          qty: 1,
          unitCost: 0,
          discountPercent: 0,
          grossAmount: 0,
          discountAmount: 0,
          effectiveUnitCost: 0,
          lineTotal: 0,
          sortOrder: prev.items.length,
        }),
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

  const setHeaderValue = <K extends keyof GrnDraftData["header"]>(
    key: K,
    value: GrnDraftData["header"][K],
  ) => {
    setDraft((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [key]: value,
      },
    }));
  };

  const updateItem = (
    index: number,
    key: keyof GrnDraftData["items"][number],
    value: string | number | null,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? recalculateDraftItem({ ...item, [key]: value } as any)
          : item,
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
          ? recalculateDraftItem({
              ...item,
              rawMaterialId: rawMaterial.id,
              title: rawMaterial.companyItemName,
              supplierItemName: rawMaterial.supplierItemName ?? "",
              sku: rawMaterial.itemCode ?? "",
              hsnCode: rawMaterial.hsnCode ?? "",
              unit: rawMaterial.unit || item.unit || "Nos",
            })
          : item,
      ),
    }));
  };

  const subtotalValue = draft.items.reduce(
    (sum, item) => sum + Number(item.grossAmount || 0),
    0,
  );

  const totalDiscount = draft.items.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0,
  );

  const totalValue = draft.items.reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0,
  );

  const totalQty = draft.items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );

  const supplierInvoiceFiles = (draft.header.supplierInvoiceFiles ?? []).map(
    (file) => ({
      kind:
        file.kind === ProductMediaKind.IMAGE
          ? ProductMediaKind.IMAGE
          : ProductMediaKind.DRAWING,
      url: file.url,
      title: file.title ?? null,
    }),
  );

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

      const res = await finalizeGrnAction(grnId);
      if (!res.ok) {
        toast.error(res.message || "Failed to finalize GRN.");
        return;
      }

      toast.success(res.message);
      router.push(`/dashboard/purchase/grn/${grnId}`);
      router.refresh();
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">GRN Draft</h1>
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

        <TabsContent value="header" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GRN Header Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm">Received Date</label>
                <DatePickerField
                  value={toDate(draft.header.receivedAt)}
                  onChange={(date) =>
                    setHeaderValue(
                      "receivedAt",
                      date ? date.toISOString() : null,
                    )
                  }
                  placeholder="Select received date"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm">Supplier</label>
                <SupplierCombobox
                  value={draft.header.supplierId ?? null}
                  onChange={(supplierId) =>
                    setHeaderValue("supplierId", supplierId)
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Supplier Invoice No</label>
                <Input
                  value={draft.header.supplierInvoiceNo ?? ""}
                  onChange={(event) =>
                    setHeaderValue("supplierInvoiceNo", event.target.value)
                  }
                  placeholder="Invoice number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Supplier Invoice Date</label>
                <DatePickerField
                  value={toDate(draft.header.supplierInvoiceDate)}
                  onChange={(date) =>
                    setHeaderValue(
                      "supplierInvoiceDate",
                      date ? date.toISOString() : null,
                    )
                  }
                  placeholder="Select invoice date"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Transporter Name</label>
                <Input
                  value={draft.header.transporterName ?? ""}
                  onChange={(event) =>
                    setHeaderValue("transporterName", event.target.value)
                  }
                  placeholder="Transporter"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">LR Number</label>
                <Input
                  value={draft.header.lrNumber ?? ""}
                  onChange={(event) =>
                    setHeaderValue("lrNumber", event.target.value)
                  }
                  placeholder="LR number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Transportation Paid</label>
                <Select
                  value={draft.header.transportationPaid ? "paid" : "unpaid"}
                  onValueChange={(value) => {
                    const paid = value === "paid";
                    setDraft((prev) => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        transportationPaid: paid,
                        transportationPaidAmount: paid
                          ? (prev.header.transportationPaidAmount ?? 0)
                          : null,
                      },
                    }));
                  }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.header.transportationPaid ? (
                <div className="space-y-1">
                  <label className="text-sm">Transportation Paid Amount</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.header.transportationPaidAmount ?? 0}
                    onChange={(event) =>
                      setHeaderValue(
                        "transportationPaidAmount",
                        Number(event.target.value || 0),
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              ) : null}

              <div className="space-y-1 lg:col-span-3">
                <label className="text-sm">Remarks</label>
                <Textarea
                  value={draft.header.remarks ?? ""}
                  onChange={(event) =>
                    setHeaderValue("remarks", event.target.value)
                  }
                  placeholder="Optional remarks"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Invoice File</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                endpoint="productDrawing"
                kind={ProductMediaKind.DRAWING}
                label="Invoice Upload"
                hint="Upload supplier invoice PDF/image"
                value={supplierInvoiceFiles}
                onChange={(files) =>
                  setHeaderValue(
                    "supplierInvoiceFiles",
                    files.map((file) => ({
                      kind: file.kind,
                      url: file.url,
                      title: file.title ?? null,
                    })),
                  )
                }
              />
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
                  <div
                    key={item.id}
                    className="space-y-3 rounded-xl border p-4">
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
                            updateItem(
                              index,
                              "supplierItemName",
                              event.target.value,
                            )
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
                        <label className="text-sm">Quantity</label>
                        <Input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "qty",
                              Number(event.target.value || 0),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Unit Cost</label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "unitCost",
                              Number(event.target.value || 0),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Discount %</label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={item.discountPercent ?? 0}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "discountPercent",
                              Number(event.target.value || 0),
                            )
                          }
                        />
                      </div>

                      <div className="rounded-lg border p-3 text-sm md:col-span-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-muted-foreground">
                            Gross Amount:
                          </div>
                          <div className="text-right font-medium">
                            {toCurrency(item.grossAmount)}
                          </div>

                          <div className="text-muted-foreground">
                            Discount Amount:
                          </div>
                          <div className="text-right font-medium">
                            {toCurrency(item.discountAmount)}
                          </div>

                          <div className="text-muted-foreground">
                            Unit Cost After Discount:
                          </div>
                          <div className="text-right font-medium">
                            {toCurrency(item.effectiveUnitCost)}
                          </div>

                          <div className="text-muted-foreground font-semibold">
                            Final Line Amount:
                          </div>
                          <div className="text-right font-semibold">
                            {toCurrency(item.lineTotal)}
                          </div>
                        </div>
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
                <span>Total Items</span>
                <span>{draft.items.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Quantity</span>
                <span>{totalQty}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Transport Paid</span>
                <span>{draft.header.transportationPaid ? "Yes" : "No"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Transport Amount</span>
                <span>
                  {draft.header.transportationPaidAmount
                    ? toCurrency(draft.header.transportationPaidAmount)
                    : "-"}
                </span>
              </div>

              <div className="flex items-center justify-between font-semibold">
                <span>Subtotal (Before Discount)</span>
                <span>{toCurrency(subtotalValue)}</span>
              </div>

              <div className="flex items-center justify-between font-semibold">
                <span>Total Discount</span>
                <span>{toCurrency(totalDiscount)}</span>
              </div>

              <div className="flex items-center justify-between font-semibold">
                <span>Total Value (After Discount)</span>
                <span>{toCurrency(totalValue)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
