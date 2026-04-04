"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { ProductMediaKind } from "@prisma/client";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/dashboard/global/FileUpload";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CustomerCombobox } from "@/components/dashboard/global/CustomerCombobox";
import { ProductVariantCombobox } from "@/components/dashboard/global/ProductVariantCombobox";
import { updateInvoiceDraftAction } from "@/lib/actions/dashboard/sales/invoice/updateInvoiceDraftData";
import { finalizeInvoiceAction } from "@/lib/actions/dashboard/sales/invoice/finalizeInvoiceAction";
import { useRouter } from "nextjs-toploader/app";
import { MediaItem } from "@/lib/actions/dashboard/sales/invoice/getInvoiceEditDataAction";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { getCustomerForSelectById } from "@/lib/actions/dashboard/global/getCustomerForSelectById";
import type { ProductVariantSearchItem } from "@/lib/types/ProductVariantSeachItem";

type PendingItem = {
  id: string;
  productId: string | null;
  variantId: string | null;
  title: string | null;
  sku: string | null;
  typeNumber: string | null;
  description: string | null;
  hsnCode: string | null;
  unit: string | null;
  qty: number;
  invoicedQty: number;
  dispatchedQty: number;
  remainingQty: number;
  unitPrice: number;
  sortOrder: number;
};

type InvoiceEditData = {
  id: string;
  invoiceNo: number;
  invoiceFy: string;
  status: string;
  invoiceDate: string | Date;
  poNumber: string | null;
  poDate?: string | Date | null;
  clientNameSnapshot: string | null;
  citySnapshot: string | null;
  stateSnapshot: string | null;
  gstinSnapshot: string | null;
  dispatchDate: string | Date | null;
  transporterName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  dispatchThrough: string | null;
  lrNumber: string | null;
  remarks: string | null;
  ewayBill: string | null;
  salesOrderId: string | null;
  customerId: string | null;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  draftData?: {
    header?: {
      customerId?: string | null;
      clientNameSnapshot?: string | null;
      citySnapshot?: string | null;
      stateSnapshot?: string | null;
      gstinSnapshot?: string | null;
      invoiceNo?: number | null;
      invoiceDate?: string | null;
      dispatchDate?: string | null;
      poNumber?: string | null;
      transporterName?: string | null;
      vehicleNumber?: string | null;
      driverName?: string | null;
      driverPhone?: string | null;
      dispatchThrough?: string | null;
      lrNumber?: string | null;
      ewayBill?: string | null;
      remarks?: string | null;
      lrCopy?: MediaItem[];
    };
    items?: Array<{
      id?: string;
      salesOrderItemId: string;
      isManual?: boolean;
      productId?: string | null;
      variantId?: string | null;
      selected?: boolean;
      title?: string | null;
      sku?: string | null;
      typeNumber?: string | null;
      description?: string | null;
      hsnCode?: string | null;
      unit?: string | null;
      orderedQty?: number;
      alreadyInvoiced?: number;
      alreadyDispatched?: number;
      remainingQty?: number;
      qty?: number;
      cimfrNumber?: string | null;
      pesoNumber?: string | null;
      serialNumber?: string | null;
      productPicture?: MediaItem[];
      unitPrice?: number;
      lineSubtotal?: number;
      sortOrder?: number;
    }>;
    packages?: unknown[];
  } | null;
  lrCopy?: MediaItem[];
  pendingItems: PendingItem[];
};

type DraftInvoiceItem = NonNullable<
  NonNullable<InvoiceEditData["draftData"]>["items"]
>[number];

const mediaSchema = z.object({
  kind: z.nativeEnum(ProductMediaKind),
  url: z.string(),
  title: z.string().nullable().optional(),
});

const itemSchema = z.object({
  salesOrderItemId: z.string(),
  isManual: z.boolean().default(false),
  productId: z.string().nullable().optional(),
  variantId: z.string().nullable().optional(),
  selected: z.boolean().default(false),

  title: z.string(),
  sku: z.string().nullable().optional(),
  typeNumber: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),

  orderedQty: z.number(),
  alreadyInvoiced: z.number(),
  alreadyDispatched: z.number(),
  remainingQty: z.number(),

  qty: z.coerce.number().int().min(0),

  cimfrNumber: z.string().nullable().optional(),
  pesoNumber: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),

  productPicture: z.array(mediaSchema).default([]),

  unitPrice: z.number(),
  lineSubtotal: z.number(),
  sortOrder: z.number(),
});

const packageItemSchema = z.object({
  salesOrderItemId: z.string(),
  qty: z.coerce.number().int().min(0).default(0),
});

const packageSchema = z.object({
  packageNo: z.string().trim().min(1, "Package number is required"),
  packageType: z.string().trim().optional().nullable(),
  label: z.string().trim().optional().nullable(),
  remarks: z.string().trim().optional().nullable(),
  grossWeight: z.string().optional().nullable(),
  netWeight: z.string().optional().nullable(),
  items: z.array(packageItemSchema).default([]),
});

