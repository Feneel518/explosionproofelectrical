"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CustomerSelectItem } from "@/lib/actions/dashboard/global/listCustomersForSelect";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  CalendarIcon,
  Copy,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { FC, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { CustomerCombobox } from "../../global/CustomerCombobox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeliveryChallanDraftData } from "@/lib/types/DeliveryChallanTypes";
import {
  createDeliveryChallanDraftSchema,
  DeliveryChallanDraftInput,
} from "@/lib/validators/dashboard/sales/delivery-challan/DeliveryChallanValidator";
import { ProductVariantCombobox } from "../../global/ProductVariantCombobox";
import { useDeliveryChallanDraftAutosave } from "@/hooks/useDeliveryChallanDraftAutosave";
import { finalizeDeliveryChallanAction } from "@/lib/actions/dashboard/sales/delivery-challan/finalizeDeliveryChallanAction";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

// TODO: create these like quotation later
// import { useDeliveryChallanDraftAutosave } from "@/hooks/use-auto-save-delivery-challan-draft";
// import { finalizeDeliveryChallanAction } from "@/lib/actions/dashboard/sales/delivery-challan/finalizeDeliveryChallanAction";

const PRESETS = [
  { label: "Today", value: 0 },
  { label: "Tomorrow", value: 1 },
  { label: "In 3 days", value: 3 },
  { label: "In a week", value: 7 },
  { label: "In 2 weeks", value: 14 },
];

interface DeliveryChallanFormNewProps {
  deliveryChallanId: string;
  initialDraft: DeliveryChallanDraftData;
  initialDraftVersion: number;
  challanFY: string;
  challanNo: number;
  challanCode: string;
  customers: CustomerSelectItem[];
}

const CHALLAN_TYPES = [
  "TO_BE_BILLED",
  "JOB_WORK",
  "SAMPLE",
  "RETURNABLE",
] as const;

const PARTY_TYPES = ["CUSTOMER", "VENDOR", "OTHER"] as const;

const ITEM_KINDS = ["PRODUCT", "RAW_MATERIAL"] as const;

const DeliveryChallanFormNew: FC<DeliveryChallanFormNewProps> = ({
  deliveryChallanId,
  initialDraft,
  initialDraftVersion,
  challanFY,
  challanNo,
  challanCode,
  customers,
}) => {
  const router = useRouter();

  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);

  const [initialVersion, setInitialVersion] = React.useState<number>(
    initialDraftVersion ?? 0,
  );

  const [openDate, setOpenDate] = React.useState(false);
  const [openReturnDate, setOpenReturnDate] = React.useState(false);
  const [openClosureDate, setOpenClosureDate] = React.useState(false);

  const form = useForm<DeliveryChallanDraftInput>({
    resolver: zodResolver(createDeliveryChallanDraftSchema) as any,
    defaultValues: {
      header: {
        type: initialDraft?.header?.type ?? "TO_BE_BILLED",
        partyType: initialDraft?.header?.partyType ?? "CUSTOMER",
        date: initialDraft?.header?.date ?? undefined,
        poNumber: initialDraft?.header?.poNumber ?? "",
        quotationId: initialDraft?.header?.quotationId ?? "",
        customerId: initialDraft?.header?.customerId ?? "",
        transporterName: initialDraft?.header?.transporterName ?? "",
        vehicleNumber: initialDraft?.header?.vehicleNumber ?? "",
        driverName: initialDraft?.header?.driverName ?? "",
        driverPhone: initialDraft?.header?.driverPhone ?? "",
        dispatchThrough: initialDraft?.header?.dispatchThrough ?? "",
        lrNumber: initialDraft?.header?.lrNumber ?? "",
        numberOfPackages: initialDraft?.header?.numberOfPackages ?? undefined,
        remarks: initialDraft?.header?.remarks ?? "",
        expectedReturnDate:
          initialDraft?.header?.expectedReturnDate ?? undefined,
        expectedClosureDate:
          initialDraft?.header?.expectedClosureDate ?? undefined,
      },
      items: (initialDraft?.items ?? []).map((item, index) => ({
        ...item,
        qty: Number(item.qty),
        closedQty: Number(item.closedQty),
        pendingQty: Number(item.pendingQty),
        sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : index,
      })),
    },
    mode: "onChange",
  });

  const itemsFA = useFieldArray({
    control: form.control,
    name: "items",
  });

  const challanType = form.watch("header.type");

  const autosave = useDeliveryChallanDraftAutosave({
    deliveryChallanId,
    initialVersion,
    enabled: Boolean(deliveryChallanId),
    getDraft: () => {
      const v = form.getValues();

      const items = (v.items ?? []).map((it, idx) => {
        const qty = Number(it.qty ?? 0);
        const closedQty = Number(it.closedQty ?? 0);
        const pendingQty =
          it.pendingQty === undefined || it.pendingQty === null
            ? qty - closedQty
            : Number(it.pendingQty ?? 0);

        return {
          ...it,
          kind:
            it.kind ??
            (v.header?.type === "JOB_WORK" ? "RAW_MATERIAL" : "PRODUCT"),
          productId: it.productId ?? null,
          title: it.title ?? "",
          sku: it.sku ?? "",
          typeNumber: it.typeNumber ?? "",
          description: it.description ?? "",
          hsnCode: it.hsnCode ?? "",
          unit: it.unit ?? "Nos",
          qty,
          closedQty,
          pendingQty,
          sortOrder: Number.isFinite(it.sortOrder) ? Number(it.sortOrder) : idx,
        };
      });

      return {
        header: {
          ...v.header,
          type: v.header?.type ?? "TO_BE_BILLED",
          partyType: v.header?.partyType ?? "CUSTOMER",
          date: v.header?.date ?? "",
          poNumber: v.header?.poNumber ?? "",
          quotationId: v.header?.quotationId ?? "",
          customerId: v.header?.customerId ?? "",
          transporterName: v.header?.transporterName ?? "",
          vehicleNumber: v.header?.vehicleNumber ?? "",
          driverName: v.header?.driverName ?? "",
          driverPhone: v.header?.driverPhone ?? "",
          dispatchThrough: v.header?.dispatchThrough ?? "",
          lrNumber: v.header?.lrNumber ?? "",
          numberOfPackages:
            v.header?.numberOfPackages === undefined ||
            v.header?.numberOfPackages === null
              ? undefined
              : Number(v.header.numberOfPackages),
          remarks: v.header?.remarks ?? "",
          expectedReturnDate: v.header?.expectedReturnDate ?? "",
          expectedClosureDate: v.header?.expectedClosureDate ?? "",
        },
        items,
      } as DeliveryChallanDraftData;
    },
    debounceMs: 1200,
  });

  const saveIndicator = (() => {
    if (!deliveryChallanId)
      return <Badge variant="secondary">Creating draft…</Badge>;

    if (autosave.status === "saving")
      return <Badge variant="secondary">Saving…</Badge>;

    if (autosave.status === "saved")
      return (
        <Badge variant="outline">
          Saved{" "}
          {autosave.savedAt
            ? new Date(autosave.savedAt).toLocaleTimeString()
            : ""}
        </Badge>
      );

    if (autosave.status === "conflict")
      return <Badge variant="destructive">Conflict (open in 2 tabs)</Badge>;

    if (autosave.status === "error")
      return <Badge variant="destructive">Not saved</Badge>;

    return <Badge variant="secondary">Idle</Badge>;
  })();

  const hydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (!deliveryChallanId) return;

    hydratedRef.current = true;

    const sub = form.watch(() => {
      if (!hydratedRef.current) return;
      autosave.triggerSave();
    });

    return () => sub.unsubscribe();
  }, [form, autosave, deliveryChallanId]);

  async function handleManualSave() {
    try {
      setIsSaving(true);

      await autosave.triggerSave();
    } finally {
      setIsSaving(false);
    }
  }

  async function onFinalize() {
    setIsFinalizing(true);

    try {
      const valid = await form.trigger(undefined, { shouldFocus: true });
      if (!valid) {
        console.log("Form errors:", form.formState.errors);
        return;
      }

      //   / force-save latest form state first
      await autosave.triggerSave();
      // if your autosave hook exposes status, block on error/conflict
      if (autosave.status === "conflict") {
        console.log("Draft conflict");
        return;
      }

      if (autosave.status === "error") {
        console.log("Draft save failed");
        return;
      }

      const res = await finalizeDeliveryChallanAction(deliveryChallanId);

      if (!res.ok) {
        console.log("Finalize failed:", res);
        return;
      }

      toast.success("Delivery challan finalized");
      router.push(`/dashboard/sales/delivery-challans/${deliveryChallanId}`);
      window.open(`/delivery-challan/${deliveryChallanId}/view`, "_blank");
    } finally {
      setIsFinalizing(false);
    }
  }

  function syncSortOrder() {
    const current = form.getValues("items");
    current.forEach((_, index) => {
      form.setValue(`items.${index}.sortOrder`, index, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    });
  }

  function addItem() {
    const id = crypto.randomUUID();
    const sortOrder = itemsFA.fields.length;

    form.setValue(
      "items",
      [
        ...form.getValues("items"),
        {
          id,
          kind: challanType === "JOB_WORK" ? "RAW_MATERIAL" : "PRODUCT",
          productId: null,
          title: "",
          sku: "",
          typeNumber: "",
          description: "",
          hsnCode: "",
          unit: "Nos",
          qty: 1,
          closedQty: 0,
          pendingQty: 1,
          sortOrder,
        },
      ],
      { shouldDirty: true },
    );
  }

  function duplicateItem(index: number) {
    const current = form.getValues(`items.${index}`);
    itemsFA.insert(index + 1, {
      ...current,
      id: crypto.randomUUID(),
      sortOrder: index + 1,
    });
    queueMicrotask(syncSortOrder);
  }

  function moveItemUp(index: number) {
    if (index === 0) return;
    itemsFA.move(index, index - 1);
    queueMicrotask(syncSortOrder);
  }

  function moveItemDown(index: number) {
    if (index === itemsFA.fields.length - 1) return;
    itemsFA.move(index, index + 1);
    queueMicrotask(syncSortOrder);
  }

  function removeItem(index: number) {
    itemsFA.remove(index);
    queueMicrotask(syncSortOrder);
  }

  React.useEffect(() => {
    const items = form.getValues("items") ?? [];
    items.forEach((item, index) => {
      const nextKind = challanType === "JOB_WORK" ? "RAW_MATERIAL" : "PRODUCT";
      if (item.kind !== nextKind) {
        form.setValue(`items.${index}.kind`, nextKind, { shouldDirty: true });
      }
    });
  }, [challanType, form]);

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-col items-start justify-between gap-3">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xl font-semibold">New Delivery Challan</div>
            <div className="text-sm text-muted-foreground">
              Draft autosaves automatically. Finalize to issue the challan.
            </div>
            <div className="text-xs text-muted-foreground">
              {challanCode} · {formatFinancialDocumentNumber(challanFY, challanNo)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveIndicator}

            <Button
              type="button"
              variant="secondary"
              onClick={handleManualSave}>
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

        <Form {...form}>
          <form className="w-full" onSubmit={form.handleSubmit(onFinalize)}>
            <Tabs defaultValue="header" className="w-full">
              <TabsList className="h-12 gap-4">
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>

              <TabsContent value="header" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Challan Details</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-4 gap-y-8 lg:grid-cols-4">
                      <FormField
                        control={form.control}
                        name="header.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Challan Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CHALLAN_TYPES.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.partyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Party Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select party type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PARTY_TYPES.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col gap-2">
                        <FormLabel>Customer</FormLabel>
                        <CustomerCombobox
                          value={form.watch("header.customerId") ?? ""}
                          onChange={(id) =>
                            form.setValue("header.customerId", id, {
                              shouldDirty: true,
                              shouldTouch: true,
                            })
                          }
                          onCreateCustomer={() => {}}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="header.quotationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quotation </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Optional quotation id"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.poNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PO Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Optional PO number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col  gap-2">
                            <FormLabel>Date</FormLabel>

                            <Popover open={openDate} onOpenChange={setOpenDate}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? format(field.value, "PPP")
                                      : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent
                                className="w-[320px] flex flex-col gap-2 items-center p-0"
                                align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    (field.value as Date) ??
                                    addDays(new Date(), 7)
                                  }
                                  onSelect={(date) => {
                                    field.onChange(date ?? null);
                                    setOpenDate(false);
                                  }}
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />

                                <div className="border-t p-2 flex flex-wrap gap-2">
                                  {PRESETS.map((preset) => (
                                    <Button
                                      key={preset.value}
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => {
                                        const newDate = addDays(
                                          new Date(),
                                          preset.value,
                                        );
                                        field.onChange(newDate);
                                        setOpenDate(false);
                                      }}>
                                      {preset.label}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.expectedReturnDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col  gap-2">
                            <FormLabel>Expected Return Date</FormLabel>

                            <Popover
                              open={openReturnDate}
                              onOpenChange={setOpenReturnDate}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? format(field.value, "PPP")
                                      : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent
                                className="w-[320px] flex flex-col gap-2 items-center p-0"
                                align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    (field.value as Date) ??
                                    addDays(new Date(), 7)
                                  }
                                  onSelect={(date) => {
                                    field.onChange(date ?? null);
                                    setOpenReturnDate(false);
                                  }}
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />

                                <div className="border-t p-2 flex flex-wrap gap-2">
                                  {PRESETS.map((preset) => (
                                    <Button
                                      key={preset.value}
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => {
                                        const newDate = addDays(
                                          new Date(),
                                          preset.value,
                                        );
                                        field.onChange(newDate);
                                        setOpenReturnDate(false);
                                      }}>
                                      {preset.label}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.expectedClosureDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col  gap-2">
                            <FormLabel>Expected Closure Date</FormLabel>

                            <Popover
                              open={openClosureDate}
                              onOpenChange={setOpenClosureDate}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? format(field.value, "PPP")
                                      : "Pick a date"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>

                              <PopoverContent
                                className="w-[320px] flex flex-col gap-2 items-center p-0"
                                align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    (field.value as Date) ??
                                    addDays(new Date(), 7)
                                  }
                                  onSelect={(date) => {
                                    field.onChange(date ?? null);
                                    setOpenClosureDate(false);
                                  }}
                                  disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />

                                <div className="border-t p-2 flex flex-wrap gap-2">
                                  {PRESETS.map((preset) => (
                                    <Button
                                      key={preset.value}
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => {
                                        const newDate = addDays(
                                          new Date(),
                                          preset.value,
                                        );
                                        field.onChange(newDate);
                                        setOpenClosureDate(false);
                                      }}>
                                      {preset.label}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.transporterName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transporter Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Transporter name"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.vehicleNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="GJ-xx-xxxx"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.driverName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Driver Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Driver name"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.driverPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Driver Phone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Driver phone"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.dispatchThrough"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dispatch Through</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="By road / courier / hand"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.lrNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LR Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="LR number"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.numberOfPackages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No. of Packages</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value),
                                  )
                                }
                                placeholder="0"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 pt-4 lg:grid-cols-1">
                      <FormField
                        control={form.control}
                        name="header.remarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Transport, dispatch or return remarks..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Delivery Challan Items</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Add dispatch items for this challan.
                      </p>
                    </div>

                    <Button type="button" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {itemsFA.fields.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No items added yet. Click{" "}
                        <span className="font-medium">Add Item</span>.
                      </div>
                    ) : (
                      itemsFA.fields.map((field, index) => (
                        <DeliveryChallanItemRow
                          key={field.id}
                          form={form}
                          index={index}
                          challanType={challanType}
                          onRemove={() => removeItem(index)}
                          onDuplicate={() => duplicateItem(index)}
                          onMoveUp={() => moveItemUp(index)}
                          onMoveDown={() => moveItemDown(index)}
                          addnew={addItem}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="mt-8">
                  <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Items
                      </div>
                      <div className="text-2xl font-semibold">
                        {itemsFA.fields.length}
                      </div>
                    </div>

                    <div className="grid gap-1 text-right">
                      <div className="text-sm text-muted-foreground">
                        Total Quantity
                      </div>
                      <div className="text-2xl font-bold">
                        {(form.watch("items") ?? []).reduce(
                          (acc, item) => acc + Number(item.qty || 0),
                          0,
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default DeliveryChallanFormNew;

interface DeliveryChallanItemRowProps {
  form: ReturnType<typeof useForm<DeliveryChallanDraftInput>>;
  index: number;
  challanType: DeliveryChallanDraftInput["header"]["type"];
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  addnew: () => void;
}

const DeliveryChallanItemRow: FC<DeliveryChallanItemRowProps> = ({
  form,
  index,
  onRemove,
  challanType,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  addnew,
}) => {
  const qty = form.watch(`items.${index}.qty`);
  const kind = form.watch(`items.${index}.kind`);
  const title = form.watch(`items.${index}.title`);
  const sku = form.watch(`items.${index}.sku`);

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
                    Kind: {kind} · Qty: {Number(qty || 0)}
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
                    Configure item details and quantity
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
                <FormField
                  control={form.control}
                  name={`items.${index}.kind`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Item Kind</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select kind" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ITEM_KINDS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="space-y-2 md:col-span-4">
                  <FormLabel>Product Variant</FormLabel>

                  <ProductVariantCombobox
                    value={form.watch(`items.${index}.productId`) ?? null}
                    onChange={(product) => {
                      if (!product) {
                        form.setValue(`items.${index}.productId`, null, {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.title`, "", {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.sku`, "", {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.typeNumber`, "", {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.description`, "", {
                          shouldDirty: true,
                        });
                        form.setValue(`items.${index}.hsnCode`, "", {
                          shouldDirty: true,
                        });
                        return;
                      }

                      form.setValue(`items.${index}.productId`, product.id, {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.title`,
                        product.title ?? "",
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(`items.${index}.sku`, product.sku ?? "", {
                        shouldDirty: true,
                      });
                      form.setValue(
                        `items.${index}.typeNumber`,
                        product.typeNumber ?? "",
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.description`,
                        product.description ?? "",
                        {
                          shouldDirty: true,
                        },
                      );
                      form.setValue(
                        `items.${index}.hsnCode`,
                        product.hsnCode ?? "",
                        {
                          shouldDirty: true,
                        },
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`items.${index}.title`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-5">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Item title"
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
                          disabled
                          {...field}
                          value={field.value ?? ""}
                          placeholder="SKU"
                        />
                      </FormControl>
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
                          placeholder="Enter item description"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-12">
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
                          placeholder="HSN code"
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
                      <FormLabel>Unit Price</FormLabel>
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

                <FormField
                  control={form.control}
                  name={`items.${index}.qty`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value || 0);
                            field.onChange(val);
                            form.setValue(`items.${index}.pendingQty`, val, {
                              shouldDirty: true,
                            });
                          }}
                          placeholder="1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end md:col-span-2">
                  <div className="text-sm text-muted-foreground">Pending</div>
                  <div className="text-lg font-semibold">
                    {Number(form.watch(`items.${index}.pendingQty`) || 0)}
                  </div>
                </div>

                <div className="flex flex-col justify-end md:col-span-2">
                  <div className="text-sm text-muted-foreground">Closed</div>
                  <div className="text-lg font-semibold">
                    {Number(form.watch(`items.${index}.closedQty`) || 0)}
                  </div>
                </div>
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
