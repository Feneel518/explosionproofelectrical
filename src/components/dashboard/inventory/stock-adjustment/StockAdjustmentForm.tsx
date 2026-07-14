"use client";

import React from "react";
import { format } from "date-fns";
import { useRouter } from "nextjs-toploader/app";
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
import { ProductVariantCombobox } from "@/components/dashboard/global/ProductVariantCombobox";
import { RawMaterialCombobox } from "@/components/dashboard/global/RawMaterialCombobox";
import { ProductVariantSearchItem } from "@/lib/types/ProductVariantSeachItem";
import { RawMaterialSearchItem } from "@/lib/types/RawMaterialSearchItem";
import {
  StockAdjustmentDraftData,
  StockAdjustmentItemType,
} from "@/lib/actions/dashboard/inventory/stock-adjustment/createDraftStockAdjustmentAction";
import { finalizeStockAdjustmentAction } from "@/lib/actions/dashboard/inventory/stock-adjustment/finalizeStockAdjustmentAction";
import { getStockAdjustmentBalancesAction } from "@/lib/actions/dashboard/inventory/stock-adjustment/getStockAdjustmentBalancesAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import {
  OUTWARD_STOCK_ADJUSTMENT_MOVEMENTS,
  STOCK_ADJUSTMENT_MOVEMENT_LABELS,
  STOCK_ADJUSTMENT_MOVEMENT_TYPES,
  StockAdjustmentMovementType,
} from "@/lib/helpers/inventory/stockAdjustment";
import { cn } from "@/lib/utils";
import { useStockAdjustmentDraftAutosave } from "@/hooks/use-stock-adjustment-draft-autosave";

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

