import { z } from "zod";

const UploadedFileSchema = z
  .object({
    url: z.string(),
    name: z.string().optional(),
    key: z.string().optional(),
    size: z.number().optional(),
    type: z.string().optional(),
  })
  .nullable();

const InvoicePackingRowSchema = z.object({
  id: z.string(),
  boxNumber: z.string().min(1, "Box number is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  remarks: z.string().optional().nullable(),
});

const InvoiceOrderItemSelectorSchema = z.object({
  orderItemId: z.string(),
  productId: z.string().nullable().optional(),
  variantId: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  unit: z.string(),
  orderedQty: z.coerce.number(),
  alreadyInvoicedQty: z.coerce.number(),
  pendingQty: z.coerce.number(),
  unitPrice: z.coerce.number(),
  gstRate: z.coerce.number().nullable().optional(),
  originalTypeNumber: z.string().nullable().optional(),
  selected: z.boolean(),
});

const InvoiceSelectedItemSchema = z
  .object({
    orderItemId: z.string(),
    title: z.string(),
    unit: z.string(),
    orderedQty: z.coerce.number(),
    pendingQty: z.coerce.number(),
    invoiceQty: z.coerce.number().positive("Invoice qty is required"),
    unitPrice: z.coerce.number(),
    gstRate: z.coerce.number().nullable().optional(),
    typeNumber: z.string().optional().default(""),
    cimfrNumber: z.string().optional().default(""),
    serialNumber: z.string().optional().default(""),
    deliveredPhoto: UploadedFileSchema.optional(),
    packing: z.array(InvoicePackingRowSchema).default([]),
  })
  .refine((val) => val.invoiceQty <= val.pendingQty, {
    message: "Invoice qty cannot exceed pending qty",
    path: ["invoiceQty"],
  });

export const InvoiceFormSchema = z.object({
  header: z.object({
    salesOrderId: z.string().nullable(),
    invoiceNo: z.coerce.number().nullable(),
    invoiceFy: z.string(),

    invoiceDate: z.date("Invoice date is required"),
    dispatchDate: z.date("Dispatch date is required"),

    transporterName: z.string().default(""),
    vehicleNumber: z.string().default(""),
    driverName: z.string().default(""),
    driverPhone: z.string().default(""),
    lrNumber: z.string().default(""),
    ewayBillNumber: z.string().default(""),

    lrCopyFile: UploadedFileSchema.optional(),

    customerId: z.string().nullable(),
    clientNameSnapshot: z.string().default(""),

    subtotal: z.coerce.number().default(0),
    taxableTotal: z.coerce.number().default(0),
    gstTotal: z.coerce.number().default(0),
    grandTotal: z.coerce.number().default(0),

    totalSelectedItems: z.coerce.number().default(0),
    totalInvoiceQty: z.coerce.number().default(0),

    notes: z.string().optional().nullable(),
  }),
  orderItems: z.array(InvoiceOrderItemSelectorSchema).default([]),
  selectedItems: z
    .array(InvoiceSelectedItemSchema)
    .min(1, "Select at least one item"),
});
