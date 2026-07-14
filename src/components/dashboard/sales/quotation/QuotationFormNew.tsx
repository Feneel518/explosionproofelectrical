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
import { useQuotationDraftAutosave } from "@/hooks/use-auto-save-draft";
import { CustomerSelectItem } from "@/lib/actions/dashboard/global/listCustomersForSelect";
import { getCustomerForSelectById } from "@/lib/actions/dashboard/global/getCustomerForSelectById";
import { finalizeQuotationAction } from "@/lib/actions/dashboard/sales/quotation/finalizeQuotationAction";
import {
  CustomerLastVariantPriceBySource,
  getCustomerLastVariantPricesAction,
} from "@/lib/actions/dashboard/sales/quotation/getCustomerLastVariantPricesAction";
import {
  gstOptions,
  packingCharges,
  paymentTerms,
  transportationPayment,
} from "@/lib/constants/quotationData";
import { QuotationDraftData } from "@/lib/types/QuotationType";
import { cn } from "@/lib/utils";
import { QuotationSchema } from "@/lib/validators/dashboard/sales/quotations/QuotationValidator";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
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
import { useRouter } from "nextjs-toploader/app";
import React, { FC, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import CustomerForm from "../../customer/CustomerForm";
import { CustomerCombobox } from "../../global/CustomerCombobox";
import { ResponsiveModal } from "../../global/ResponsiveModal";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  dateToISO,
  draftToDate,
} from "@/lib/helpers/globalHelpers/dateNormalizer";
import { ProductVariantCombobox } from "../../global/ProductVariantCombobox";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import PdfPreviewCard from "../../global/PDFPreviewCard";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";

interface QuotationFormNewProps {
  quotationId: string;
  initialDraft: QuotationDraftData; // store JSON as-is
  initialDraftVersion: number;
  quoteFY: string;
  quoteNo: number;
  customers: CustomerSelectItem[];
}

const PRESETS = [
  { label: "Today", value: 0 },
  { label: "Tomorrow", value: 1 },
  { label: "In 3 days", value: 3 },
  { label: "In a week", value: 7 },
  { label: "In 2 weeks", value: 14 },
];

