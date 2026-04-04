// lib/validators/dashboard/sales/orders/SalesOrderValidator.ts
import { z } from "zod";
import {
  GST,
  PackingCharges,
  PaymentTerms,
  TransportationPayment,
  SalesOrderSourceType,
  ProductMediaKind,
} from "@prisma/client";

/**
 * Helpers
 */
const nullableTrimmedString = z.preprocess((val) => {
  if (val === undefined || val === null) return null;
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable());

const nullableEmail = z.preprocess((val) => {
  if (val === undefined || val === null) return null;
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().email("Invalid email").nullable());

const nullableDateInput = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return null;
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}, z.date().nullable());

const coerceNumberFromInput = (label: string, min = 0) =>
  z.coerce
    .number(`${label} must be a number`)
    .refine((v) => Number.isFinite(v), `${label} must be valid`)
    .refine((v) => v >= min, `${label} must be at least ${min}`);

const optionalBoolean = z.preprocess((val) => {
  if (val === undefined || val === null) return false;
  if (typeof val === "boolean") return val;
  if (val === "true") return true;
  if (val === "false") return false;
  return Boolean(val);
}, z.boolean());

/**
 * Media snapshots
 */
export const SalesOrderVariantImageSnapshotSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1, "Image url is required"),
  alt: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});

export const SalesOrderVariantDrawingSnapshotSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1, "Drawing url is required"),
  title: z.string().nullable().optional(),
});

/**
 * Components
 */
export const SalesOrderComponentSchema = z.object({
  id: z.string().min(1, "Component id is required"),
  item: nullableTrimmedString.optional(),
  unit: nullableTrimmedString.optional(),
  qty: nullableTrimmedString.optional(),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Item
 */
export const SalesOrderItemSchema = z
  .object({
    id: z.string().min(1, "Item id is required"),

    productId: nullableTrimmedString.optional(),
    variantId: nullableTrimmedString.optional(),

    title: z.string().trim().min(1, "Title is required"),
    sku: nullableTrimmedString.optional(),
    typeNumber: nullableTrimmedString.optional(),
    description: nullableTrimmedString.optional(),
    rating: nullableTrimmedString.optional(),
    terminals: nullableTrimmedString.optional(),
    hardware: nullableTrimmedString.optional(),
    gasket: nullableTrimmedString.optional(),
    mounting: nullableTrimmedString.optional(),
    cableEntry: nullableTrimmedString.optional(),
    earthing: nullableTrimmedString.optional(),
    hsnCode: nullableTrimmedString.optional(),
    cutoutSize: nullableTrimmedString.optional(),
    plateSize: nullableTrimmedString.optional(),
    glass: nullableTrimmedString.optional(),
    wireGuard: nullableTrimmedString.optional(),
    variantType: nullableTrimmedString.optional(),
    size: nullableTrimmedString.optional(),
    rpm: nullableTrimmedString.optional(),
    kW: nullableTrimmedString.optional(),
    horsePower: nullableTrimmedString.optional(),
    poReference: nullableTrimmedString.optional(),

    showVariantImages: optionalBoolean.optional().default(false),
    showVariantDrawings: optionalBoolean.optional().default(false),

    selectedVariantImageIds: z.array(z.string()).default([]),
    selectedVariantDrawingIds: z.array(z.string()).default([]),

    variantImagesSnapshot: z
      .array(SalesOrderVariantImageSnapshotSchema)
      .optional()
      .default([]),

    variantDrawingsSnapshot: z
      .array(SalesOrderVariantDrawingSnapshotSchema)
      .optional()
      .default([]),

    qty: coerceNumberFromInput("Qty", 1),
    unit: nullableTrimmedString.optional(),
    unitPrice: coerceNumberFromInput("Unit price", 0),

    dispatchedQty: coerceNumberFromInput("Dispatched qty", 0)
      .optional()
      .default(0),

    invoicedQty: coerceNumberFromInput("Invoiced qty", 0).optional().default(0),

    pendingQty: coerceNumberFromInput("Pending qty", 0).optional().default(0),

    lineSubtotal: coerceNumberFromInput("Line subtotal", 0)
      .optional()
      .default(0),

    lineGstTotal: coerceNumberFromInput("Line GST total", 0)
      .optional()
      .default(0),

    lineGrandTotal: coerceNumberFromInput("Line grand total", 0)
      .optional()
      .default(0),

    component: z.array(SalesOrderComponentSchema).default([]),

    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((item, ctx) => {
    if (item.dispatchedQty > item.qty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dispatchedQty"],
        message: "Dispatched qty cannot exceed ordered qty",
      });
    }

    if (item.invoicedQty > item.qty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["invoicedQty"],
        message: "Invoiced qty cannot exceed ordered qty",
      });
    }

    if (item.pendingQty > item.qty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pendingQty"],
        message: "Pending qty cannot exceed ordered qty",
      });
    }

    if (item.qty - item.dispatchedQty < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dispatchedQty"],
        message: "Dispatch progress is invalid",
      });
    }

    if (item.showVariantImages && item.variantImagesSnapshot.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["showVariantImages"],
        message: "No variant images available to show",
      });
    }

    if (item.showVariantDrawings && item.variantDrawingsSnapshot.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["showVariantDrawings"],
        message: "No variant drawings available to show",
      });
    }

    const selectedImageIds = new Set(item.selectedVariantImageIds);
    const validImageIds = new Set(item.variantImagesSnapshot.map((x) => x.id));
    for (const id of selectedImageIds) {
      if (!validImageIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["selectedVariantImageIds"],
          message: `Selected image ${id} is not present in snapshot`,
        });
        break;
      }
    }

    const selectedDrawingIds = new Set(item.selectedVariantDrawingIds);
    const validDrawingIds = new Set(
      item.variantDrawingsSnapshot.map((x) => x.id),
    );
    for (const id of selectedDrawingIds) {
      if (!validDrawingIds.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["selectedVariantDrawingIds"],
          message: `Selected drawing ${id} is not present in snapshot`,
        });
        break;
      }
    }
  });

