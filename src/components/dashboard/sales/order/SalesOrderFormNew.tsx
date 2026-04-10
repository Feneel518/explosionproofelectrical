"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Send } from "lucide-react";
import React, { FC } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";

import { finalizeSalesOrderAction } from "@/lib/actions/dashboard/sales/order/finalizeSalesOrderAction";
import { getPendingQuotationsForCustomerAction } from "@/lib/actions/dashboard/sales/order/getPendingQuotationsForCustomerAction";
import { useSalesOrderDraftAutosave } from "@/hooks/use-sales-order-draft-autosave";
import {
  CustomerSelectItem,
  PendingQuotationItem,
  SalesOrderDraftData,
} from "@/lib/types/SalesOrderTypes";
import {
  SalesOrderFormValues,
  SalesOrderSchema,
} from "@/lib/validators/dashboard/sales/orders/OrderValidator";

import SalesOrderHeaderTab from "./Form/SalesOrderHeaderTab";
import SalesOrderItemsTab from "./Form/SalesOrderItemsTab";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

interface SalesOrderFormNewProps {
  salesOrderId: string;
  initialDraft: SalesOrderFormValues;
  initialDraftVersion: number;
  orderFY: string;
  orderNo: number;
  customers: CustomerSelectItem[];
}

function dateToISO(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function draftToDate(value?: Date | string | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const SalesOrderFormNew: FC<SalesOrderFormNewProps> = ({
  salesOrderId,
  initialDraft,
  initialDraftVersion,
  orderFY,
  orderNo,
  customers,
}) => {
  const router = useRouter();

  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [openCreateCustomer, setOpenCreateCustomer] = React.useState(false);
  const [openPoDate, setOpenPoDate] = React.useState(false);
  const [openOrderDate, setOpenOrderDate] = React.useState(false);

  const [pendingQuotations, setPendingQuotations] = React.useState<
    PendingQuotationItem[]
  >([]);
  const [loadingQuotations, setLoadingQuotations] = React.useState(false);

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(SalesOrderSchema) as any,
    defaultValues: {
      ...initialDraft,
      header: {
        ...initialDraft.header,
        poDate: draftToDate(initialDraft.header?.poDate as any),
        orderDate: draftToDate(initialDraft.header?.orderDate as any),
      },
      items:
        initialDraft.items?.map((item, idx) => ({
          ...item,
          sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : idx,
          component:
            item.component?.map((c, cidx) => ({
              ...c,
              id: c.id ?? crypto.randomUUID(),
              sortOrder: Number.isFinite(c.sortOrder) ? c.sortOrder : cidx,
            })) ?? [],
        })) ?? [],
    },
    mode: "onChange",
  });

  const itemsFA = useFieldArray({
    control: form.control,
    name: "items",
  });

  const hydratedRef = React.useRef(false);

  const autosave = useSalesOrderDraftAutosave({
    salesOrderId,
    initialVersion: initialDraftVersion,
    enabled: Boolean(salesOrderId),
    getDraft: () => {
      const v = form.getValues();

      return {
        ...v,
        header: {
          ...v.header,
          poDate: dateToISO(v.header.poDate as any),
          orderDate: dateToISO(v.header.orderDate as any),
        },
        items: (v.items ?? []).map((it, idx) => ({
          ...it,
          sortOrder: Number.isFinite(it.sortOrder) ? it.sortOrder : idx,
          component:
            it.component?.map((c, cidx) => ({
              ...c,
              id: c.id ?? crypto.randomUUID(),
              sortOrder: Number.isFinite(c.sortOrder) ? c.sortOrder : cidx,
            })) ?? [],
        })),
      } as SalesOrderDraftData;
    },
    debounceMs: 1200,
  });

  React.useEffect(() => {
    if (!salesOrderId) return;

    hydratedRef.current = true;

    const sub = form.watch(() => {
      if (!hydratedRef.current) return;
      autosave.triggerSave();
    });

    return () => sub.unsubscribe();
  }, [form, autosave, salesOrderId]);

  const saveIndicator = (() => {
    if (!salesOrderId) {
      return <Badge variant="secondary">Creating draft</Badge>;
    }

    if (autosave.status === "saving") {
      return <Badge variant="secondary">Saving</Badge>;
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

  const watchedItems = form.watch("items") ?? [];

  const subtotal = watchedItems.reduce(
    (acc, item) => acc + Number(item.qty || 0) * Number(item.unitPrice || 0),
    0,
  );

  const totalOrderedQty = watchedItems.reduce(
    (acc, item) => acc + Number(item.qty || 0),
    0,
  );

  const totalDispatchedQty = watchedItems.reduce(
    (acc, item) => acc + Number(item.dispatchedQty || 0),
    0,
  );

  const totalInvoicedQty = watchedItems.reduce(
    (acc, item) => acc + Number(item.invoicedQty || 0),
    0,
  );

  const totalPendingQty = watchedItems.reduce(
    (acc, item) => acc + Number(item.pendingQty ?? item.qty ?? 0),
    0,
  );

  React.useEffect(() => {
    form.setValue("header.subtotal", subtotal, { shouldValidate: false });
    form.setValue("header.taxableTotal", subtotal, { shouldValidate: false });
    form.setValue("header.grandTotal", subtotal, { shouldValidate: false });

    form.setValue("header.totalItemsCount", watchedItems.length, {
      shouldValidate: false,
    });
    form.setValue("header.totalOrderedQty", totalOrderedQty, {
      shouldValidate: false,
    });
    form.setValue("header.totalDispatchedQty", totalDispatchedQty, {
      shouldValidate: false,
    });
    form.setValue("header.totalInvoicedQty", totalInvoicedQty, {
      shouldValidate: false,
    });
    form.setValue("header.totalPendingQty", totalPendingQty, {
      shouldValidate: false,
    });

    const isFullyDispatched =
      watchedItems.length > 0 &&
      watchedItems.every(
        (item) => Number(item.dispatchedQty || 0) >= Number(item.qty || 0),
      );

    const isFullyInvoiced =
      watchedItems.length > 0 &&
      watchedItems.every(
        (item) => Number(item.invoicedQty || 0) >= Number(item.qty || 0),
      );

    form.setValue("header.isFullyDispatched", isFullyDispatched, {
      shouldValidate: false,
    });

    form.setValue("header.isFullyInvoiced", isFullyInvoiced, {
      shouldValidate: false,
    });

    form.setValue("header.isClosed", isFullyInvoiced, {
      shouldValidate: false,
    });

    form.setValue("header.isOverdueForDispatch", false, {
      shouldValidate: false,
    });
  }, [
    subtotal,
    totalOrderedQty,
    totalDispatchedQty,
    totalInvoicedQty,
    totalPendingQty,
    watchedItems,
    form,
  ]);

  async function handleManualSave() {
    try {
      setIsSaving(true);
      const res = await autosave.flushSave();

      if (!res?.ok) {
        toast.error("Failed to save draft");
        return;
      }

      toast.success("Draft saved");
    } finally {
      setIsSaving(false);
    }
  }

  async function onFinalize() {
    if (!salesOrderId) return;

    setIsFinalizing(true);
    try {
      const valid = await form.trigger(undefined, { shouldFocus: true });

      if (!valid) {
        toast.error("Please fix form errors before finalizing");
        return;
      }

      const saveRes = await autosave.flushSave();

      if (!saveRes?.ok) {
        if ((saveRes as any)?.code === "VERSION_CONFLICT") {
          toast.error("Draft conflict detected");
        } else {
          toast.error("Draft save failed");
        }
        return;
      }

      const res = await finalizeSalesOrderAction(salesOrderId);

      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success("Sales order created");
      router.push(`/dashboard/sales/orders/${salesOrderId}`);
    } finally {
      setIsFinalizing(false);
    }
  }

  const customersMap = React.useMemo(() => {
    return new Map(customers.map((customer) => [customer.id, customer]));
  }, [customers]);

  async function loadPendingQuotations(customerId?: string | null) {
    if (!customerId) {
      setPendingQuotations([]);
      return;
    }

    setLoadingQuotations(true);
    try {
      const res = await getPendingQuotationsForCustomerAction(customerId);
      if (res.ok) {
        setPendingQuotations(res.items);
      } else {
        setPendingQuotations([]);
      }
    } finally {
      setLoadingQuotations(false);
    }
  }

  async function applyCustomerToHeader(customerId: string | null) {
    const previousCustomerId = form.getValues("header.customerId") ?? null;
    const linkedQuotationId = form.getValues("header.quotationId") ?? "";
    const hasLinkedQuotation = Boolean(linkedQuotationId);
    const customerChanged = previousCustomerId !== customerId;

    form.setValue("header.customerId", customerId, {
      shouldDirty: true,
      shouldTouch: true,
    });

    if (hasLinkedQuotation && customerChanged) {
      form.setValue("header.quotationId", "", { shouldDirty: true });
      form.setValue("header.sourceType", "DIRECT", { shouldDirty: true });
      form.setValue("header.isConvertedFromQuotation", false, {
        shouldDirty: true,
      });
      toast.info("Quotation link removed because customer was changed");
    }

    if (!customerId) {
      form.setValue("header.clientName", "", { shouldDirty: true });
      form.setValue("header.clientNameSnapshot", "", { shouldDirty: true });
      form.setValue("header.citySnapshot", "", { shouldDirty: true });
      form.setValue("header.stateSnapshot", "", { shouldDirty: true });
      form.setValue("header.gstinSnapshot", "", { shouldDirty: true });
      form.setValue("header.quotationId", "", { shouldDirty: true });
      form.setValue("header.sourceType", "DIRECT", { shouldDirty: true });
      form.setValue("header.isConvertedFromQuotation", false, {
        shouldDirty: true,
      });
      setPendingQuotations([]);
      return;
    }

    const customer = customersMap.get(customerId);

    if (customer) {
      const name = customer.companyName ?? "";

      form.setValue("header.clientName", name, {
        shouldDirty: true,
        shouldTouch: true,
      });

      form.setValue("header.clientNameSnapshot", name, {
        shouldDirty: true,
        shouldTouch: true,
      });

      form.setValue("header.citySnapshot", customer.city ?? "", {
        shouldDirty: true,
        shouldTouch: true,
      });

      form.setValue("header.stateSnapshot", customer.state ?? "", {
        shouldDirty: true,
        shouldTouch: true,
      });

      form.setValue("header.gstinSnapshot", customer.gstin ?? "", {
        shouldDirty: true,
        shouldTouch: true,
      });

      if (customer.companyPhone) {
        form.setValue("header.receivedFromPhone", customer.companyPhone, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      if (customer.companyEmail) {
        form.setValue("header.receivedFromEmail", customer.companyEmail, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    }

    await loadPendingQuotations(customerId);
  }

  const selectedCustomerId = form.watch("header.customerId");

  React.useEffect(() => {
    loadPendingQuotations(selectedCustomerId);
  }, [selectedCustomerId]);

  function syncSortOrder() {
    const current = form.getValues("items");

    current.forEach((_, index) => {
      form.setValue(`items.${index}.sortOrder`, index, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });

      const components = form.getValues(`items.${index}.component`) ?? [];
      components.forEach((_, cIndex) => {
        form.setValue(`items.${index}.component.${cIndex}.sortOrder`, cIndex, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });
      });
    });
  }

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
      showVariantImages: false,
      showVariantDrawings: false,
      selectedVariantImageIds: [],
      selectedVariantDrawingIds: [],
      variantImagesSnapshot: [],
      variantDrawingsSnapshot: [],
      qty: 1,
      unit: "Nos",
      unitPrice: 0,
      dispatchedQty: 0,
      invoicedQty: 0,
      pendingQty: 1,
      lineSubtotal: 0,
      lineGstTotal: 0,
      lineGrandTotal: 0,
      component: [],
      sortOrder,
    });
  }

  function duplicateItem(index: number) {
    const current = form.getValues(`items.${index}`);

    itemsFA.insert(index + 1, {
      ...current,
      id: crypto.randomUUID(),
      component:
        current.component?.map((c, idx) => ({
          ...c,
          id: crypto.randomUUID(),
          sortOrder: idx,
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

  function applyQuotationToOrder(quotation: any) {
    const current = form.getValues();

    const mappedItems =
      quotation.items?.map((item: any, index: number) => ({
        id: crypto.randomUUID(),
        productId: item.productId ?? null,
        variantId: item.variantId ?? null,
        title: item.title ?? "",
        sku: item.sku ?? null,
        typeNumber: item.typeNumber ?? null,
        description: item.description ?? null,
        rating: item.rating ?? null,
        terminals: item.terminals ?? null,
        hardware: item.hardware ?? null,
        gasket: item.gasket ?? null,
        mounting: item.mounting ?? null,
        cableEntry: item.cableEntry ?? null,
        earthing: item.earthing ?? null,
        hsnCode: item.hsnCode ?? null,
        cutoutSize: item.cutoutSize ?? null,
        plateSize: item.plateSize ?? null,
        glass: item.glass ?? null,
        wireGuard: item.wireGuard ?? null,
        variantType: item.variantType ?? null,
        size: item.size ?? null,
        rpm: item.rpm ?? null,
        kW: item.kW ?? null,
        horsePower: item.horsePower ?? null,
        poReference: item.poReference ?? null,
        showVariantImages: Boolean(item.showVariantImages),
        showVariantDrawings: Boolean(item.showVariantDrawings),
        selectedVariantImageIds: item.selectedVariantImageIds ?? [],
        selectedVariantDrawingIds: item.selectedVariantDrawingIds ?? [],
        variantImagesSnapshot: Array.isArray(item.variantImagesSnapshot)
          ? item.variantImagesSnapshot
          : [],
        variantDrawingsSnapshot: Array.isArray(item.variantDrawingsSnapshot)
          ? item.variantDrawingsSnapshot
          : [],
        qty: Number(item.qty ?? 1),
        unit: item.unit ?? "Nos",
        unitPrice: Number(item.unitPrice ?? 0),
        dispatchedQty: 0,
        invoicedQty: 0,
        pendingQty: Number(item.qty ?? 1),
        lineSubtotal: Number(item.qty ?? 1) * Number(item.unitPrice ?? 0),
        lineGstTotal: 0,
        lineGrandTotal: Number(item.qty ?? 1) * Number(item.unitPrice ?? 0),
        component:
          item.ComponentsOfProductInQuotation?.map(
            (c: any, cIndex: number) => ({
              id: crypto.randomUUID(),
              item: c.componentsOfQuotation?.item ?? "",
              unit: c.componentsOfQuotation?.unit ?? "Nos.",
              qty: null,
              sortOrder: cIndex,
            }),
          ) ?? [],
        sortOrder: Number(item.sortOrder ?? index),
      })) ?? [];

    form.reset({
      ...current,
      header: {
        ...current.header,
        quotationId: quotation.id,
        sourceType: "QUOTATION",
        isConvertedFromQuotation: true,
        isClosed: false,
        isFullyDispatched: false,
        isFullyInvoiced: false,
        isOverdueForDispatch: false,
        customerId: quotation.customerId ?? current.header.customerId ?? null,
        clientName: quotation.clientName ?? current.header.clientName ?? "",
        additionalNotes: quotation.additionalNotes ?? "",
        deliveryDate: quotation.deliveryDate ?? "",
        gst: quotation.gst ?? current.header.gst,
        packingCharges:
          quotation.packingCharges ?? current.header.packingCharges,
        paymentTerms: quotation.paymentTerms ?? current.header.paymentTerms,
        transportationPayment:
          quotation.transportationPayment ??
          current.header.transportationPayment,
        discount: quotation.discount ?? "",
      },
      items: mappedItems,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col w-full items-start justify-between gap-3">
        <div className="flex flex-wrap w-full items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xl font-semibold">New Sales Order</div>
            <div className="text-sm text-muted-foreground">
              Draft autosaves automatically. Finalize to confirm the order.
            </div>
            <div className="text-sm text-muted-foreground">
              Order:{" "}
              <span className="font-medium text-foreground">
                {formatFinancialDocumentNumber(orderFY, orderNo)}
              </span>
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
                <SalesOrderHeaderTab
                  form={form}
                  customers={customers}
                  pendingQuotations={pendingQuotations}
                  loadingQuotations={loadingQuotations}
                  openCreateCustomer={openCreateCustomer}
                  setOpenCreateCustomer={setOpenCreateCustomer}
                  openPoDate={openPoDate}
                  setOpenPoDate={setOpenPoDate}
                  openOrderDate={openOrderDate}
                  setOpenOrderDate={setOpenOrderDate}
                  applyCustomerToHeader={applyCustomerToHeader}
                  applyQuotationToOrder={applyQuotationToOrder}
                  watchedItemsLength={watchedItems.length}
                  totalOrderedQty={totalOrderedQty}
                  totalDispatchedQty={totalDispatchedQty}
                  totalInvoicedQty={totalInvoicedQty}
                  totalPendingQty={totalPendingQty}
                  subtotal={subtotal}
                />
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <SalesOrderItemsTab
                  form={form}
                  fields={itemsFA.fields}
                  addItem={addItem}
                  duplicateItem={duplicateItem}
                  moveItemUp={moveItemUp}
                  moveItemDown={moveItemDown}
                  removeItem={removeItem}
                  watchedItemsLength={watchedItems.length}
                  subtotal={subtotal}
                />
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SalesOrderFormNew;
