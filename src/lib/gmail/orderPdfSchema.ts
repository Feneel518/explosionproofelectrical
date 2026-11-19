import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).nullable();
export const extractedOrderPdfSchema = z.object({
  documentType: z.enum(["PURCHASE_ORDER", "RFQ", "OTHER", "UNREADABLE"]),
  poNumber: optionalText(100).describe("Purchase order/reference number, exactly as printed; null when absent."),
  poDate: optionalText(10).describe("Unambiguous purchase order date as YYYY-MM-DD; null if absent or ambiguous."),
  buyerName: optionalText(500).describe("Company placing the order, not the supplier receiving it."),
  currency: optionalText(10).describe("ISO currency code only when explicit in the source, such as INR. Otherwise null."),
  warnings: z.array(z.string().max(400)).max(20),
  items: z.array(z.object({
    title: z.string().max(500), description: optionalText(3000), sku: optionalText(150), typeNumber: optionalText(150),
    quantity: z.number().finite().positive().max(1_000_000).nullable().describe("Ordered quantity, not price, tax, pack size or serial number; null if unclear."),
    unit: optionalText(50), unitPrice: z.number().finite().min(0).max(999_999_999).nullable().describe("Explicit price per unit excluding GST. Never substitute line total, infer a missing price or invent zero."),
    hsnCode: optionalText(30), page: z.number().int().min(1).max(25),
    evidence: z.string().max(700).describe("Short verbatim source text supporting this line, including quantity and unit price when present."),
    needsReview: z.boolean().describe("True when the scan, row alignment or any item field is unclear."),
  })).max(100),
});
export type ExtractedOrderPdf = z.infer<typeof extractedOrderPdfSchema>;

const reviewDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid PO date.").nullable();
export const reviewedOrderPdfSchema = z.object({
  poNumber: z.string().trim().max(100).nullable(), poDate: reviewDate,
  buyerName: z.string().trim().max(500).nullable(), currency: z.literal("INR"),
  reviewed: z.literal(true),
  items: z.array(z.object({
    title: z.string().trim().min(1).max(500), description: z.string().trim().max(3000).nullable(),
    sku: z.string().trim().max(150).nullable(), typeNumber: z.string().trim().max(150).nullable(),
    quantity: z.number().int("Sales orders require whole quantities.").min(1).max(1_000_000),
    unit: z.string().trim().max(50).nullable(), unitPrice: z.number().finite().min(0).max(999_999_999),
    hsnCode: z.string().trim().max(30).nullable(), page: z.number().int().min(1).max(25),
  }).refine(item => item.quantity * item.unitPrice < 1_000_000_000_000, "Line value exceeds the order limit.")).min(1).max(100),
}).strict();
export type ReviewedOrderPdf = z.infer<typeof reviewedOrderPdfSchema>;