export default function StockAdjustmentForm({
  stockAdjustmentId,
  adjustNo,
  adjustFy,
  initialDraft,
  initialDraftVersion,
}: {
  stockAdjustmentId: string;
  adjustNo: number;
  adjustFy: string;
  initialDraft: StockAdjustmentDraftData;
  initialDraftVersion: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<StockAdjustmentDraftData>(initialDraft);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const hydratedRef = React.useRef(false);

  const [rawMaterialBalanceById, setRawMaterialBalanceById] = React.useState<
    Record<string, number>
  >({});
  const [variantBalanceById, setVariantBalanceById] = React.useState<
    Record<string, number>
  >({});

  const documentNo = formatFinancialDocumentNumber(adjustFy, adjustNo);

  const autosave = useStockAdjustmentDraftAutosave({
    stockAdjustmentId,
    initialVersion: initialDraftVersion,
    enabled: Boolean(stockAdjustmentId),
    getDraft: () => draft,
    debounceMs: 1200,
  });

  React.useEffect(() => {
    if (!stockAdjustmentId) return;

    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    autosave.triggerSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  React.useEffect(() => {
    let cancelled = false;

    const rawMaterialIds = Array.from(
      new Set(
        (draft.items ?? [])
          .filter((item) => item.itemType === "RAW_MATERIAL")
          .map((item) => item.rawMaterialId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const productVariantIds = Array.from(
      new Set(
        (draft.items ?? [])
          .filter((item) => item.itemType === "FINISHED_GOOD")
          .map((item) => item.productVariantId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    async function loadBalances() {
      if (rawMaterialIds.length === 0 && productVariantIds.length === 0) {
        if (!cancelled) {
          setRawMaterialBalanceById({});
          setVariantBalanceById({});
        }
        return;
      }

      const res = await getStockAdjustmentBalancesAction({
        rawMaterialIds,
        productVariantIds,
      });

      if (!res.ok || cancelled) return;

      const nextRaw: Record<string, number> = {};
      const nextVariant: Record<string, number> = {};

      for (const row of res.balances) {
        if (row.rawMaterialId) nextRaw[row.rawMaterialId] = Number(row.qtyOnHand || 0);
        if (row.productVariantId) {
          nextVariant[row.productVariantId] = Number(row.qtyOnHand || 0);
        }
      }

      if (!cancelled) {
        setRawMaterialBalanceById(nextRaw);
        setVariantBalanceById(nextVariant);
      }
    }

    loadBalances();

    return () => {
      cancelled = true;
    };
  }, [draft.items]);

  const saveIndicator = (() => {
    if (!stockAdjustmentId) return <Badge variant="secondary">Creating draft...</Badge>;

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

  const setHeaderValue = <K extends keyof StockAdjustmentDraftData["header"]>(
    key: K,
    value: StockAdjustmentDraftData["header"][K],
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
          itemType: "RAW_MATERIAL",
          rawMaterialId: null,
          productVariantId: null,
          title: "",
          supplierItemName: "",
          sku: "",
          typeNumber: "",
          hsnCode: "",
          unit: "Nos",
          movementType: "ADJUST_IN",
          qty: 1,
          unitCost: null,
          remarks: "",
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
    key: keyof StockAdjustmentDraftData["items"][number],
    value: string | number | StockAdjustmentItemType | StockAdjustmentMovementType | null,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateItemType = (index: number, nextType: StockAdjustmentItemType) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;

        return {
          ...item,
          itemType: nextType,
          rawMaterialId: nextType === "RAW_MATERIAL" ? item.rawMaterialId : null,
          productVariantId:
            nextType === "FINISHED_GOOD" ? item.productVariantId : null,
          title: nextType === item.itemType ? item.title : "",
          supplierItemName: nextType === "RAW_MATERIAL" ? item.supplierItemName : "",
          sku: nextType === item.itemType ? item.sku : "",
          typeNumber: nextType === item.itemType ? item.typeNumber : "",
          hsnCode: nextType === item.itemType ? item.hsnCode : "",
          unit: item.unit || "Nos",
        };
      }),
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
              itemType: "RAW_MATERIAL",
              rawMaterialId: rawMaterial.id,
              productVariantId: null,
              title: rawMaterial.companyItemName,
              supplierItemName: rawMaterial.supplierItemName ?? "",
              sku: rawMaterial.itemCode ?? "",
              typeNumber: "",
              hsnCode: rawMaterial.hsnCode ?? "",
              unit: rawMaterial.unit || item.unit || "Nos",
            }
          : item,
      ),
    }));
  };

  const updateItemFromVariant = (
    index: number,
    variant: ProductVariantSearchItem,
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              itemType: "FINISHED_GOOD",
              productVariantId: variant.id,
              rawMaterialId: null,
              title: variant.title,
              supplierItemName: "",
              sku: variant.sku ?? "",
              typeNumber: variant.typeNumber ?? "",
              hsnCode: variant.hsnCode ?? "",
              unit: item.unit || "Nos",
            }
          : item,
      ),
    }));
  };

  const getOnHandBalance = (item: StockAdjustmentDraftData["items"][number]) => {
    if (item.itemType === "RAW_MATERIAL") {
      if (!item.rawMaterialId) return 0;
      return Number(rawMaterialBalanceById[item.rawMaterialId] ?? 0);
    }

    if (!item.productVariantId) return 0;
    return Number(variantBalanceById[item.productVariantId] ?? 0);
  };

  const totalQty = draft.items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const totalInQty = draft.items.reduce((sum, item) => {
    if (OUTWARD_STOCK_ADJUSTMENT_MOVEMENTS.has(item.movementType)) return sum;
    return sum + Number(item.qty || 0);
  }, 0);

  const totalOutQty = draft.items.reduce((sum, item) => {
    if (!OUTWARD_STOCK_ADJUSTMENT_MOVEMENTS.has(item.movementType)) return sum;
    return sum + Number(item.qty || 0);
  }, 0);

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

      const res = await finalizeStockAdjustmentAction(stockAdjustmentId);
      if (!res.ok) {
        toast.error(res.message || "Failed to finalize stock adjustment.");
        return;
      }

      toast.success(res.message);
      router.push(`/dashboard/inventory/adjustments/${stockAdjustmentId}`);
      router.refresh();
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Stock Adjustment Draft</h1>
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
              <CardTitle>Adjustment Header Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm">Adjustment Date</label>
                <DatePickerField
                  value={toDate(draft.header.adjustDate)}
                  onChange={(date) =>
                    setHeaderValue("adjustDate", date ? date.toISOString() : null)
                  }
                  placeholder="Select adjustment date"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm">Adjusted By</label>
                <Input
                  value={draft.header.adjustedByName ?? ""}
                  onChange={(event) =>
                    setHeaderValue("adjustedByName", event.target.value)
                  }
                  placeholder="Name of responsible person"
                />
              </div>

              <div className="space-y-1 lg:col-span-1">
                <label className="text-sm">Reason</label>
                <Input
                  value={draft.header.reason ?? ""}
                  onChange={(event) => setHeaderValue("reason", event.target.value)}
                  placeholder="Damage / count correction / return"
                />
              </div>

              <div className="space-y-1 lg:col-span-3">
                <label className="text-sm">Remarks</label>
                <Textarea
                  value={draft.header.remarks ?? ""}
                  onChange={(event) => setHeaderValue("remarks", event.target.value)}
                  placeholder="Optional notes for this adjustment"
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

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-sm">Item Type</label>
                        <Select
                          value={item.itemType}
                          onValueChange={(value) =>
                            updateItemType(
                              index,
                              value === "FINISHED_GOOD"
                                ? "FINISHED_GOOD"
                                : "RAW_MATERIAL",
                            )
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RAW_MATERIAL">Raw Material</SelectItem>
                            <SelectItem value="FINISHED_GOOD">Finished Good</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm">
                          {item.itemType === "RAW_MATERIAL"
                            ? "Raw Material"
                            : "Finished Good"}
                        </label>
                        {item.itemType === "RAW_MATERIAL" ? (
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
                        ) : (
                          <ProductVariantCombobox
                            value={item.productVariantId}
                            onChange={(variant) => {
                              if (!variant) {
                                updateItem(index, "productVariantId", null);
                                return;
                              }
                              updateItemFromVariant(index, variant);
                            }}
                          />
                        )}
                      </div>

                      <div className="space-y-1 md:col-span-2 lg:col-span-3">
                        <label className="text-sm">Item Title</label>
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
                          disabled={item.itemType !== "RAW_MATERIAL"}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Item Code / SKU</label>
                        <Input
                          value={item.sku ?? ""}
                          onChange={(event) => updateItem(index, "sku", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Type Number</label>
                        <Input
                          value={item.typeNumber ?? ""}
                          onChange={(event) =>
                            updateItem(index, "typeNumber", event.target.value)
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
                          onChange={(event) => updateItem(index, "unit", event.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Movement</label>
                        <Select
                          value={item.movementType}
                          onValueChange={(value) =>
                            updateItem(
                              index,
                              "movementType",
                              (STOCK_ADJUSTMENT_MOVEMENT_TYPES as readonly string[]).includes(
                                value,
                              )
                                ? (value as StockAdjustmentMovementType)
                                : "ADJUST_IN",
                            )
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select movement" />
                          </SelectTrigger>
                          <SelectContent>
                            {STOCK_ADJUSTMENT_MOVEMENT_TYPES.map((movementType) => (
                              <SelectItem key={movementType} value={movementType}>
                                {STOCK_ADJUSTMENT_MOVEMENT_LABELS[movementType]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Quantity</label>
                        <Input
                          type="number"
                          min={0}
                          value={item.qty}
                          onChange={(event) =>
                            updateItem(index, "qty", Math.max(0, Number(event.target.value || 0)))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          On Hand Balance: {getOnHandBalance(item)}
                        </p>
                        {OUTWARD_STOCK_ADJUSTMENT_MOVEMENTS.has(item.movementType) &&
                        Number(item.qty || 0) > getOnHandBalance(item) ? (
                          <p className="text-xs text-amber-600">
                            Outward qty is more than current on hand. Finalize will fail if
                            negative stock is not allowed.
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Unit Cost (Optional)</label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitCost ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value;
                            updateItem(index, "unitCost", raw === "" ? null : Number(raw));
                          }}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2 lg:col-span-3">
                        <label className="text-sm">Line Remarks</label>
                        <Textarea
                          value={item.remarks ?? ""}
                          onChange={(event) =>
                            updateItem(index, "remarks", event.target.value)
                          }
                          placeholder="Optional line-level remarks"
                        />
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
                <span>Total Lines</span>
                <span>{draft.items.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Total Qty</span>
                <span>{totalQty}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-700">
                <span>Total In Qty</span>
                <span>{totalInQty}</span>
              </div>

              <div className="flex items-center justify-between text-orange-700">
                <span>Total Out Qty</span>
                <span>{totalOutQty}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
