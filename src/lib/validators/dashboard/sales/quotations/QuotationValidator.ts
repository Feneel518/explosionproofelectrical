import z from "zod";

const VariantAssetSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
});
export const QuotationSchema = z.object({
  header: z.object({
    platform: z.any().optional(),
    customerId: z.string().nullable().optional(),
    clientName: z.string().nullable().optional(),

    receivedFromName: z.string().nullable().optional(),
    receivedFromPhone: z.string().nullable().optional(),
    receivedFromEmail: z.string().nullable().optional(),
    enquiryMessage: z.string().nullable().optional(),

    additionalNotes: z.string().nullable().optional(),
    deliveryDate: z.string().nullable().optional(),

    gst: z.any().optional(),
    packingCharges: z.any().optional(),
    paymentTerms: z.any().optional(),
    transportationPayment: z.any().optional(),
    discount: z.string().nullable().optional(),
    nextFollowupAt: z.date().nullable().optional(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string().nullable().optional(),
      variantId: z.string().nullable().optional(),

      title: z.string().min(1, "Title required"),
      sku: z.string().nullable().optional(),
      typeNumber: z.string().nullable().optional(),
      description: z.string().nullable().optional(),

      rating: z.string().nullable().optional(),

      terminals: z.string().nullable().optional(),

      hardware: z.string().nullable().optional(),
      gasket: z.string().nullable().optional(),
      mounting: z.string().nullable().optional(),
      cableEntry: z.string().nullable().optional(),
      earthing: z.string().nullable().optional(),
      hsnCode: z.string().nullable().optional(),
      cutoutSize: z.string().nullable().optional(),
      plateSize: z.string().nullable().optional(),
      glass: z.string().nullable().optional(),
      wireGuard: z.string().nullable().optional(),
      variantType: z.string().nullable().optional(),
      size: z.string().nullable().optional(),
      rpm: z.string().nullable().optional(),
      kW: z.string().nullable().optional(),
      horsePower: z.string().nullable().optional(),
      poReference: z.string().nullable().optional(),

      qty: z.coerce.number().finite().min(0),
      unit: z.string().nullable().optional(),
      unitPrice: z.string().min(1), // decimal string
      sortOrder: z.coerce.number().int().min(0),

      component: z
        .object({
          id: z.string().uuid().nullable().optional(),
          item: z.string().nullable().optional(),
          unit: z.string().nullable().optional(),
        })
        .array()
        .optional(),

      showVariantImages: z.boolean().optional(),
      showVariantDrawings: z.boolean().optional(),

      selectedVariantImageIds: z.array(z.string()).optional(),
      selectedVariantDrawingIds: z.array(z.string()).optional(),

      variantImagesSnapshot: z.array(VariantAssetSchema).optional(),
      variantDrawingsSnapshot: z.array(VariantAssetSchema).optional(),
    }),
  ),
});

export type QuotationSchemaRequest = z.infer<typeof QuotationSchema>;

export const emptyDraft: QuotationSchemaRequest = {
  header: {},
  items: [],
};
