"use client";

import React from "react";
import { useRouter } from "nextjs-toploader/app";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import FormLayout from "@/components/dashboard/global/FormLayout";
import { ProductVariantCombobox } from "@/components/dashboard/global/ProductVariantCombobox";
import { RawMaterialCombobox } from "@/components/dashboard/global/RawMaterialCombobox";
import { CastingCombobox } from "@/components/dashboard/global/CastingCombobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertVariantBomAction } from "@/lib/actions/dashboard/manufacturing/bom/upsertVariantBomAction";

type BomLine = {
  id: string;
  componentType: "RAW_MATERIAL" | "CASTING";
  rawMaterialId: string | null;
  castingMasterId: string | null;
  componentTitle: string;
  unit: string | null;
  qtyPerUnit: number;
  remarks: string;
};

function createEmptyLine(): BomLine {
  return {
    id: crypto.randomUUID(),
    componentType: "RAW_MATERIAL",
    rawMaterialId: null,
    castingMasterId: null,
    componentTitle: "",
    unit: null,
    qtyPerUnit: 1,
    remarks: "",
  };
}

export default function BomForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: {
    id: string;
    variantId: string;
    variantTitle: string;
    isActive: boolean;
    notes: string;
    items: BomLine[];
  };
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const [variantId, setVariantId] = React.useState<string>(initial?.variantId ?? "");
  const [variantTitle, setVariantTitle] = React.useState<string>(
    initial?.variantTitle ?? "",
  );
  const [isActive, setIsActive] = React.useState<boolean>(initial?.isActive ?? true);
  const [notes, setNotes] = React.useState<string>(initial?.notes ?? "");
  const [lines, setLines] = React.useState<BomLine[]>(
    initial?.items?.length ? initial.items : [createEmptyLine()],
  );

  const addLine = () => {
    setLines((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, patch: Partial<BomLine>) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const onSubmit = () => {
    if (!variantId) {
      toast.error("Select product variant first.");
      return;
    }

    const validLines = lines.filter(
      (line) =>
        (line.componentType === "RAW_MATERIAL" && line.rawMaterialId) ||
        (line.componentType === "CASTING" && line.castingMasterId),
    );

    if (validLines.length === 0) {
      toast.error("Add at least one BOM component line.");
      return;
    }

    start(async () => {
      const res = await upsertVariantBomAction({
        id: initial?.id,
        variantId,
        isActive,
        notes,
        items: validLines.map((line, index) => ({
          componentType: line.componentType,
          rawMaterialId: line.rawMaterialId ?? "",
          castingMasterId: line.castingMasterId ?? "",
          qtyPerUnit: Math.max(1, Math.trunc(Number(line.qtyPerUnit || 1))),
          remarks: line.remarks ?? "",
          sortOrder: index,
        })),
      });

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.push("/dashboard/manufacturing/bom");
      router.refresh();
    });
  };

  return (
    <FormLayout
      title={mode === "create" ? "New BOM" : "Edit BOM"}
      description="Define which raw materials and castings are consumed for one finished-goods unit."
      footer={
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending ? "Saving..." : "Save BOM"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>BOM Header</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Product Variant</Label>
              <ProductVariantCombobox
                value={variantId || null}
                onChange={(variant) => {
                  setVariantId(variant?.id ?? "");
                  setVariantTitle(variant?.title ?? "");
                }}
                disabled={pending}
              />
              {variantTitle ? (
                <p className="text-xs text-muted-foreground">Selected: {variantTitle}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={isActive}
                  onCheckedChange={(value) => setIsActive(Boolean(value))}
                  disabled={pending}
                />
                <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this BOM"
                disabled={pending}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>BOM Items</CardTitle>
            <Button type="button" variant="outline" onClick={addLine} disabled={pending}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No BOM lines added yet.
              </div>
            ) : (
              lines.map((line, index) => (
                <div key={line.id} className="space-y-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Line #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(index)}
                      disabled={pending || lines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Component Type</Label>
                      <Select
                        value={line.componentType}
                        onValueChange={(value) =>
                          updateLine(index, {
                            componentType: value as "RAW_MATERIAL" | "CASTING",
                            rawMaterialId: null,
                            castingMasterId: null,
                            componentTitle: "",
                            unit: null,
                          })
                        }
                        disabled={pending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select component type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RAW_MATERIAL">Raw Material</SelectItem>
                          <SelectItem value="CASTING">Casting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Component</Label>
                      {line.componentType === "RAW_MATERIAL" ? (
                        <RawMaterialCombobox
                          value={line.rawMaterialId}
                          onChange={(raw) =>
                            updateLine(index, {
                              rawMaterialId: raw?.id ?? null,
                              castingMasterId: null,
                              componentTitle: raw?.companyItemName ?? "",
                              unit: raw?.unit ?? null,
                            })
                          }
                          disabled={pending}
                        />
                      ) : (
                        <CastingCombobox
                          value={line.castingMasterId}
                          onChange={(casting) =>
                            updateLine(index, {
                              rawMaterialId: null,
                              castingMasterId: casting?.id ?? null,
                              componentTitle: casting?.castingItemName ?? "",
                              unit: casting?.unit ?? null,
                            })
                          }
                          disabled={pending}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Qty Per 1 Finished Unit</Label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={line.qtyPerUnit}
                        onChange={(e) =>
                          updateLine(index, {
                            qtyPerUnit: Math.max(
                              1,
                              Math.trunc(Number(e.target.value || 1)),
                            ),
                          })
                        }
                        disabled={pending}
                      />
                      {line.unit ? (
                        <p className="text-xs text-muted-foreground">Unit: {line.unit}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Remarks</Label>
                      <Input
                        value={line.remarks}
                        onChange={(e) => updateLine(index, { remarks: e.target.value })}
                        placeholder="Optional line remarks"
                        disabled={pending}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </FormLayout>
  );
}