const formSchema = z
  .object({
    header: z.object({
      customerId: z.string().nullable().optional(),
      invoiceNo: z.coerce.number().int().min(1, "Invoice number is required"),
      invoiceDate: z.date("Invoice date is required"),
      dispatchDate: z.date().nullable().optional(),
      poNumber: z.string().optional(),
      transporterName: z.string().optional(),
      vehicleNumber: z.string().optional(),
      driverName: z.string().optional(),
      driverPhone: z.string().optional(),
      dispatchThrough: z.string().optional(),
      lrNumber: z.string().optional(),
      ewayBill: z.string().optional(),
      remarks: z.string().optional(),
      clientNameSnapshot: z.string().optional(),
      citySnapshot: z.string().optional(),
      stateSnapshot: z.string().optional(),
      gstinSnapshot: z.string().optional(),
      lrCopy: z.array(mediaSchema).default([]),
    }),
    items: z.array(itemSchema),
    packages: z.array(packageSchema).default([]),
  })
  .superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (!item.selected) return;

      const maxQty = item.isManual
        ? Number.POSITIVE_INFINITY
        : Math.max(
            0,
            Math.min(
              Number(item.remainingQty || 0),
              Number(item.orderedQty || 0),
            ),
          );

      if (item.qty <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "qty"],
          message: "Qty must be greater than 0",
        });
      }

      if (Number.isFinite(maxQty) && item.qty > maxQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "qty"],
          message: `Qty cannot exceed max qty (${maxQty})`,
        });
      }
    });

    const selectedQtyByItemId = new Map(
      data.items
        .filter((item) => item.selected)
        .map((item) => [item.salesOrderItemId, Number(item.qty || 0)]),
    );

    const allocatedQtyByItemId = new Map<string, number>();

    data.packages.forEach((pkg, pkgIndex) => {
      pkg.items.forEach((pkgItem, itemIndex) => {
        const qty = Number(pkgItem.qty || 0);
        if (qty <= 0) return;

        if (!selectedQtyByItemId.has(pkgItem.salesOrderItemId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["packages", pkgIndex, "items", itemIndex, "qty"],
            message:
              "Package allocation item must be selected in invoice items",
          });
          return;
        }

        const running = allocatedQtyByItemId.get(pkgItem.salesOrderItemId) ?? 0;
        allocatedQtyByItemId.set(pkgItem.salesOrderItemId, running + qty);
      });
    });

    allocatedQtyByItemId.forEach((allocatedQty, salesOrderItemId) => {
      const selectedQty = selectedQtyByItemId.get(salesOrderItemId) ?? 0;
      if (allocatedQty > selectedQty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["packages"],
          message: `Packaging allocation exceeds invoice qty for item ${salesOrderItemId}`,
        });
      }
    });
  });

type FormValues = z.infer<typeof formSchema>;

interface InvoiceEditFormProps {
  invoice: InvoiceEditData;
}