export const SalesOrderPoFileSchema = z.object({
  kind: z.nativeEnum(ProductMediaKind),
  url: z.string().min(1, "File url is required"),
  title: z.string().nullable().optional(),
});

/**
 * Header
 */
export const SalesOrderHeaderSchema = z.object({
  quotationId: nullableTrimmedString.optional(),

  customerId: nullableTrimmedString.optional(),
  clientName: nullableTrimmedString.optional(),

  clientNameSnapshot: nullableTrimmedString.optional(),
  citySnapshot: nullableTrimmedString.optional(),
  stateSnapshot: nullableTrimmedString.optional(),
  gstinSnapshot: nullableTrimmedString.optional(),

  sourceType: z
    .nativeEnum(SalesOrderSourceType)
    .default(SalesOrderSourceType.DIRECT),

  poNumber: nullableTrimmedString.optional(),
  poDate: nullableDateInput.optional(),
  orderDate: nullableDateInput.optional(),

  receivedFromName: nullableTrimmedString.optional(),
  receivedFromPhone: nullableTrimmedString.optional(),
  receivedFromEmail: nullableEmail.optional(),

  additionalNotes: nullableTrimmedString.optional(),
  deliveryDate: nullableTrimmedString.optional(),

  gst: z.nativeEnum(GST).default(GST.CGST_SGST_18),
  packingCharges: z.nativeEnum(PackingCharges).default(PackingCharges.INCLUDED),
  paymentTerms: z.nativeEnum(PaymentTerms).default(PaymentTerms.ADVANCE),
  transportationPayment: z
    .nativeEnum(TransportationPayment)
    .default(TransportationPayment.TO_PAY),

  discount: nullableTrimmedString.optional(),
  poFile: z.array(SalesOrderPoFileSchema).default([]).optional().nullable(),

  subtotal: coerceNumberFromInput("Subtotal", 0).optional().default(0),
  discountTotal: coerceNumberFromInput("Discount total", 0)
    .optional()
    .default(0),
  taxableTotal: coerceNumberFromInput("Taxable total", 0).optional().default(0),
  gstTotal: coerceNumberFromInput("GST total", 0).optional().default(0),
  grandTotal: coerceNumberFromInput("Grand total", 0).optional().default(0),

  totalItemsCount: coerceNumberFromInput("Total items count", 0)
    .optional()
    .default(0),
  totalOrderedQty: coerceNumberFromInput("Total ordered qty", 0)
    .optional()
    .default(0),
  totalDispatchedQty: coerceNumberFromInput("Total dispatched qty", 0)
    .optional()
    .default(0),
  totalInvoicedQty: coerceNumberFromInput("Total invoiced qty", 0)
    .optional()
    .default(0),
  totalPendingQty: coerceNumberFromInput("Total pending qty", 0)
    .optional()
    .default(0),

  isConvertedFromQuotation: optionalBoolean.optional().default(false),
  isClosed: optionalBoolean.optional().default(false),
  isFullyDispatched: optionalBoolean.optional().default(false),
  isFullyInvoiced: optionalBoolean.optional().default(false),
  isOverdueForDispatch: optionalBoolean.optional().default(false),
});

