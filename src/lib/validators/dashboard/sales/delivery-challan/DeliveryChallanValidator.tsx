import { z } from "zod";

export const createDeliveryChallanDraftSchema = z.object({
  header: z.object({
    type: z.enum(["TO_BE_BILLED", "JOB_WORK", "SAMPLE", "RETURNABLE"]),
    partyType: z.enum(["CUSTOMER", "VENDOR", "OTHER"]),

    date: z.date().optional().nullable(),
    poNumber: z.string().optional().nullable(),

    quotationId: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),

    transporterName: z.string().optional().nullable(),
    vehicleNumber: z.string().optional().nullable(),
    driverName: z.string().optional().nullable(),
    driverPhone: z.string().optional().nullable(),
    dispatchThrough: z.string().optional().nullable(),
    lrNumber: z.string().optional().nullable(),
    numberOfPackages: z.number().optional().nullable(),
    remarks: z.string().optional().nullable(),

    expectedReturnDate: z.date().optional().nullable(),
    expectedClosureDate: z.date().optional().nullable(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["PRODUCT", "RAW_MATERIAL"]),
      productId: z.string().optional().nullable(),

      title: z.string().min(1, "Title is required"),
      sku: z.string().optional().nullable(),
      typeNumber: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      hsnCode: z.string().optional().nullable(),
      unit: z.string().optional().nullable(),

      qty: z.coerce.number().min(1, "Qty must be at least 1"),
      closedQty: z.coerce.number().optional(),
      pendingQty: z.coerce.number().optional(),

      sortOrder: z.number(),
    }),
  ),
});

export type DeliveryChallanDraftInput = z.infer<
  typeof createDeliveryChallanDraftSchema
>;