const QuotationFormNew: FC<QuotationFormNewProps> = ({
  initialDraft,
  initialDraftVersion,
  quotationId,
  quoteFY,
  quoteNo,
  customers,
}) => {
  const router = useRouter();

  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);

  const [openCreateCustomer, setOpenCreateCustomer] = React.useState(false);
  const [openFollowup, setOpenFollowup] = React.useState(false);
  const [isApplyingCustomerDefaults, setIsApplyingCustomerDefaults] =
    React.useState(false);
  const [isLoadingLastPrices, setIsLoadingLastPrices] = React.useState(false);
  const [lastPriceByVariantId, setLastPriceByVariantId] = React.useState<
    Record<string, CustomerLastVariantPriceBySource>
  >({});
  const [lastPriceRefreshTick, setLastPriceRefreshTick] = React.useState(0);

  const [initialVersion, setInitialVersion] = React.useState<number>(
    initialDraftVersion ?? 0,
  );

  const customerDefaultsById = React.useMemo(() => {
    const map = new Map<string, CustomerSelectItem>();
    for (const customer of customers ?? []) {
      if (customer?.id) map.set(customer.id, customer);
    }
    return map;
  }, [customers]);

  const form = useForm<QuotationDraftData>({
    resolver: zodResolver(QuotationSchema) as any,
    defaultValues: {
      ...initialDraft,
      header: {
        ...initialDraft.header,
        nextFollowupAt:
          draftToDate((initialDraft as any).header?.nextFollowupAt) ??
          addDays(new Date(), 7),
      },
    } as QuotationDraftData,
    mode: "onChange",
  });

  const itemsFA = useFieldArray({
    control: form.control,
    name: "items",
  });

  const hydratedRef = React.useRef(false);

  const autosave = useQuotationDraftAutosave({
    quotationId: quotationId,
    initialVersion,
    enabled: Boolean(quotationId),
    getDraft: () => {
      const v = form.getValues();

      const items = (v.items ?? []).map((it, idx) => {
        return {
          ...it,
          sortOrder: Number.isFinite(it.sortOrder) ? Number(it.sortOrder) : idx,
          //   @ts-ignore
          component: it.component?.map((c, cidx) => {
            return {
              ...c,
              id: c.id ?? crypto.randomUUID(),
              unit: c.unit ?? "Nos.",
            };
          }),
        };
      });
      return {
        header: {
          ...v.header,
          nextFollowupAt: dateToISO((v as any).header?.nextFollowupAt),
        },
        items,
      } as QuotationDraftData;
    },
    debounceMs: 1200,
  });

  // Subscribe to all changes and trigger autosave
  React.useEffect(() => {
    if (!quotationId) return;

    // prevent immediate autosave before first user interaction
    hydratedRef.current = true;

    const sub = form.watch(() => {
      if (!hydratedRef.current) return;
      autosave.triggerSave();
    });

    return () => sub.unsubscribe();
  }, [form, autosave, quotationId]);

  const applyCustomerDefaults = React.useCallback(
    async (customerId: string) => {
      setIsApplyingCustomerDefaults(true);
      try {
        const fromList = customerDefaultsById.get(customerId) ?? null;
        const customer =
          fromList ?? (await getCustomerForSelectById(customerId));
        if (!customer) return;

        form.setValue("header.clientName", customer.companyName ?? "", {
          shouldDirty: true,
          shouldTouch: true,
        });
        form.setValue(
          "header.receivedFromEmail",
          customer.companyEmail ??
            form.getValues("header.receivedFromEmail") ??
            "",
          { shouldDirty: true, shouldTouch: true },
        );
        form.setValue(
          "header.receivedFromPhone",
          customer.companyPhone ??
            form.getValues("header.receivedFromPhone") ??
            "",
          { shouldDirty: true, shouldTouch: true },
        );
        form.setValue(
          "header.gst",
          customer.defaultQuotationGst ?? "CGST_SGST_18",
          { shouldDirty: true, shouldTouch: true },
        );
        form.setValue(
          "header.packingCharges",
          customer.defaultQuotationPackingCharges ?? "INCLUDED",
          { shouldDirty: true, shouldTouch: true },
        );
        form.setValue(
          "header.transportationPayment",
          customer.defaultQuotationTransportationPayment ?? "TO_PAY",
          { shouldDirty: true, shouldTouch: true },
        );
        form.setValue(
          "header.paymentTerms",
          customer.defaultQuotationPaymentTerms ?? "ADVANCE",
          { shouldDirty: true, shouldTouch: true },
        );
        if (customer.defaultQuotationDeliveryDate) {
          form.setValue(
            "header.deliveryDate",
            customer.defaultQuotationDeliveryDate,
            {
              shouldDirty: true,
              shouldTouch: true,
            },
          );
        }
      } finally {
        setIsApplyingCustomerDefaults(false);
      }
    },
    [customerDefaultsById, form],
  );

  const watchedCustomerId = form.watch("header.customerId");
  const watchedItems = form.watch("items");
  const watchedVariantIds = useMemo(() => {
    const variants = (watchedItems ?? [])
      .map((item) => item.variantId)
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(variants));
  }, [watchedItems]);
  const watchedVariantIdsKey = useMemo(
    () => watchedVariantIds.join("|"),
    [watchedVariantIds],
  );
  const lastPriceRequestIdRef = React.useRef(0);

  const loadLastPrices = React.useCallback(
    async ({
      customerId,
      variantIds,
    }: {
      customerId?: string | null;
      variantIds?: string[];
    } = {}) => {
      const selectedCustomerId =
        customerId ?? form.getValues("header.customerId");
      const selectedVariantIds = Array.from(
        new Set(
          (
            variantIds ??
            (form.getValues("items") ?? [])
              .map((item) => item.variantId)
              .filter((id): id is string => Boolean(id))
          ).filter(Boolean),
        ),
      );

      const requestId = ++lastPriceRequestIdRef.current;

      if (!selectedCustomerId || selectedVariantIds.length === 0) {
        if (requestId === lastPriceRequestIdRef.current) {
          setLastPriceByVariantId({});
          setIsLoadingLastPrices(false);
        }
        return;
      }

      setIsLoadingLastPrices(true);

      try {
        const res = await getCustomerLastVariantPricesAction({
          customerId: selectedCustomerId,
          variantIds: selectedVariantIds,
        });

        if (!res.ok || requestId !== lastPriceRequestIdRef.current) return;

        const next: Record<string, CustomerLastVariantPriceBySource> = {};
        for (const row of res.prices) {
          next[row.variantId] = row;
        }

        setLastPriceByVariantId(next);
      } finally {
        if (requestId === lastPriceRequestIdRef.current) {
          setIsLoadingLastPrices(false);
        }
      }
    },
    [form],
  );

  const triggerLastPriceRefresh = React.useCallback(() => {
    setLastPriceRefreshTick((tick) => tick + 1);
  }, []);

  React.useEffect(() => {
    if (!watchedCustomerId || watchedVariantIds.length === 0) return;

    const onFocus = () => triggerLastPriceRefresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerLastPriceRefresh();
      }
    };

    const interval = window.setInterval(triggerLastPriceRefresh, 15000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [triggerLastPriceRefresh, watchedCustomerId, watchedVariantIds.length]);

  React.useEffect(() => {
    const variantIds = watchedVariantIdsKey
      ? watchedVariantIdsKey.split("|").filter(Boolean)
      : [];

    void loadLastPrices({
      customerId: watchedCustomerId,
      variantIds,
    });
  }, [
    loadLastPrices,
    watchedCustomerId,
    watchedVariantIdsKey,
    lastPriceRefreshTick,
  ]);

  const saveIndicator = (() => {
    if (!quotationId) return <Badge variant="secondary">Creating draft</Badge>;

    if (autosave.status === "saving")
      return <Badge variant="secondary">Saving</Badge>;

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

  // ---------------------------
  // 4) Finalize
  // ---------------------------
  async function onFinalize() {
    if (!quotationId) return;

    setIsFinalizing(true);

    try {
      const valid = await form.trigger(undefined, { shouldFocus: true });
      if (!valid) {
        console.log("Form errors:", form.formState.errors);
        return;
      }

      // force-save latest form state first
      const saveRes = await autosave.flushSave();
      if (!saveRes.ok) {
        if ((saveRes as any).code === "VERSION_CONFLICT") {
          toast.error(
            "This quotation was updated by another user. Refresh and continue from latest draft.",
          );
        } else {
          toast.error("Could not save latest draft before finalizing.");
        }
        return;
      }

      const res = await finalizeQuotationAction(quotationId);

      if (!res.ok) {
        toast.error(res.message || "Finalize failed");
        return;
      }

      toast.success("Quotation Created");

      router.push(`/dashboard/sales/quotations/${quotationId}`);
      window.open(`/quotations/${quotationId}/view`, "_blank");
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

  function duplicateItem(index: number) {
    const current = form.getValues(`items.${index}`);
    itemsFA.insert(index + 1, {
      ...current,
      id: crypto.randomUUID(),
      component:
        current.component?.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
        })) ?? [],
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
  // ---------------------------
  // Helpers: add/remove items
  // ---------------------------
  function addItem() {
    const id = crypto.randomUUID();
    const sortOrder = itemsFA.fields.length;

    itemsFA.append({
      id,
      productId: null,
      variantId: null,
      title: "",
      sku: null,
      typeNumber: null,
      description: null,
      rating: null,
      terminals: null,
      hardware: null,
      gasket: null,
      mounting: null,
      cableEntry: null,
      earthing: null,
      hsnCode: null,
      cutoutSize: null,
      plateSize: null,
      glass: null,
      wireGuard: null,
      variantType: null,
      size: null,
      rpm: null,
      kW: null,
      horsePower: null,
      poReference: null,
      qty: 1,
      unit: "Nos",
      unitPrice: "0.00",
      sortOrder,
      component: [],
      showVariantImages: false,
      showVariantDrawings: false,
      selectedVariantImageIds: [],
      selectedVariantDrawingIds: [],
      variantImagesSnapshot: [],
      variantDrawingsSnapshot: [],
    });
  }

  async function handleManualSave() {
    try {
      setIsSaving(true);
      const res = await autosave.flushSave();
      if (!res.ok) {
        if ((res as any).code === "VERSION_CONFLICT") {
          toast.error(
            "Draft conflict detected. Please refresh to load latest quotation changes.",
          );
        } else {
          toast.error("Manual save failed.");
        }
        return;
      }
      toast.success("Draft saved");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCustomerChange(customerId: string | null) {
    form.setValue("header.customerId", customerId, {
      shouldDirty: true,
      shouldTouch: true,
    });

    queueMicrotask(() => {
      void loadLastPrices({ customerId });
    });

    if (!customerId) return;

    await applyCustomerDefaults(customerId);
  }

  return (
    <div className="space-y-4">
      {/* Modal to create customer */}
      <ResponsiveModal
        onOpenChange={setOpenCreateCustomer}
        open={openCreateCustomer}
        trigger="">
        <CustomerForm
          mode="create"
          onCreated={(customer) => {
            void handleCustomerChange(customer.id);
            setOpenCreateCustomer(false);
          }}></CustomerForm>
      </ResponsiveModal>

      <div className="flex flex-col w-full items-start justify-between gap-3">
        {/* CTAs to help quotation */}
        <div className="flex flex-wrap w-full items-center justify-between gap-3">
          {/* Quotation Page Header */}
          <div className="space-y-1">
            <div className="text-xl font-semibold">New Quotation</div>
            <div className="text-sm text-muted-foreground">
              Draft autosaves automatically. Finalize to lock items & generate
              quote number.
            </div>
          </div>

          {/* Quotation Toolbar */}
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
            {/* Tabs */}
            <Tabs defaultValue="header" className="w-full">
              <TabsList className="h-12 gap-4">
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>

              <TabsContent value="header" className="mt-4">
                <Card className="">
                  <CardHeader>
                    <CardTitle>Quotation Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid lg:grid-cols-4 gap-4 gap-y-8 ">
                      <div className="flex flex-col gap-2">
                        <FormLabel>Customer</FormLabel>
                        <CustomerCombobox
                          value={form.watch("header.customerId")}
                          onChange={(id) => {
                            void handleCustomerChange(id);
                          }}
                          onCreateCustomer={() => {
                            setOpenCreateCustomer(true);
                          }}
                        />
                        {isApplyingCustomerDefaults ? (
                          <p className="text-xs text-muted-foreground">
                            Applying customer default terms...
                          </p>
                        ) : null}
                      </div>

                      <FormField
                        control={form.control}
                        name="header.clientName"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""} // âœ… converts null/undefined -> ""
                                placeholder="Mr. Feneel"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.receivedFromEmail"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Received From Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""} // âœ… converts null/undefined -> ""
                                placeholder="feneel@example.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="header.receivedFromPhone"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Received From Phone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""} // âœ… converts null/undefined -> ""
                                placeholder="9099064666"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="header.platform"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Platform</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[
                                    "WHATSAPP",
                                    "PHONE_CALL",
                                    "REDIFFMAIL",
                                    "INFO",
                                    "SALES1",
                                    "EECMINES",
                                    "WEBSITE",
                                    "INDIA_MART",
                                    "TRADE_INDIA",
                                    "DIRECT_VISIT",
                                    "REFERENCE",
                                    "OTHER",
                                  ].map((item) => {
                                    return (
                                      <SelectItem key={item} value={item}>
                                        {item}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.gst"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>GST</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select GST" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {gstOptions.map((gst) => {
                                    return (
                                      <SelectItem key={gst} value={gst}>
                                        {gst}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}></FormField>

                      <FormField
                        control={form.control}
                        name="header.packingCharges"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Packing Charges</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Packing Charges" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {packingCharges.map((packing) => {
                                    return (
                                      <SelectItem key={packing} value={packing}>
                                        {packing}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}></FormField>

                      <FormField
                        control={form.control}
                        name="header.transportationPayment"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Transportation Payment</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Transportation Payment" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {transportationPayment.map((transport) => {
                                    return (
                                      <SelectItem
                                        key={transport}
                                        value={transport}>
                                        {transport}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}></FormField>

                      <FormField
                        control={form.control}
                        name="header.paymentTerms"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Payment Terms</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value ?? undefined}
                                onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Payment Terms" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {paymentTerms.map((payment) => {
                                    return (
                                      <SelectItem key={payment} value={payment}>
                                        {payment}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage></FormMessage>
                          </FormItem>
                        )}></FormField>

                      <FormField
                        control={form.control}
                        name="header.discount"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Discount</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""} // âœ… converts null/undefined -> ""
                                placeholder="0%"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="header.deliveryDate"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Delivery Date</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? "4 weeks"} // âœ… converts null/undefined -> ""
                                placeholder="4 weeks"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="header.nextFollowupAt"
                        render={({ field }) => (
                          <FormItem className="flex flex-col  gap-2">
                            {(() => {
                              const selectedFollowupDate = draftToDate(
                                field.value as any,
                              );
                              return (
                                <>
                                  <FormLabel>Next follow-up date</FormLabel>

                                  <Popover
                                    open={openFollowup}
                                    onOpenChange={setOpenFollowup}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground",
                                          )}>
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {selectedFollowupDate
                                            ? format(
                                                selectedFollowupDate,
                                                "PPP",
                                              )
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
                                          selectedFollowupDate ??
                                          addDays(new Date(), 7)
                                        }
                                        onSelect={(date) => {
                                          field.onChange(date ?? null);
                                          setOpenFollowup(false);
                                        }}
                                        disabled={(date) =>
                                          date <
                                          new Date(
                                            new Date().setHours(0, 0, 0, 0),
                                          )
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
                                              setOpenFollowup(false);
                                            }}>
                                            {preset.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>

                                  <FormMessage />
                                </>
                              );
                            })()}
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-4 pt-4">
                      <FormField
                        control={form.control}
                        name="header.additionalNotes"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ""} // âœ… converts null/undefined -> ""
                                placeholder="Notes that appear in quotation..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="header.enquiryMessage"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormLabel>Enquiry Message</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ""} // âœ… converts null/undefined -> ""
                                placeholder="Any specific requirements or details about the enquiry..."
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
                      <CardTitle>Quotation Items</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Add quotation items, specifications, components and
                        pricing.
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
                        <QuotationItemRow
                          addnew={addItem}
                          key={field.id}
                          form={form!}
                          index={index}
                          isLoadingLastPrices={isLoadingLastPrices}
                          lastPriceByVariantId={lastPriceByVariantId}
                          onPriceHistoryRefresh={() => {
                            void loadLastPrices();
                          }}
                          onRemove={() => removeItem(index)}
                          onDuplicate={() => duplicateItem(index)}
                          onMoveUp={() => moveItemUp(index)}
                          onMoveDown={() => moveItemDown(index)}
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
                        Subtotal
                      </div>
                      <div className="text-2xl font-bold">
                        â‚¹
                        {(form.watch("items") ?? [])
                          .reduce((acc, item) => {
                            return (
                              acc +
                              Number(item.qty || 0) *
                                Number(item.unitPrice || 0)
                            );
                          }, 0)
                          .toFixed(2)}
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

export default QuotationFormNew;

interface QuotationItemRowProps {
  form: ReturnType<typeof useForm<QuotationDraftData>>;
  index: number;
  lastPriceByVariantId: Record<string, CustomerLastVariantPriceBySource>;
  isLoadingLastPrices: boolean;
  onPriceHistoryRefresh: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  addnew: () => void;
}

const QuotationItemRow: FC<QuotationItemRowProps> = ({
  form,
  index,
  lastPriceByVariantId,
  isLoadingLastPrices,
  onPriceHistoryRefresh,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  addnew,
}) => {
  const qty = form.watch(`items.${index}.qty`);
  const unitPrice = form.watch(`items.${index}.unitPrice`);
  const variantId = form.watch(`items.${index}.variantId`);
  const lineTotal = Number(qty || 0) * Number(unitPrice || 0);
  const title = form.watch(`items.${index}.title`);
  const sku = form.watch(`items.${index}.sku`);
  const componentFA = useFieldArray({
    control: form.control,
    name: `items.${index}.component` as never,
  });

  const variantImages =
    form.watch(`items.${index}.variantImagesSnapshot`) ?? [];
  const variantDrawings =
    form.watch(`items.${index}.variantDrawingsSnapshot`) ?? [];

  const selectedImageIds =
    form.watch(`items.${index}.selectedVariantImageIds`) ?? [];
  const selectedDrawingIds =
    form.watch(`items.${index}.selectedVariantDrawingIds`) ?? [];

  const showImages = form.watch(`items.${index}.showVariantImages`) ?? false;
  const showDrawings =
    form.watch(`items.${index}.showVariantDrawings`) ?? false;

  function isPdfFile(url?: string | null) {
    if (!url) return false;
    return url.toLowerCase().split("?")[0].endsWith(".pdf");
  }

  const summaryTitle = useMemo(() => {
    if (title?.trim()) return title;
    if (sku?.trim()) return sku;
    return `Item #${index + 1}`;
  }, [title, sku, index]);

  const lastPriceInfo =
    variantId && lastPriceByVariantId[variantId]
      ? lastPriceByVariantId[variantId]
      : null;

  const formattedInvoiceDate = lastPriceInfo?.lastInvoice?.sourceDate
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(lastPriceInfo.lastInvoice.sourceDate))
    : null;

  const formattedSalesOrderDate = lastPriceInfo?.lastSalesOrder?.sourceDate
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(lastPriceInfo.lastSalesOrder.sourceDate))
    : null;

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
                    Qty: {Number(qty || 0)} · Unit Price:
                    {Number(unitPrice || 0).toFixed(2)} · Total:
                    {lineTotal.toFixed(2)}
                  </p>
                  {lastPriceInfo?.lastInvoice ||
                  lastPriceInfo?.lastSalesOrder ? (
                    <div className="mt-1 space-y-1 text-xs text-emerald-700">
                      {lastPriceInfo.lastInvoice ? (
                        <p>
                          Last invoice price: Rs.{" "}
                          {Number(
                            lastPriceInfo.lastInvoice.unitPrice || 0,
                          ).toFixed(2)}{" "}
                          ({lastPriceInfo.lastInvoice.sourceNo}
                          {formattedInvoiceDate
                            ? ` on ${formattedInvoiceDate}`
                            : ""}
                          )
                          {lastPriceInfo.lastInvoice.sourcePoNumber
                            ? ` · PO ${lastPriceInfo.lastInvoice.sourcePoNumber}`
                            : ""}
                        </p>
                      ) : null}

                      {lastPriceInfo.lastSalesOrder ? (
                        <p>
                          Last order price: Rs.{" "}
                          {Number(
                            lastPriceInfo.lastSalesOrder.unitPrice || 0,
                          ).toFixed(2)}{" "}
                          ({lastPriceInfo.lastSalesOrder.sourceNo}
                          {formattedSalesOrderDate
                            ? ` on ${formattedSalesOrderDate}`
                            : ""}
                          )
                          {lastPriceInfo.lastSalesOrder.sourcePoNumber
                            ? ` · PO ${lastPriceInfo.lastSalesOrder.sourcePoNumber}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  ) : variantId && isLoadingLastPrices ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Loading last customer price...
                    </p>
                  ) : null}
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
                    Configure title, specs, quantity, pricing and components
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
                        queueMicrotask(() => {
                          onPriceHistoryRefresh();
                        });
                        return;
                      }

                      form.setValue(
                        `items.${index}.showVariantImages`,
                        images.length > 0,
                        { shouldDirty: true },
                      );

                      form.setValue(
                        `items.${index}.showVariantDrawings`,
                        drawings.length > 0,
                        { shouldDirty: true },
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
                        variant.component?.map((c) => ({
                          id: c.id ?? crypto.randomUUID(),
                          item: c.item ?? "",
                          unit: c.unit ?? "Nos.",
                        })) ?? [],
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        },
                      );
                      queueMicrotask(() => {
                        onPriceHistoryRefresh();
                      });
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
                          placeholder="Flameproof Junction Box"
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
                          placeholder="Enter item description"
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
                          placeholder="Ex d IIB"
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
                          placeholder="4 Terminals"
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
                          placeholder="SS"
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
                          placeholder="Wall Mount"
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
                          placeholder="2 x M20"
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
                          placeholder="2 Earth Studs"
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
                          placeholder="8537"
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
                  name={`items.${index}.qty`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value)}
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
                          {...field}
                          value={field.value ?? ""}
                          placeholder="0.00"
                        />
                      </FormControl>
                      {lastPriceInfo?.lastInvoice ||
                      lastPriceInfo?.lastSalesOrder ? (
                        <div className="space-y-1 text-xs text-emerald-700">
                          {lastPriceInfo.lastInvoice ? (
                            <p>
                              Last invoice: Rs.{" "}
                              {Number(
                                lastPriceInfo.lastInvoice.unitPrice || 0,
                              ).toFixed(2)}{" "}
                              ({lastPriceInfo.lastInvoice.sourceNo})
                              {lastPriceInfo.lastInvoice.sourcePoNumber
                                ? ` · PO ${lastPriceInfo.lastInvoice.sourcePoNumber}`
                                : ""}
                            </p>
                          ) : null}
                          {lastPriceInfo.lastSalesOrder ? (
                            <p>
                              Last order: Rs.{" "}
                              {Number(
                                lastPriceInfo.lastSalesOrder.unitPrice || 0,
                              ).toFixed(2)}{" "}
                              ({lastPriceInfo.lastSalesOrder.sourceNo})
                              {lastPriceInfo.lastSalesOrder.sourcePoNumber
                                ? ` · PO ${lastPriceInfo.lastSalesOrder.sourcePoNumber}`
                                : ""}
                            </p>
                          ) : null}
                        </div>
                      ) : variantId && isLoadingLastPrices ? (
                        <p className="text-xs text-muted-foreground">
                          Loading price history...
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-end md:col-span-3">
                  <div className="text-sm text-muted-foreground">
                    Line Total
                  </div>
                  <div className="text-lg font-semibold">
                    {formatCurrencyINR(lineTotal)}
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
                          placeholder="PO Ref"
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
                        className="grid gap-3 rounded-xl border p-3 md:grid-cols-12">
                        <FormField
                          control={form.control}
                          name={`items.${index}.component.${cIndex}.item`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-7">
                              <FormLabel>Component Item</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  placeholder="Component item"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.component.${cIndex}.unit`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-3">
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

                  <div className="space-y-4 rounded-xl border p-4">
                    <div>
                      <h4 className="font-medium">Quotation Media</h4>
                      <p className="text-xs text-muted-foreground">
                        Choose whether variant images and drawings should appear
                        in the quotation
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
                                  Include product images in quotation
                                </p>
                              </div>
                              <Checkbox
                                className="cursor-pointer"
                                checked={field.value ?? false}
                                onCheckedChange={(e) => field.onChange(e)}
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
                                  Include technical drawings in quotation
                                </p>
                              </div>
                              <Checkbox
                                className="cursor-pointer"
                                checked={field.value ?? false}
                                onCheckedChange={(e) => field.onChange(e)}
                              />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                      {variantImages.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            Select Images
                          </div>
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
                                            current.filter(
                                              (id) => id !== img.id,
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

                      {variantDrawings.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            Select Drawings
                          </div>
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
                                    key={drawing.id}
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
// <Card className="rounded-2xl border border-white">
//   <CardContent className="space-y-5 p-5">
//     <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//       <div>
//         <h3 className="font-semibold">Item #{index + 1}</h3>
//         <p className="text-xs text-muted-foreground">
//           Configure title, specs, quantity, pricing and components
//         </p>
//       </div>

//       <div className="flex items-center gap-2">
//         <Button
//           type="button"
//           variant="outline"
//           size="icon"
//           onClick={onMoveUp}>
//           <ArrowUp className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           size="icon"
//           onClick={onMoveDown}>
//           <ArrowDown className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           size="icon"
//           onClick={onDuplicate}>
//           <Copy className="h-4 w-4" />
//         </Button>
//         <Button
//           type="button"
//           variant="destructive"
//           size="icon"
//           onClick={onRemove}>
//           <Trash2 className="h-4 w-4" />
//         </Button>
//       </div>
//     </div>

//     <div className="grid gap-4 md:grid-cols-12">
//       <div className="md:col-span-6 space-y-2">
//         <FormLabel>Product Variant</FormLabel>
//         <ProductVariantCombobox
//           value={form.watch(`items.${index}.variantId`) ?? null}
//           onChange={(variant) => {
//             const images = variant?.images ?? [];
//             const drawings = variant?.drawings ?? [];

//             if (!variant) {
//               form.setValue(`items.${index}.productId`, null, {
//                 shouldDirty: true,
//               });
//               form.setValue(`items.${index}.variantId`, null, {
//                 shouldDirty: true,
//               });
//               form.setValue(`items.${index}.title`, "", {
//                 shouldDirty: true,
//               });
//               form.setValue(`items.${index}.sku`, null, {
//                 shouldDirty: true,
//               });
//               form.setValue(`items.${index}.typeNumber`, null, {
//                 shouldDirty: true,
//               });
//               form.setValue(`items.${index}.description`, null, {
//                 shouldDirty: true,
//               });
//               return;
//             }

//             form.setValue(
//               `items.${index}.showVariantImages`,
//               images.length > 0,
//               {
//                 shouldDirty: true,
//               },
//             );

//             form.setValue(
//               `items.${index}.showVariantDrawings`,
//               drawings.length > 0,
//               {
//                 shouldDirty: true,
//               },
//             );

//             form.setValue(
//               `items.${index}.selectedVariantImageIds`,
//               images.map((img) => img.id),
//               { shouldDirty: true },
//             );

//             form.setValue(
//               `items.${index}.selectedVariantDrawingIds`,
//               drawings.map((dr) => dr.id),
//               { shouldDirty: true },
//             );

//             form.setValue(
//               `items.${index}.variantImagesSnapshot`,
//               images.map((img) => ({
//                 id: img.id,
//                 url: img.url,
//                 alt: img.alt ?? null,
//               })),
//               { shouldDirty: true },
//             );

//             form.setValue(
//               `items.${index}.variantDrawingsSnapshot`,
//               drawings.map((dr) => ({
//                 id: dr.id,
//                 url: dr.url,
//                 title: dr.title ?? null,
//               })),
//               { shouldDirty: true },
//             );

//             form.setValue(`items.${index}.productId`, variant.productId, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.variantId`, variant.id, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.title`, variant.title, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.sku`, variant.sku, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.typeNumber`, variant.typeNumber, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.hardware`, variant.hardware, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.hsnCode`, variant.hsnCode, {
//               shouldDirty: true,
//             });

//             form.setValue(`items.${index}.rating`, variant.rating, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.terminals`, variant.terminals, {
//               shouldDirty: true,
//             });

//             form.setValue(`items.${index}.gasket`, variant.gasket, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.mounting`, variant.mounting, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.cableEntry`, variant.cableEntry, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.earthing`, variant.earthing, {
//               shouldDirty: true,
//             });

//             form.setValue(`items.${index}.cutoutSize`, variant.cutoutSize, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.plateSize`, variant.plateSize, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.glass`, variant.glass, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.wireGuard`, variant.wireGuard, {
//               shouldDirty: true,
//             });

//             form.setValue(`items.${index}.size`, variant.size, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.rpm`, variant.rpm, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.kW`, variant.kW, {
//               shouldDirty: true,
//             });
//             form.setValue(`items.${index}.horsePower`, variant.horsePower, {
//               shouldDirty: true,
//             });
//             form.setValue(
//               `items.${index}.component`,
//               variant.component?.map((c) => ({
//                 id: c.id ?? crypto.randomUUID(),
//                 item: c.item ?? "",
//                 unit: c.unit ?? "Nos.",
//               })) ?? [],
//               {
//                 shouldDirty: true,
//                 shouldTouch: true,
//                 shouldValidate: true,
//               },
//             );
//           }}
//         />
//       </div>
//       <FormField
//         control={form.control}
//         name={`items.${index}.title`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-6">
//             <FormLabel>Title</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="Flameproof Junction Box"
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.sku`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>SKU</FormLabel>
//             <FormControl>
//               <Input
//                 disabled
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="SKU"
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.typeNumber`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Type Number</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="Type Number"
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//     </div>

//     <div className="grid gap-4 md:grid-cols-12">
//       <FormField
//         control={form.control}
//         name={`items.${index}.description`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-12">
//             <FormLabel>Description</FormLabel>
//             <FormControl>
//               <Textarea
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="Enter item description"
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//     </div>

//     <div className="grid gap-4 md:grid-cols-12">
//       <FormField
//         control={form.control}
//         name={`items.${index}.rating`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Rating</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="Ex d IIB"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.terminals`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Terminals</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="4 Terminals"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.hardware`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Hardware</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="SS"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.mounting`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Mounting</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="Wall Mount"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />
//     </div>

//     <div className="grid gap-4 md:grid-cols-12">
//       <FormField
//         control={form.control}
//         name={`items.${index}.cableEntry`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Cable Entry</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="2 x M20"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.earthing`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Earthing</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="2 Earth Studs"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.hsnCode`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>HSN Code</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="8537"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.unit`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Unit</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="Nos"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />
//     </div>

//     <div className="grid gap-4 md:grid-cols-12">
//       <FormField
//         control={form.control}
//         name={`items.${index}.qty`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-2">
//             <FormLabel>Qty</FormLabel>
//             <FormControl>
//               <Input
//                 type="number"
//                 min={0}
//                 value={field.value ?? 0}
//                 onChange={(e) => field.onChange(e.target.value)}
//                 placeholder="1"
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       <FormField
//         control={form.control}
//         name={`items.${index}.unitPrice`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-3">
//             <FormLabel>Unit Price</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="0.00"
//               />
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />

//       <div className="md:col-span-3 flex flex-col justify-end">
//         <div className="text-sm text-muted-foreground">Line Total</div>
//         <div className="text-lg font-semibold">â‚¹{lineTotal.toFixed(2)}</div>
//       </div>

//       <FormField
//         control={form.control}
//         name={`items.${index}.poReference`}
//         render={({ field }) => (
//           <FormItem className="md:col-span-4">
//             <FormLabel>PO Reference</FormLabel>
//             <FormControl>
//               <Input
//                 {...field}
//                 value={field.value ?? ""}
//                 placeholder="PO Ref"
//               />
//             </FormControl>
//           </FormItem>
//         )}
//       />
//     </div>

//     <div className="rounded-xl border p-4">
//       <div className="mb-3 flex items-center justify-between gap-3">
//         <div>
//           <h4 className="font-medium">Components</h4>
//           <p className="text-xs text-muted-foreground">
//             Optional component details for this item
//           </p>
//         </div>

//         <Button
//           type="button"
//           variant="outline"
//           size="sm"
//           onClick={() =>
//             componentFA.append({
//               id: crypto.randomUUID(),
//               item: "",
//               unit: "Nos.",
//             } as never)
//           }>
//           <Plus className="mr-2 h-4 w-4" />
//           Add Component
//         </Button>
//       </div>

//       <div className="space-y-3">
//         {componentFA.fields.length === 0 ? (
//           <div className="text-sm text-muted-foreground">
//             No components added.
//           </div>
//         ) : (
//           componentFA.fields.map((field, cIndex) => (
//             <div
//               key={field.id}
//               className="grid gap-3 rounded-xl border p-3 md:grid-cols-12">
//               <FormField
//                 control={form.control}
//                 name={`items.${index}.component.${cIndex}.item`}
//                 render={({ field }) => (
//                   <FormItem className="md:col-span-7">
//                     <FormLabel>Component Item</FormLabel>
//                     <FormControl>
//                       <Input
//                         {...field}
//                         value={field.value ?? ""}
//                         placeholder="Component item"
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name={`items.${index}.component.${cIndex}.unit`}
//                 render={({ field }) => (
//                   <FormItem className="md:col-span-3">
//                     <FormLabel>Unit</FormLabel>
//                     <FormControl>
//                       <Input
//                         {...field}
//                         value={field.value ?? ""}
//                         placeholder="Nos."
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />

//               <div className="md:col-span-2 flex items-end">
//                 <Button
//                   type="button"
//                   variant="destructive"
//                   className="w-full"
//                   onClick={() => componentFA.remove(cIndex)}>
//                   Remove
//                 </Button>
//               </div>
//             </div>
//           ))
//         )}

//         <div className="rounded-xl border p-4 space-y-4">
//           <div>
//             <h4 className="font-medium">Quotation Media</h4>
//             <p className="text-xs text-muted-foreground">
//               Choose whether variant images and drawings should appear in
//               the quotation
//             </p>
//           </div>

//           <div className="grid gap-4 md:grid-cols-2">
//             <FormField
//               control={form.control}
//               name={`items.${index}.showVariantImages`}
//               render={({ field }) => (
//                 <FormItem className="rounded-lg border p-4">
//                   <div className="flex items-center justify-between gap-3">
//                     <div>
//                       <FormLabel>Show Images</FormLabel>
//                       <p className="text-xs text-muted-foreground">
//                         Include product images in quotation
//                       </p>
//                     </div>
//                     <Checkbox
//                       className="size-10! cursor-pointer"
//                       checked={field.value ?? false}
//                       onCheckedChange={(e) => field.onChange(e)}
//                     />
//                   </div>
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name={`items.${index}.showVariantDrawings`}
//               render={({ field }) => (
//                 <FormItem className="rounded-lg border p-4">
//                   <div className="flex items-center justify-between gap-3">
//                     <div>
//                       <FormLabel>Show Drawings</FormLabel>
//                       <p className="text-xs text-muted-foreground">
//                         Include technical drawings in quotation
//                       </p>
//                     </div>
//                     <Checkbox
//                       className="size-10! cursor-pointer"
//                       checked={field.value ?? false}
//                       onCheckedChange={(e) => field.onChange(e)}
//                     />
//                   </div>
//                 </FormItem>
//               )}
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-8">
//             {variantImages.length > 0 && (
//               <div className="space-y-3">
//                 <div className="text-sm font-medium">Select Images</div>
//                 <div className="flex gap-4 items-center">
//                   {variantImages.map((img) => {
//                     const checked = selectedImageIds.includes(img.id);

//                     return (
//                       <label
//                         key={img.id}
//                         className="flex cursor-pointer  h-full flex-col gap-2 rounded-sm border p-2 items-center">
//                         <div className="relative size-[487px] rounded-sm">
//                           <Image
//                             src={img.url}
//                             alt={img.title ?? "Variant image"}
//                             fill
//                             className=" object-contain rounded-sm"
//                           />
//                         </div>
//                         <div className="flex items-center justify-between gap-2">
//                           <span className="text-xs truncate">
//                             {img.title || "Variant image"}
//                           </span>
//                           <Checkbox
//                             checked={checked}
//                             onCheckedChange={(value) => {
//                               const isChecked = Boolean(value);
//                               const current =
//                                 form.getValues(
//                                   `items.${index}.selectedVariantImageIds`,
//                                 ) ?? [];

//                               if (isChecked) {
//                                 form.setValue(
//                                   `items.${index}.selectedVariantImageIds`,
//                                   [...current, img.id],
//                                   { shouldDirty: true },
//                                 );
//                               } else {
//                                 form.setValue(
//                                   `items.${index}.selectedVariantImageIds`,
//                                   current.filter((id) => id !== img.id),
//                                   { shouldDirty: true },
//                                 );
//                               }
//                             }}
//                           />
//                         </div>
//                       </label>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {variantDrawings.length > 0 && (
//               <div className="space-y-3">
//                 <div className="text-sm font-medium">Select Drawings</div>
//                 <div className="flex items-center gap-4">
//                   {variantDrawings.map((drawing) => {
//                     const checked = selectedDrawingIds.includes(drawing.id);

//                     return (
//                       <label
//                         key={drawing.id}
//                         className="flex cursor-pointer flex-col gap-2 rounded-sm border p-2 items-center">
//                         <div className="relative  rounded-sm">
//                           <PdfPreviewCard
//                             key={drawing.id}
//                             url={drawing.url}
//                             title={drawing.title || "Technical Drawing"}
//                             height={420}
//                           />
//                         </div>
//                         <div className="flex items-center justify-between gap-2">
//                           <span className="text-xs truncate">
//                             {drawing.title || "Technical drawing"}
//                           </span>
//                           <Checkbox
//                             checked={checked}
//                             onCheckedChange={(value) => {
//                               const isChecked = Boolean(value);
//                               const current =
//                                 form.getValues(
//                                   `items.${index}.selectedVariantDrawingIds`,
//                                 ) ?? [];

//                               if (isChecked) {
//                                 form.setValue(
//                                   `items.${index}.selectedVariantDrawingIds`,
//                                   [...current, drawing.id],
//                                   { shouldDirty: true },
//                                 );
//                               } else {
//                                 form.setValue(
//                                   `items.${index}.selectedVariantDrawingIds`,
//                                   current.filter((id) => id !== drawing.id),
//                                   { shouldDirty: true },
//                                 );
//                               }
//                             }}
//                           />
//                         </div>
//                       </label>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//     <Button type="button" className="w-full" onClick={addnew}>
//       <Plus className="mr-2 h-4 w-4" />
//       Add Item
//     </Button>
//   </CardContent>
// </Card>