/**
 * Full form schema
 * This is the one you should use in RHF.
 */
export const SalesOrderSchema = z
  .object({
    header: SalesOrderHeaderSchema,
    items: z.array(SalesOrderItemSchema).min(1, "Add at least one item"),
  })
  .superRefine((data, ctx) => {
    const items = data.items ?? [];

    const computedSubtotal = items.reduce(
      (acc, item) => acc + Number(item.qty || 0) * Number(item.unitPrice || 0),
      0,
    );

    const computedOrderedQty = items.reduce(
      (acc, item) => acc + Number(item.qty || 0),
      0,
    );

    const computedDispatchedQty = items.reduce(
      (acc, item) => acc + Number(item.dispatchedQty || 0),
      0,
    );

    const computedInvoicedQty = items.reduce(
      (acc, item) => acc + Number(item.invoicedQty || 0),
      0,
    );

    const computedPendingQty = items.reduce(
      (acc, item) =>
        acc +
        Math.max(
          0,
          Number(
            item.pendingQty ??
              Number(item.qty || 0) - Number(item.dispatchedQty || 0),
          ),
        ),
      0,
    );

    if (
      data.header.totalItemsCount &&
      data.header.totalItemsCount !== items.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "totalItemsCount"],
        message: "Total items count does not match item rows",
      });
    }

    if (
      data.header.totalOrderedQty &&
      data.header.totalOrderedQty !== computedOrderedQty
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "totalOrderedQty"],
        message: "Total ordered qty does not match items",
      });
    }

    if (
      data.header.totalDispatchedQty &&
      data.header.totalDispatchedQty !== computedDispatchedQty
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "totalDispatchedQty"],
        message: "Total dispatched qty does not match items",
      });
    }

    if (
      data.header.totalInvoicedQty &&
      data.header.totalInvoicedQty !== computedInvoicedQty
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "totalInvoicedQty"],
        message: "Total invoiced qty does not match items",
      });
    }

    if (
      data.header.totalPendingQty &&
      data.header.totalPendingQty !== computedPendingQty
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "totalPendingQty"],
        message: "Total pending qty does not match items",
      });
    }

    if (data.header.subtotal && Number(data.header.subtotal) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "subtotal"],
        message: "Subtotal cannot be negative",
      });
    }

    if (data.header.grandTotal && Number(data.header.grandTotal) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "grandTotal"],
        message: "Grand total cannot be negative",
      });
    }

    if (data.header.isConvertedFromQuotation && !data.header.quotationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "quotationId"],
        message: "Quotation id is required for converted orders",
      });
    }

    if (
      data.header.isFullyDispatched &&
      computedDispatchedQty < computedOrderedQty
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "isFullyDispatched"],
        message: "Order cannot be marked fully dispatched yet",
      });
    }

    if (
      data.header.isFullyInvoiced &&
      computedInvoicedQty < computedOrderedQty
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "isFullyInvoiced"],
        message: "Order cannot be marked fully invoiced yet",
      });
    }

    if (
      !data.header.clientName &&
      !data.header.customerId &&
      !data.header.receivedFromName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "clientName"],
        message:
          "Provide at least a customer, client name, or received from name",
      });
    }

    // Optional consistency check for live form totals
    // Only validates when header values are already being stored in form state.
    if (
      Number(data.header.subtotal || 0) > 0 &&
      Math.abs(Number(data.header.subtotal) - computedSubtotal) > 0.01
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["header", "subtotal"],
        message: "Subtotal does not match item totals",
      });
    }
  });

/**
 * Draft schema
 * Useful when draftData is partially filled during autosave.
 * Slightly more tolerant than final schema.
 */
export const SalesOrderDraftSchema = z.object({
  header: SalesOrderHeaderSchema.partial().default({}),
  items: z.array(SalesOrderItemSchema).default([]),
});

/**
 * Types
 */
export type SalesOrderFormValues = z.infer<typeof SalesOrderSchema>;
export type SalesOrderDraftValues = z.infer<typeof SalesOrderDraftSchema>;
export type SalesOrderHeaderValues = z.infer<typeof SalesOrderHeaderSchema>;
export type SalesOrderItemValues = z.infer<typeof SalesOrderItemSchema>;
export type SalesOrderComponentValues = z.infer<
  typeof SalesOrderComponentSchema
>;