function toDate(value?: string | Date | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function displayValue(
  value: string | number | null | undefined,
  placeholder = "-",
) {
  if (value === null || value === undefined) return placeholder;
  if (typeof value === "string" && value.trim() === "") return placeholder;
  return String(value);
}

function trimOrNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function DatePickerField({
  value,
  onChange,
  placeholder,
}: {
  value?: Date | null;
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
          selected={value ?? undefined}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createManualInvoiceItem(index: number): FormValues["items"][number] {
  const id = crypto.randomUUID();
  return {
    salesOrderItemId: id,
    isManual: true,
    productId: null,
    variantId: null,
    selected: true,
    title: "",
    sku: null,
    typeNumber: null,
    description: null,
    hsnCode: null,
    unit: "Nos",
    orderedQty: 1,
    alreadyInvoiced: 0,
    alreadyDispatched: 0,
    remainingQty: 1,
    qty: 1,
    cimfrNumber: null,
    pesoNumber: null,
    serialNumber: null,
    productPicture: [],
    unitPrice: 0,
    lineSubtotal: 0,
    sortOrder: index,
  };
}

function mapDraftItemToForm(
  item: DraftInvoiceItem,
  fallbackIndex: number,
): FormValues["items"][number] {
  const qty = Math.max(0, Number(item.qty ?? 0));
  const unitPrice = Number(item.unitPrice ?? 0);
  const itemKey = item.salesOrderItemId || item.id || crypto.randomUUID();

  return {
    salesOrderItemId: itemKey,
    isManual: item.isManual ?? true,
    productId: item.productId ?? null,
    variantId: item.variantId ?? null,
    selected: typeof item.selected === "boolean" ? item.selected : true,
    title: item.title ?? "",
    sku: item.sku ?? null,
    typeNumber: item.typeNumber ?? null,
    description: item.description ?? null,
    hsnCode: item.hsnCode ?? null,
    unit: item.unit ?? "Nos",
    orderedQty: Number((item.orderedQty ?? qty) || 0),
    alreadyInvoiced: Number(item.alreadyInvoiced ?? 0),
    alreadyDispatched: Number(item.alreadyDispatched ?? 0),
    remainingQty: Number((item.remainingQty ?? qty) || 0),
    qty,
    cimfrNumber: item.cimfrNumber ?? null,
    pesoNumber: item.pesoNumber ?? null,
    serialNumber: item.serialNumber ?? null,
    productPicture: item.productPicture ?? [],
    unitPrice,
    lineSubtotal: qty * unitPrice,
    sortOrder: Number(item.sortOrder ?? fallbackIndex),
  };
}

function buildInvoiceDraftPayload(values: FormValues) {
  const selected = values.items
    .filter((item) => item.selected)
    .map((item) => {
      const maxQty = item.isManual
        ? Number.POSITIVE_INFINITY
        : Math.max(
            0,
            Math.min(
              Number(item.remainingQty || 0),
              Number(item.orderedQty || 0),
            ),
          );

      const safeQty = Number.isFinite(maxQty)
        ? Math.max(0, Math.min(Number(item.qty || 0), maxQty))
        : Math.max(0, Number(item.qty || 0));
      const lineSubtotal = round2(safeQty * Number(item.unitPrice || 0));

      return {
        ...item,
        qty: safeQty,
        lineSubtotal,
        lineGstTotal: 0,
        lineGrandTotal: lineSubtotal,
      };
    })
    .filter((item) => item.qty > 0);

  const subtotal = round2(
    selected.reduce((acc, item) => acc + Number(item.lineSubtotal || 0), 0),
  );

  const taxableTotal = round2(Math.max(0, subtotal));
  const gstTotal = round2((taxableTotal * 18) / 100);
  const grandTotal = round2(taxableTotal + gstTotal);

  const finalItems = selected.map((item) => {
    const itemTaxable = round2(Number(item.lineSubtotal));
    const itemGst = round2((itemTaxable * 18) / 100);
    const itemGrand = round2(itemTaxable + itemGst);

    return {
      ...item,
      lineTaxableTotal: itemTaxable,
      lineGstTotal: itemGst,
      lineGrandTotal: itemGrand,
    };
  });

  const selectedQtyByItemId = new Map(
    finalItems.map((item) => [item.salesOrderItemId, Number(item.qty || 0)]),
  );

  const finalPackages = (values.packages ?? [])
    .map((pkg, pkgIndex) => {
      const packageItems = (pkg.items ?? [])
        .map((pkgItem) => {
          const selectedQty = selectedQtyByItemId.get(pkgItem.salesOrderItemId);
          if (!selectedQty) return null;

          const safeQty = Math.max(
            0,
            Math.min(Number(pkgItem.qty || 0), selectedQty),
          );

          if (safeQty <= 0) return null;

          return {
            salesOrderItemId: pkgItem.salesOrderItemId,
            qty: safeQty,
          };
        })
        .filter(
          (pkgItem): pkgItem is { salesOrderItemId: string; qty: number } =>
            Boolean(pkgItem),
        );

      const grossWeight = trimOrNull(pkg.grossWeight)
        ? Number(pkg.grossWeight)
        : null;
      const netWeight = trimOrNull(pkg.netWeight)
        ? Number(pkg.netWeight)
        : null;

      return {
        packageNo: trimOrNull(pkg.packageNo) ?? String(pkgIndex + 1),
        packageType: trimOrNull(pkg.packageType),
        label: trimOrNull(pkg.label),
        remarks: trimOrNull(pkg.remarks),
        grossWeight:
          grossWeight !== null && Number.isFinite(grossWeight)
            ? round2(grossWeight)
            : null,
        netWeight:
          netWeight !== null && Number.isFinite(netWeight)
            ? round2(netWeight)
            : null,
        items: packageItems,
      };
    })
    .filter((pkg) => pkg.items.length > 0);

  return {
    header: {
      ...values.header,
      invoiceDate: values.header.invoiceDate.toISOString(),
      dispatchDate: values.header.dispatchDate
        ? values.header.dispatchDate.toISOString()
        : null,
      subtotal,

      taxableTotal,
      gstTotal,
      grandTotal,
    },
    items: finalItems,
    packages: finalPackages,
  };
}

export default function InvoiceEditForm({ invoice }: InvoiceEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [isApplyingCustomerDefaults, setIsApplyingCustomerDefaults] =
    React.useState(false);
  const isOfflineInvoice = !invoice.salesOrderId;
  const draftHeader = invoice.draftData?.header ?? {};
  const draftItems = Array.isArray(invoice.draftData?.items)
    ? invoice.draftData.items
    : [];
  const draftPackages = Array.isArray(invoice.draftData?.packages)
    ? invoice.draftData.packages
    : [];

  const draftItemIdToSalesOrderItemId = new Map(
    draftItems
      .map((item) => {
        const draftItemId =
          typeof (item as { id?: unknown }).id === "string"
            ? ((item as { id?: string }).id ?? null)
            : null;

        const salesOrderItemId =
          typeof item.salesOrderItemId === "string"
            ? item.salesOrderItemId
            : null;

        if (!draftItemId || !salesOrderItemId) return null;

        return [draftItemId, salesOrderItemId] as const;
      })
      .filter((row): row is readonly [string, string] => Boolean(row)),
  );

  const defaultValues: FormValues = {
    header: {
      customerId: draftHeader.customerId ?? invoice.customerId ?? null,
      invoiceNo: Number(draftHeader.invoiceNo ?? invoice.invoiceNo ?? 1),
      invoiceDate:
        toDate(draftHeader.invoiceDate) ??
        toDate(invoice.invoiceDate) ??
        new Date(),
      dispatchDate:
        toDate(draftHeader.dispatchDate) ??
        toDate(invoice.dispatchDate) ??
        null,
      poNumber: draftHeader.poNumber ?? invoice.poNumber ?? "",
      transporterName:
        draftHeader.transporterName ?? invoice.transporterName ?? "",
      vehicleNumber: draftHeader.vehicleNumber ?? invoice.vehicleNumber ?? "",
      driverName: draftHeader.driverName ?? invoice.driverName ?? "",
      driverPhone: draftHeader.driverPhone ?? invoice.driverPhone ?? "",
      dispatchThrough:
        draftHeader.dispatchThrough ?? invoice.dispatchThrough ?? "",
      lrNumber: draftHeader.lrNumber ?? invoice.lrNumber ?? "",
      ewayBill: draftHeader.ewayBill ?? invoice.ewayBill ?? "",
      remarks: draftHeader.remarks ?? invoice.remarks ?? "",
      clientNameSnapshot:
        draftHeader.clientNameSnapshot ?? invoice.clientNameSnapshot ?? "",
      citySnapshot: draftHeader.citySnapshot ?? invoice.citySnapshot ?? "",
      stateSnapshot: draftHeader.stateSnapshot ?? invoice.stateSnapshot ?? "",
      gstinSnapshot: draftHeader.gstinSnapshot ?? invoice.gstinSnapshot ?? "",
      lrCopy: draftHeader.lrCopy ?? invoice.lrCopy ?? [],
    },

    items: (() => {
      const pendingMapped = invoice.pendingItems.map((item, index) => {
        const existing = draftItems.find((d) => d.salesOrderItemId === item.id);

        const maxQty = Math.max(
          0,
          Math.min(Number(item.remainingQty ?? 0), Number(item.qty ?? 0)),
        );

        const rawQty = Number(existing?.qty ?? maxQty);
        const safeQty = Math.max(0, Math.min(rawQty, maxQty));
        const unitPrice = Number(existing?.unitPrice ?? item.unitPrice ?? 0);

        return {
          salesOrderItemId: item.id,
          isManual: Boolean(existing?.isManual),
          productId: existing?.productId ?? item.productId ?? null,
          variantId: existing?.variantId ?? item.variantId ?? null,
          selected:
            typeof existing?.selected === "boolean"
              ? existing.selected
              : Boolean(existing),

          title: item.title ?? "",
          sku: item.sku ?? null,
          typeNumber: existing?.typeNumber ?? item.typeNumber ?? null,
          description: existing?.description ?? item.description ?? null,
          hsnCode: existing?.hsnCode ?? item.hsnCode ?? null,
          unit: item.unit ?? null,

          orderedQty: Number(item.qty ?? 0),
          alreadyInvoiced: Number(item.invoicedQty ?? 0),
          alreadyDispatched: Number(item.dispatchedQty ?? 0),
          remainingQty: Number(item.remainingQty ?? 0),

          qty: safeQty,

          cimfrNumber: existing?.cimfrNumber ?? null,
          pesoNumber: existing?.pesoNumber ?? null,
          serialNumber: existing?.serialNumber ?? null,

          productPicture: existing?.productPicture ?? [],

          unitPrice,
          lineSubtotal: safeQty * unitPrice,
          sortOrder: existing?.sortOrder ?? item.sortOrder ?? index,
        };
      });

      const pendingIds = new Set(pendingMapped.map((item) => item.salesOrderItemId));

      const manualOrExtraDraftItems = draftItems
        .filter(
          (item) =>
            Boolean(item.isManual) || !pendingIds.has(item.salesOrderItemId),
        )
        .map((item, index) => mapDraftItemToForm(item, pendingMapped.length + index));

      const merged = [...pendingMapped, ...manualOrExtraDraftItems]
        .filter((item) => Boolean(item.salesOrderItemId))
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

      if (merged.length > 0) {
        return merged;
      }

      if (draftItems.length > 0) {
        return draftItems
          .map((item, index) => mapDraftItemToForm(item, index))
          .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
      }

      return [createManualInvoiceItem(0)];
    })(),
    packages: draftPackages
      .map((pkg, index) => {
        if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) return null;

        const row = pkg as {
          packageNo?: unknown;
          packageType?: unknown;
          label?: unknown;
          remarks?: unknown;
          grossWeight?: unknown;
          netWeight?: unknown;
          items?: unknown;
        };

        const packageItemsRaw = Array.isArray(row.items) ? row.items : [];

        const items = packageItemsRaw
          .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item))
              return null;

            const packageItem = item as {
              salesOrderItemId?: unknown;
              invoiceItemDraftId?: unknown;
              qty?: unknown;
            };

            const salesOrderItemIdDirect =
              typeof packageItem.salesOrderItemId === "string"
                ? packageItem.salesOrderItemId
                : null;
            const draftItemId =
              typeof packageItem.invoiceItemDraftId === "string"
                ? packageItem.invoiceItemDraftId
                : null;

            const salesOrderItemId =
              salesOrderItemIdDirect ??
              (draftItemId
                ? (draftItemIdToSalesOrderItemId.get(draftItemId) ?? null)
                : null);

            if (!salesOrderItemId) return null;

            return {
              salesOrderItemId,
              qty: Number(packageItem.qty ?? 0),
            };
          })
          .filter(
            (
              item,
            ): item is {
              salesOrderItemId: string;
              qty: number;
            } => Boolean(item),
          );

        const packageNo =
          typeof row.packageNo === "string" && row.packageNo.trim()
            ? row.packageNo
            : String(index + 1);

        return {
          packageNo,
          packageType:
            typeof row.packageType === "string" ? row.packageType : "",
          label: typeof row.label === "string" ? row.label : "",
          remarks: typeof row.remarks === "string" ? row.remarks : "",
          grossWeight:
            row.grossWeight === null || row.grossWeight === undefined
              ? ""
              : String(row.grossWeight),
          netWeight:
            row.netWeight === null || row.netWeight === undefined
              ? ""
              : String(row.netWeight),
          items,
        };
      })
      .filter(
        (
          pkg,
        ): pkg is {
          packageNo: string;
          packageType: string;
          label: string;
          remarks: string;
          grossWeight: string;
          netWeight: string;
          items: { salesOrderItemId: string; qty: number }[];
        } => Boolean(pkg),
      ),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues,
    mode: "onChange",
  });

  const items = useWatch({
    control: form.control,
    name: "items",
  });
  const packages = useWatch({
    control: form.control,
    name: "packages",
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const {
    fields: packageFields,
    append: appendPackage,
    remove: removePackage,
  } = useFieldArray({
    control: form.control,
    name: "packages",
  });

  const selectedItems = (items ?? []).filter((item) => item.selected);
  const [unitsPerBox, setUnitsPerBox] = React.useState(4);
  const [splitIntoBoxes, setSplitIntoBoxes] = React.useState(3);
  const [splitItemId, setSplitItemId] = React.useState("");

  React.useEffect(() => {
    if (selectedItems.length === 0) {
      if (splitItemId !== "") setSplitItemId("");
      return;
    }

    const exists = selectedItems.some(
      (item) => item.salesOrderItemId === splitItemId,
    );
    if (!exists) {
      setSplitItemId(selectedItems[0]?.salesOrderItemId ?? "");
    }
  }, [selectedItems, splitItemId]);

  function getMaxQty(item: FormValues["items"][number]) {
    if (item.isManual) {
      return Number.MAX_SAFE_INTEGER;
    }
    return Math.max(
      0,
      Math.min(Number(item.remainingQty || 0), Number(item.orderedQty || 0)),
    );
  }

  function sanitizeQty(index: number) {
    const item = form.getValues(`items.${index}`);
    const maxQty = getMaxQty(item);
    const currentQty = Number(item.qty || 0);

    const safeQty = Math.max(0, Math.min(currentQty, maxQty));

    form.setValue(`items.${index}.qty`, safeQty, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function toggleItem(index: number, checked: boolean) {
    form.setValue(`items.${index}.selected`, checked, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const item = form.getValues(`items.${index}`);
    const maxQty = getMaxQty(item);

    if (checked) {
      const currentQty = Number(item.qty || 0);
      const safeQty = currentQty > 0 ? Math.min(currentQty, maxQty) : maxQty;
      form.setValue(`items.${index}.qty`, safeQty, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      form.setValue(`items.${index}.qty`, 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function getPackageAllocationQty(
    packageIndex: number,
    salesOrderItemId: string,
  ) {
    const packageRows = packages ?? [];
    const packageRow = packageRows[packageIndex];
    if (!packageRow) return 0;

    const allocation = (packageRow.items ?? []).find(
      (row) => row.salesOrderItemId === salesOrderItemId,
    );

    return Number(allocation?.qty ?? 0);
  }

  function setPackageAllocationQty(
    packageIndex: number,
    salesOrderItemId: string,
    qty: number,
    maxQty: number,
  ) {
    const safeQty = Math.max(
      0,
      Math.min(Number(qty || 0), Number(maxQty || 0)),
    );
    const existing = form.getValues(`packages.${packageIndex}.items`) ?? [];

    const next = [...existing];
    const atIndex = next.findIndex(
      (row) => row.salesOrderItemId === salesOrderItemId,
    );

    if (safeQty <= 0) {
      if (atIndex >= 0) next.splice(atIndex, 1);
    } else if (atIndex >= 0) {
      next[atIndex] = { ...next[atIndex], qty: safeQty };
    } else {
      next.push({ salesOrderItemId, qty: safeQty });
    }

    form.setValue(`packages.${packageIndex}.items`, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function buildPackageRow(
    packageNo: string,
    itemsInPackage: { salesOrderItemId: string; qty: number }[],
    label?: string,
  ) {
    return {
      packageNo,
      packageType: "BOX",
      label: label ?? "",
      remarks: "",
      grossWeight: "",
      netWeight: "",
      items: itemsInPackage,
    };
  }

  function addPackageRow() {
    appendPackage({
      packageNo: String((packageFields?.length ?? 0) + 1),
      packageType: "",
      label: "",
      remarks: "",
      grossWeight: "",
      netWeight: "",
      items: [],
    });
  }

  function addManualItemRow() {
    appendItem(createManualInvoiceItem(itemFields.length));
  }

  function removeManualItemRow(index: number) {
    removeItem(index);
  }

  async function applyCustomerToHeader(customerId: string | null) {
    form.setValue("header.customerId", customerId, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (!customerId) {
      form.setValue("header.clientNameSnapshot", "", {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("header.citySnapshot", "", {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("header.stateSnapshot", "", {
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("header.gstinSnapshot", "", {
        shouldDirty: true,
        shouldTouch: true,
      });
      return;
    }

    setIsApplyingCustomerDefaults(true);
    try {
      const customer = await getCustomerForSelectById(customerId);
      if (!customer) return;

      form.setValue("header.clientNameSnapshot", customer.companyName ?? "", {
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
    } finally {
      setIsApplyingCustomerDefaults(false);
    }
  }

  function applyOfflineVariantToItem(
    index: number,
    variant: ProductVariantSearchItem | null,
  ) {
    if (!variant) {
      form.setValue(`items.${index}.productId`, null, { shouldDirty: true });
      form.setValue(`items.${index}.variantId`, null, { shouldDirty: true });
      form.setValue(`items.${index}.title`, "", { shouldDirty: true });
      form.setValue(`items.${index}.sku`, null, { shouldDirty: true });
      form.setValue(`items.${index}.typeNumber`, null, { shouldDirty: true });
      form.setValue(`items.${index}.description`, null, { shouldDirty: true });
      form.setValue(`items.${index}.hsnCode`, null, { shouldDirty: true });
      return;
    }

    form.setValue(`items.${index}.productId`, variant.productId, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.variantId`, variant.id, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.title`, variant.title ?? "", {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.sku`, variant.sku ?? null, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.typeNumber`, variant.typeNumber ?? null, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.description`, variant.description ?? null, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.hsnCode`, variant.hsnCode ?? null, {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue(`items.${index}.unit`, form.getValues(`items.${index}.unit`) || "Nos", {
      shouldDirty: true,
    });
    form.setValue(`items.${index}.selected`, true, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function autoOneBoxPerItem() {
    const selected = (form.getValues("items") ?? [])
      .filter((item) => item.selected && Number(item.qty || 0) > 0)
      .map((item, index) => ({
        packageNo: String(index + 1),
        packageType: "BOX",
        label: item.title ?? "",
        remarks: "",
        grossWeight: "",
        netWeight: "",
        items: [
          {
            salesOrderItemId: item.salesOrderItemId,
            qty: Number(item.qty || 0),
          },
        ],
      }));

    form.setValue("packages", selected, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function autoPackByCapacity() {
    const perBox = Math.max(1, Math.floor(Number(unitsPerBox || 1)));
    const sourceItems = (form.getValues("items") ?? []).filter(
      (item) => item.selected && Number(item.qty || 0) > 0,
    );

    const generated: FormValues["packages"] = [];
    let packageNo = 1;

    for (const item of sourceItems) {
      let remaining = Math.floor(Number(item.qty || 0));
      let itemBoxNo = 1;

      while (remaining > 0) {
        const packedQty = Math.min(perBox, remaining);
        generated.push(
          buildPackageRow(
            String(packageNo),
            [
              {
                salesOrderItemId: item.salesOrderItemId,
                qty: packedQty,
              },
            ],
            `${displayValue(item.title, "Item")} - Box ${itemBoxNo}`,
          ),
        );

        remaining -= packedQty;
        itemBoxNo += 1;
        packageNo += 1;
      }
    }

    form.setValue("packages", generated, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function autoSplitSingleItem() {
    const targetItem = (form.getValues("items") ?? []).find(
      (item) =>
        item.selected &&
        item.salesOrderItemId === splitItemId &&
        Number(item.qty || 0) > 0,
    );

    if (!targetItem) {
      toast.error("Select an invoice item first for split.");
      return;
    }

    const totalQty = Math.floor(Number(targetItem.qty || 0));
    const requestedBoxes = Math.max(1, Math.floor(Number(splitIntoBoxes || 1)));
    const finalBoxCount = Math.max(1, Math.min(requestedBoxes, totalQty));

    const baseQty = Math.floor(totalQty / finalBoxCount);
    let remainder = totalQty % finalBoxCount;

    const splitPackages: FormValues["packages"] = [];
    for (let index = 0; index < finalBoxCount; index++) {
      const qty = baseQty + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;

      splitPackages.push(
        buildPackageRow(
          String(index + 1),
          [
            {
              salesOrderItemId: targetItem.salesOrderItemId,
              qty,
            },
          ],
          `${displayValue(targetItem.title, "Item")} - Box ${index + 1}`,
        ),
      );
    }

    form.setValue("packages", splitPackages, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function autoClubSelectedItemsOneBox() {
    const sourceItems = (form.getValues("items") ?? [])
      .filter((item) => item.selected && Number(item.qty || 0) > 0)
      .map((item) => ({
        salesOrderItemId: item.salesOrderItemId,
        qty: Number(item.qty || 0),
      }));

    if (sourceItems.length === 0) {
      toast.error("Select invoice items first.");
      return;
    }

    form.setValue(
      "packages",
      [buildPackageRow("1", sourceItems, "Clubbed Box")],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }

  function clearPackages() {
    form.setValue("packages", [], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function totalAllocatedForItem(salesOrderItemId: string) {
    return (packages ?? []).reduce((acc, pkg) => {
      const row = (pkg.items ?? []).find(
        (pkgItem) => pkgItem.salesOrderItemId === salesOrderItemId,
      );
      return acc + Number(row?.qty ?? 0);
    }, 0);
  }

  const subtotal = selectedItems.reduce((acc, item) => {
    const maxQty = getMaxQty(item);
    const safeQty = Math.max(0, Math.min(Number(item.qty || 0), maxQty));
    return acc + safeQty * Number(item.unitPrice || 0);
  }, 0);

  const allocatedPackageCount = (packages ?? []).filter((pkg) =>
    (pkg.items ?? []).some((item) => Number(item.qty || 0) > 0),
  ).length;

  async function handleSaveDraft(values: FormValues) {
    try {
      setIsSaving(true);

      const payload = buildInvoiceDraftPayload(values);

      const res = await updateInvoiceDraftAction(invoice.id, payload);

      if (!res.ok) {
        toast.error(res.message ?? "Failed to save invoice draft");
        return;
      }

      toast.success("Invoice draft saved");
    } finally {
      setIsSaving(false);
    }
  }

  async function onFinalize() {
    try {
      setIsFinalizing(true);

      const valid = await form.trigger(undefined, { shouldFocus: true });
      if (!valid) return;

      const values = form.getValues();
      const payload = buildInvoiceDraftPayload(values);

      const saveRes = await updateInvoiceDraftAction(invoice.id, payload);
      if (!saveRes.ok) {
        toast.error(saveRes.message ?? "Failed to save invoice draft");
        return;
      }

      const finalizeRes = await finalizeInvoiceAction(invoice.id);

      if (!finalizeRes.ok) {
        toast.error(finalizeRes.message ?? "Failed to finalize invoice");
        return;
      }

      toast.success("Invoice finalized");
      router.push(`/dashboard/sales/invoices/${invoice.id}`);
    } finally {
      setIsFinalizing(false);
    }
  }
  async function onSubmit(values: FormValues) {
    await handleSaveDraft(values);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col w-full items-start justify-between gap-3">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xl font-semibold">Edit Invoice</div>
            <div className="text-sm text-muted-foreground">
              Select pending items, fill dispatch details and save draft.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(handleSaveDraft)}
              disabled={isSaving || isFinalizing}>
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>

            <Button
              type="button"
              onClick={onFinalize}
              disabled={isSaving || isFinalizing}>
              {isFinalizing ? "Finalizing..." : "Finalize"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form
            id="invoice-edit-form"
            className="w-full space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  Invoice numbering, dates and dispatch details
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <FormLabel>Customer</FormLabel>
                    <CustomerCombobox
                      value={form.watch("header.customerId")}
                      onChange={(customerId) => {
                        void applyCustomerToHeader(customerId);
                      }}
                    />
                    {isApplyingCustomerDefaults ? (
                      <p className="text-xs text-muted-foreground">
                        Loading customer details...
                      </p>
                    ) : null}
                  </div>

                  <FormField
                    control={form.control}
                    name="header.invoiceNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Enter invoice number"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value || 0))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.invoiceDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <DatePickerField
                            value={field.value}
                            onChange={(date) =>
                              field.onChange(date ?? new Date())
                            }
                            placeholder="Pick invoice date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.dispatchDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-2">
                        <FormLabel>Dispatch Date</FormLabel>
                        <FormControl>
                          <DatePickerField
                            value={field.value ?? null}
                            onChange={(date) => field.onChange(date ?? null)}
                            placeholder="Pick dispatch date"
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
                            placeholder="Enter PO number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.clientNameSnapshot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Client / Company name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.citySnapshot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="City"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.stateSnapshot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="State"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.gstinSnapshot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="GSTIN"
                          />
                        </FormControl>
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
                        <FormMessage />
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
                            placeholder="Vehicle number"
                          />
                        </FormControl>
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
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
                            placeholder="Dispatch through"
                          />
                        </FormControl>
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.ewayBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-way Bill</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="E-way bill number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="header.remarks"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-4">
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Invoice remarks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FileUpload
                    endpoint="productDrawing"
                    kind={ProductMediaKind.DRAWING}
                    label="LR Copy"
                    hint="Upload LR copy PDF or image"
                    value={form.watch("header.lrCopy") || []}
                    onChange={(files) =>
                      form.setValue("header.lrCopy", files, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>
                      {isOfflineInvoice ? "Invoice Items" : "Select Pending Items"}
                    </CardTitle>
                    <CardDescription>
                      {isOfflineInvoice
                        ? "Add item lines manually for offline invoice creation"
                        : "Choose order items or add manual lines like sales order"}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addManualItemRow}>
                    Add Item
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {items?.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No item lines yet. Click Add Item.
                  </div>
                ) : (
                  items.map((item, index) => {
                    const checked = form.watch(`items.${index}.selected`);
                    const maxQty = getMaxQty(item);

                    return (
                      <label
                        key={item.salesOrderItemId}
                        className="flex cursor-pointer items-start gap-4 rounded-xl border p-4 hover:bg-muted/40">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleItem(index, Boolean(value))
                          }
                        />

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">
                              {displayValue(item.title, "Untitled Product")}
                            </p>

                            <div className="flex items-center gap-2">
                              <div className="text-right text-sm">
                                <p className="font-medium">
                                  {formatCurrency(item.unitPrice)}
                                </p>
                                <p className="text-muted-foreground">per unit</p>
                              </div>
                              {item.isManual ? (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    removeManualItemRow(index);
                                  }}>
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>SKU: {displayValue(item.sku, "No SKU")}</span>
                            <span>
                              Type:{" "}
                              {displayValue(item.typeNumber, "No type number")}
                            </span>
                            <span>
                              Ordered: {displayValue(item.orderedQty, "0")}
                            </span>
                            <span>
                              Invoiced:{" "}
                              {displayValue(item.alreadyInvoiced, "0")}
                            </span>
                            <span>
                              Dispatched:{" "}
                              {displayValue(item.alreadyDispatched, "0")}
                            </span>
                            <span>
                              Remaining: {displayValue(item.remainingQty, "0")}
                            </span>
                            <span>
                              Max Invoice Qty:{" "}
                              {Number.isFinite(maxQty) ? maxQty : "No limit"}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {selectedItems.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Selected Item Details
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Enter invoice qty and certification details
                  </p>
                </div>

                {items.map((item, index) => {
                  if (!item.selected) return null;

                  const maxQty = getMaxQty(item);
                  const safeQty = Number.isFinite(maxQty)
                    ? Math.max(0, Math.min(Number(item.qty || 0), maxQty))
                    : Math.max(0, Number(item.qty || 0));
                  const lineTotal = safeQty * Number(item.unitPrice || 0);

                  return (
                    <Card
                      key={item.salesOrderItemId}
                      className="overflow-hidden rounded-2xl border border-white">
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue={`item-${index}`}>
                        <AccordionItem
                          value={`item-${index}`}
                          className="border-none">
                          <div className="px-5 pt-5">
                            <AccordionTrigger className="rounded-xl border bg-muted/30 px-4 py-3 hover:no-underline">
                              <div className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3">
                                    <h3 className="truncate text-base font-semibold">
                                      {displayValue(item.title, "Untitled Product")}
                                    </h3>
                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                      #{index + 1}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Qty: {safeQty} · Unit Price:{" "}
                                    {formatCurrency(item.unitPrice)} · Total:{" "}
                                    {formatCurrency(lineTotal)}
                                  </p>
                                </div>
                              </div>
                            </AccordionTrigger>
                          </div>

                          <AccordionContent className="pb-0">
                            <CardContent className="space-y-6 pt-4">
                              <div className="grid grid-cols-2 gap-3 rounded-xl border p-3 text-sm md:max-w-[420px]">
                                <div>
                                  <p className="text-muted-foreground">
                                    Item Type
                                  </p>
                                  <p className="font-medium">
                                    {item.isManual ? "Manual line item" : "Order item"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Remaining Qty
                                  </p>
                                  <p className="font-medium">
                                    {item.isManual
                                      ? "No limit"
                                      : `${displayValue(item.remainingQty, "0")} ${displayValue(item.unit, "Nos")}`}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Ordered Qty
                                  </p>
                                  <p className="font-medium">{item.orderedQty}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Max Qty</p>
                                  <p className="font-medium">
                                    {Number.isFinite(maxQty) ? maxQty : "No limit"}
                                  </p>
                                </div>
                              </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                          {item.isManual ? (
                            <>
                              <div className="space-y-2 xl:col-span-2">
                                <FormLabel>Product Variant</FormLabel>
                                <ProductVariantCombobox
                                  value={
                                    form.watch(`items.${index}.variantId`) ?? null
                                  }
                                  onChange={(variant) => {
                                    applyOfflineVariantToItem(index, variant);
                                  }}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name={`items.${index}.title`}
                                render={({ field }) => (
                                  <FormItem className="xl:col-span-2">
                                    <FormLabel>Item Title</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="Enter item title"
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
                                  <FormItem>
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
                                  <FormItem>
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

                              <FormField
                                control={form.control}
                                name={`items.${index}.hsnCode`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>HSN Code</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="HSN Code"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="xl:col-span-2">
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="Description"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.unit`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Unit</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value ?? ""}
                                        placeholder="Nos / Kg / Mtr"
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
                                  <FormItem>
                                    <FormLabel>Unit Price</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={field.value ?? 0}
                                        onChange={(event) =>
                                          field.onChange(
                                            Math.max(
                                              0,
                                              Number(event.target.value || 0),
                                            ),
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          ) : null}

                          <FormField
                            control={form.control}
                            name={`items.${index}.qty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Invoice Qty</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={
                                      Number.isFinite(maxQty) ? maxQty : undefined
                                    }
                                    placeholder="Enter qty"
                                    value={field.value ?? 0}
                                    onChange={(e) => {
                                      const raw = Number(e.target.value || 0);
                                      const safe = Number.isFinite(maxQty)
                                        ? Math.max(0, Math.min(raw, maxQty))
                                        : Math.max(0, raw);
                                      field.onChange(safe);
                                    }}
                                    onBlur={() => sanitizeQty(index)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.cimfrNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CIMFR Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter CIMFR number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.pesoNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PESO Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter PESO number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`items.${index}.serialNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Serial Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter serial number"
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
                              <FormItem>
                                <FormLabel>Type Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter type number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <FileUpload
                          endpoint="productImage"
                          kind={ProductMediaKind.IMAGE}
                          label="Product Picture"
                          hint="Upload delivered product image(s)"
                          value={
                            form.watch(`items.${index}.productPicture`) || []
                          }
                          onChange={(files) =>
                            form.setValue(
                              `items.${index}.productPicture`,
                              files,
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              },
                            )
                          }
                        />
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addManualItemRow}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Item
                                </Button>
                              </div>
                            </CardContent>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </Card>
                  );
                })}
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Packaging</CardTitle>
                    <CardDescription>
                      Simple boxes only. You can split one item into many boxes
                      or combine many items in one box.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                      <span className="text-xs text-muted-foreground">
                        Units / Box
                      </span>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20"
                        value={unitsPerBox}
                        onChange={(event) =>
                          setUnitsPerBox(
                            Math.max(
                              1,
                              Math.floor(Number(event.target.value || 1)),
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={autoPackByCapacity}
                        disabled={selectedItems.length === 0}>
                        Auto Pack
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                      <span className="text-xs text-muted-foreground">
                        Split Item
                      </span>
                      <select
                        className="h-8 rounded-md border bg-background px-2 text-sm"
                        value={splitItemId}
                        onChange={(event) => setSplitItemId(event.target.value)}
                        disabled={selectedItems.length === 0}>
                        {selectedItems.map((item) => (
                          <option
                            key={item.salesOrderItemId}
                            value={item.salesOrderItemId}>
                            {displayValue(item.title, "Item")}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20"
                        value={splitIntoBoxes}
                        onChange={(event) =>
                          setSplitIntoBoxes(
                            Math.max(
                              1,
                              Math.floor(Number(event.target.value || 1)),
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={autoSplitSingleItem}
                        disabled={selectedItems.length === 0}>
                        Split
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={autoOneBoxPerItem}
                      disabled={selectedItems.length === 0}>
                      Auto One Box Per Item
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={autoClubSelectedItemsOneBox}
                      disabled={selectedItems.length === 0}>
                      Club In One Box
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPackageRow}>
                      Add Package
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={clearPackages}
                      disabled={(packageFields?.length ?? 0) === 0}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Select invoice items first to allocate packaging.
                  </div>
                ) : null}

                {packageFields.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    No packages added yet.
                  </div>
                ) : (
                  packageFields.map((pkg, packageIndex) => (
                    <Card key={pkg.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">
                            Package #{packageIndex + 1}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePackage(packageIndex)}>
                            Remove
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <FormField
                            control={form.control}
                            name={`packages.${packageIndex}.packageNo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Package No</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`packages.${packageIndex}.packageType`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Package Type</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Inner Box / Wooden Crate"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`packages.${packageIndex}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Label</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="WG-BOX-1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`packages.${packageIndex}.grossWeight`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gross Weight</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="0.000"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`packages.${packageIndex}.netWeight`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Net Weight</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="0.000"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`packages.${packageIndex}.remarks`}
                            render={({ field }) => (
                              <FormItem className="xl:col-span-2">
                                <FormLabel>Remarks</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Notes for this package"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            Item Allocation In This Package
                          </div>

                          {selectedItems.map((item) => {
                            const maxQty = Math.max(0, Number(item.qty || 0));
                            const allocatedQty = getPackageAllocationQty(
                              packageIndex,
                              item.salesOrderItemId,
                            );

                            return (
                              <div
                                key={`${pkg.id}-${item.salesOrderItemId}`}
                                className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_140px_140px] md:items-center">
                                <div>
                                  <div className="text-sm font-medium">
                                    {displayValue(
                                      item.title,
                                      "Untitled Product",
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Invoice Qty: {maxQty}{" "}
                                    {displayValue(item.unit, "Nos")}
                                  </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  Allocated Total:{" "}
                                  {totalAllocatedForItem(item.salesOrderItemId)}{" "}
                                  / {maxQty}
                                </div>

                                <Input
                                  type="number"
                                  min={0}
                                  max={maxQty}
                                  value={allocatedQty}
                                  onChange={(event) =>
                                    setPackageAllocationQty(
                                      packageIndex,
                                      item.salesOrderItemId,
                                      Number(event.target.value || 0),
                                      maxQty,
                                    )
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>
                  Based on currently selected invoice items
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Manual Invoice No</span>
                  <span>
                    {form.watch("header.invoiceNo")
                      ? formatFinancialDocumentNumber(
                          invoice.invoiceFy,
                          form.watch("header.invoiceNo"),
                        )
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Selected Items</span>
                  <span>{selectedItems.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Packages</span>
                  <span>{allocatedPackageCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>GST</span>
                  <span>{formatCurrency(subtotal * 0.18)}</span>
                </div>

                <div className="flex items-center justify-between font-semibold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(subtotal * 1.18)}</span>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
