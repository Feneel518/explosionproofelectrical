import z from "zod";

const ProductStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

const ProductMediaKindSchema = z.enum(["IMAGE", "DRAWING"]);

const optStr = (max = 180) => z.string().trim().max(max).optional();

export const ProductVariantSchema = z.object({
  id: z.uuid().optional(),
  productId: z.uuid(),

  variant: z.string().trim().min(2, "Variant is required").max(180),
  sku: z.string().trim().min(1).max(80),
  typeNumber: optStr(120),

  rating: optStr(60),
  terminals: optStr(120),
  gasket: optStr(120),
  mounting: optStr(120),
  cableEntry: optStr(120),
  earthing: optStr(120),

  cutoutSize: optStr(120),
  plateSize: optStr(120),
  size: optStr(120),
  glass: optStr(120),
  wireGuard: optStr(120),

  rpm: optStr(60),
  kW: optStr(60),
  horsePower: optStr(60),

  images: z
    .array(
      z.object({
        id: z.uuid().optional(),
        kind: ProductMediaKindSchema,
        url: z.string().url(),
        title: z.string().trim().max(180).optional().nullable(),
      }),
    )
    .optional(),

  drawings: z
    .array(
      z.object({
        id: z.uuid().optional(),
        kind: ProductMediaKindSchema,
        url: z.string().url(),
        title: z.string().trim().max(180).optional().nullable(),
      }),
    )
    .optional(),

  component: z
    .object({
      id: z.uuid().optional(),
      item: optStr(180),
      unit: optStr(120),
    })
    .array()
    .optional(),
  status: ProductStatusSchema.optional(),
});

export type ProductVariantSchemaRequest = z.infer<typeof ProductVariantSchema>;
