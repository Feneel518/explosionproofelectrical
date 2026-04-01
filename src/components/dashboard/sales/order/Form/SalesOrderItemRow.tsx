"use client";

import React, { FC, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SalesOrderFormValues } from "@/lib/validators/dashboard/sales/orders/OrderValidator";
import { ProductVariantCombobox } from "@/components/dashboard/global/ProductVariantCombobox";
import PdfPreviewCard from "@/components/dashboard/global/PDFPreviewCard";

interface SalesOrderItemRowProps {
  form: ReturnType<typeof useForm<SalesOrderFormValues>>;
  index: number;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  addnew: () => void;
}

const SalesOrderItemRow: FC<SalesOrderItemRowProps> = ({
  form,
  index,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  addnew,
}) => {
  const qty = Number(form.watch(`items.${index}.qty`) || 0);
  const unitPrice = Number(form.watch(`items.${index}.unitPrice`) || 0);
  const dispatchedQty = Number(form.watch(`items.${index}.dispatchedQty`) || 0);
  const invoicedQty = Number(form.watch(`items.${index}.invoicedQty`) || 0);
  const pendingQty = Number(form.watch(`items.${index}.pendingQty`) || qty);
  const lineTotal = qty * unitPrice;

  React.useEffect(() => {
    form.setValue(`items.${index}.lineSubtotal`, lineTotal, {
      shouldValidate: false,
    });
    form.setValue(`items.${index}.lineGrandTotal`, lineTotal, {
      shouldValidate: false,
    });

    const computedPending = Math.max(0, qty - dispatchedQty);
    form.setValue(`items.${index}.pendingQty`, computedPending, {
      shouldValidate: false,
    });
  }, [qty, unitPrice, dispatchedQty, lineTotal, form, index]);

  const componentFA = useFieldArray({
    control: form.control,
    name: `items.${index}.component` as never,
  });

  const title = form.watch(`items.${index}.title`);
  const sku = form.watch(`items.${index}.sku`);
  const variantImages =
    form.watch(`items.${index}.variantImagesSnapshot`) ?? [];
  const variantDrawings =
    form.watch(`items.${index}.variantDrawingsSnapshot`) ?? [];
  const selectedImageIds =
    form.watch(`items.${index}.selectedVariantImageIds`) ?? [];
  const selectedDrawingIds =
    form.watch(`items.${index}.selectedVariantDrawingIds`) ?? [];
  const summaryTitle = useMemo(() => {
    if (title?.trim()) return title;
    if (sku?.trim()) return sku;
    return `Item #${index + 1}`;
  }, [title, sku, index]);

  return (
    <Card className="overflow-hidden rounded-2xl border border-white">
      <Accordion type="single" collapsible defaultValue={`item-${index}`}>
        <AccordionItem value={`item-${index}`} className="border-none">
          <div className="px-5 pt-5">
            <AccordionTrigger className="rounded-xl border bg-muted/30 px-4 py-3 hover:no-underline">
              <div className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate text-base font-semibold">
                      {summaryTitle}
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Qty: {qty} · Unit Price: ₹{unitPrice.toFixed(2)} · Total: ₹
                    {lineTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
          </div>

          <AccordionContent className="pb-0">
            <CardContent className="space-y-5 p-5 pt-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">Item #{index + 1}</h3>
                  <p className="text-xs text-muted-foreground">
                    Configure product, specs, pricing, dispatch, invoice
                    progress and components
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onMoveUp}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onMoveDown}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onDuplicate}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-6">
                  <FormLabel>Product Variant</FormLabel>
                  <ProductVariantCombobox
                    value={form.watch(`items.${index}.variantId`) ?? null}
                    onChange={(variant) => {
                      const images = variant?.images ?? [];
                      const drawings = variant?.drawings ?? [];

                      if (!variant) {
                        form.setValue(`items.${index}.productId`, null, {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.variantId`, null, {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.title`, "", {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.sku`, null, {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.typeNumber`, null, {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.description`, null, {
                          shouldDirty: true,
                        });
                        form.setValue(
                          `items.${index}.variantImagesSnapshot`,
                          [],
                          { shouldDirty: true },
                        );
                        form.setValue(
                          `items.${index}.variantDrawingsSnapshot`,
                          [],
                          { shouldDirty: true },
                        );
                        form.setValue(
                          `items.${index}.selectedVariantImageIds`,
                          [],
                          { shouldDirty: true },
                        );
                        form.setValue(
                          `items.${index}.selectedVariantDrawingIds`,
                          [],
                          { shouldDirty: true },
                        );
                        return;
                      }

                      form.setValue(
                        `items.${index}.showVariantImages`,
                        images.length > 0,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.showVariantDrawings`,
                        drawings.length > 0,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.selectedVariantImageIds`,
                        images.map((img) => img.id),
                        { shouldDirty: true },
                      );
                      form.setValue(
                        `items.${index}.selectedVariantDrawingIds`,
                        drawings.map((dr) => dr.id),
                        { shouldDirty: true },
                      );
                      form.setValue(
                        `items.${index}.variantImagesSnapshot`,
                        images.map((img) => ({
                          id: img.id,
                          url: img.url,
                          alt: img.alt ?? null,
                          title: img.alt ?? null,
                        })),
                        { shouldDirty: true },
                      );
                      form.setValue(
                        `items.${index}.variantDrawingsSnapshot`,
                        drawings.map((dr) => ({
                          id: dr.id,
                          url: dr.url,
                          title: dr.title ?? null,
                        })),
                        { shouldDirty: true },
                      );

                      form.setValue(
                        `items.${index}.productId`,
                        variant.productId,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(`items.${index}.variantId`, variant.id, {
                        shouldDirty: true,
                      });
                      form.setValue(`items.${index}.title`, variant.title, {
                        shouldDirty: true,
                      });
                      form.setValue(`items.${index}.sku`, variant.sku, {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.typeNumber`,
                        variant.typeNumber,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.hardware`,
                        variant.hardware,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(`items.${index}.hsnCode`, variant.hsnCode, {
                        shouldDirty: true,
                      });
                      form.setValue(`items.${index}.rating`, variant.rating, {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.terminals`,
                        variant.terminals,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(`items.${index}.gasket`, variant.gasket, {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.mounting`,
                        variant.mounting,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.cableEntry`,
                        variant.cableEntry,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.earthing`,
                        variant.earthing,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.cutoutSize`,
                        variant.cutoutSize,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.plateSize`,
                        variant.plateSize,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(`items.${index}.glass`, variant.glass, {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.wireGuard`,
                        variant.wireGuard,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(`items.${index}.size`, variant.size, {
                        shouldDirty: true,
                      });
                      form.setValue(`items.${index}.rpm`, variant.rpm, {
                        shouldDirty: true,
                      });
                      form.setValue(`items.${index}.kW`, variant.kW, {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.horsePower`,
                        variant.horsePower,
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.component`,
                        variant.component?.map((c, cIndex) => ({
                          id: c.id ?? crypto.randomUUID(),
                          item: c.item ?? "",
                          unit: c.unit ?? "",
                          sortOrder: cIndex,
                        })) ?? [],
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        },
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`items.${index}.title`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-6">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Product title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.sku`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="SKU"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.typeNumber`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Type Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Type Number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-12">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Enter description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.rating`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Rating"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.terminals`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Terminals</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Terminals"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.hardware`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Hardware</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Hardware"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.mounting`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Mounting</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Mounting"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.cableEntry`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Cable Entry</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Cable Entry"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.earthing`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Earthing</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Earthing"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.hsnCode`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>HSN Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="HSN"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unit`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Nos"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.cutoutSize`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Cutout Size</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Cutout Size"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.plateSize`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Plate Size</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Plate Size"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.glass`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Glass</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Glass"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.wireGuard`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Wire Guard</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Wire Guard"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.size`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Size"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.rpm`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>RPM</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="RPM"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.kW`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>kW</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="kW"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.horsePower`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Horse Power</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="HP"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium">Components</h4>
                    <p className="text-xs text-muted-foreground">
                      Optional component details for this item
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      componentFA.append({
                        id: crypto.randomUUID(),
                        item: "",
                        unit: "Nos.",
                        qty: null,
                        sortOrder: componentFA.fields.length,
                      } as never)
                    }>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Component
                  </Button>
                </div>

                <div className="space-y-3">
                  {componentFA.fields.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No components added.
                    </div>
                  ) : (
                    componentFA.fields.map((field, cIndex) => (
                      <div
                        key={field.id}
                        className="grid gap-3 rounded-xl border p-3 md:grid-cols-10">
                        <FormField
                          control={form.control}
                          name={`items.${index}.component.${cIndex}.item`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-6">
                              <FormLabel>Component Item</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  placeholder="Component item"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.component.${cIndex}.unit`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  placeholder="Nos."
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex items-end md:col-span-2">
                          <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                            onClick={() => componentFA.remove(cIndex)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div>
                  <h4 className="font-medium">Order Media</h4>
                  <p className="text-xs text-muted-foreground">
                    Choose whether variant images and drawings should appear
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.showVariantImages`}
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <FormLabel>Show Images</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Include product images
                            </p>
                          </div>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(e) => field.onChange(Boolean(e))}
                          />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.showVariantDrawings`}
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <FormLabel>Show Drawings</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Include technical drawings
                            </p>
                          </div>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(e) => field.onChange(Boolean(e))}
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                  {variantImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Select Images</div>
                      <div className="flex flex-wrap items-center gap-4">
                        {variantImages.map((img) => {
                          const checked = selectedImageIds.includes(img.id);

                          return (
                            <label
                              key={img.id}
                              className="flex h-full w-full max-w-xs cursor-pointer flex-col gap-2 rounded-sm border p-2">
                              <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-muted">
                                <Image
                                  src={img.url}
                                  alt={img.title ?? "Variant image"}
                                  fill
                                  className="object-contain rounded-sm"
                                />
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs">
                                  {img.title || "Variant image"}
                                </span>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const isChecked = Boolean(value);
                                    const current =
                                      form.getValues(
                                        `items.${index}.selectedVariantImageIds`,
                                      ) ?? [];

                                    if (isChecked) {
                                      form.setValue(
                                        `items.${index}.selectedVariantImageIds`,
                                        [...current, img.id],
                                        { shouldDirty: true },
                                      );
                                    } else {
                                      form.setValue(
                                        `items.${index}.selectedVariantImageIds`,
                                        current.filter((id) => id !== img.id),
                                        { shouldDirty: true },
                                      );
                                    }
                                  }}
                                />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {variantDrawings.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Select Drawings</div>
                      <div className="flex flex-wrap items-center gap-4">
                        {variantDrawings.map((drawing) => {
                          const checked = selectedDrawingIds.includes(
                            drawing.id,
                          );

                          return (
                            <label
                              key={drawing.id}
                              className="flex w-full max-w-xs cursor-pointer flex-col gap-2 rounded-sm border p-2">
                              <PdfPreviewCard
                                url={drawing.url}
                                title={drawing.title || "Technical Drawing"}
                                height={420}
                              />

                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs">
                                  {drawing.title || "Technical drawing"}
                                </span>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const isChecked = Boolean(value);
                                    const current =
                                      form.getValues(
                                        `items.${index}.selectedVariantDrawingIds`,
                                      ) ?? [];

                                    if (isChecked) {
                                      form.setValue(
                                        `items.${index}.selectedVariantDrawingIds`,
                                        [...current, drawing.id],
                                        { shouldDirty: true },
                                      );
                                    } else {
                                      form.setValue(
                                        `items.${index}.selectedVariantDrawingIds`,
                                        current.filter(
                                          (id) => id !== drawing.id,
                                        ),
                                        { shouldDirty: true },
                                      );
                                    }
                                  }}
                                />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.qty`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? 1}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end md:col-span-3">
                  <div className="text-sm text-muted-foreground">
                    Line Total
                  </div>
                  <div className="text-lg font-semibold">
                    ₹{lineTotal.toFixed(2)}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name={`items.${index}.poReference`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel>PO Reference</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="PO Reference"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
                <FormField
                  control={form.control}
                  name={`items.${index}.dispatchedQty`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel>Dispatched Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.invoicedQty`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel>Invoiced Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.pendingQty`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-4">
                      <FormLabel>Pending Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="button" className="w-full" onClick={addnew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default SalesOrderItemRow;
