import type { GST } from "@prisma/client";

const rates: Record<GST, number> = {
  IGST_18: 1800, CGST_SGST_18: 1800, IGST_0_SEZ: 0, CGST_SGST_0_SEZ: 0,
  IGST_5: 500, CGST_SGST_5: 500, IGST_12: 1200, CGST_SGST_12: 1200,
  IGST_28: 2800, CGST_SGST_28: 2800, IGST_0_1: 10, CGST_SGST_0_1: 10,
};
export function gstBasisPoints(mode: GST) { return rates[mode]; }

// Round decimal inputs before multiplication; calculate all money in integer paise.
function scaled(value: number, places: number): bigint {
  if (!Number.isFinite(value) || value < 0 || value > 1e12) throw new Error("Invalid invoice amount or quantity.");
  const text = String(value).includes("e") ? value.toFixed(places + 3) : String(value);
  const [whole, fraction = ""] = text.split(".");
  const digits = fraction.padEnd(places + 1, "0");
  return BigInt(whole + digits.slice(0, places)) + (Number(digits[places]) >= 5 ? BigInt(1) : BigInt(0));
}
const hundred = BigInt(100);
const money = (paise: bigint) => {
  if (paise > BigInt("99999999999999")) throw new Error("Invoice amount exceeds the supported limit.");
  return Number(paise) / 100;
};
export type InvoiceDiscount = { type: "PERCENTAGE" | "AMOUNT"; value: number };
export function calculateInvoiceAmounts<T extends { qty: number; unitPrice: number }>(items: T[], mode: GST = "CGST_SGST_18", discount: InvoiceDiscount = { type: "AMOUNT", value: 0 }) {
  const basisPoints = rates[mode];
  if (basisPoints === undefined) throw new Error("Select a valid tax mode.");
  const raw = items.map(item => ({ item, unitPaise: scaled(item.unitPrice, 2), gross: (scaled(item.unitPrice, 2) * scaled(item.qty, 3) + BigInt(500)) / BigInt(1000) }));
  const subtotal = raw.reduce((sum, line) => sum + line.gross, BigInt(0));
  if (discount.type === "PERCENTAGE" && discount.value > 100) throw new Error("Discount cannot exceed 100 percent.");
  const deduction = discount.type === "PERCENTAGE" ? (subtotal * scaled(discount.value, 2) + BigInt(5000)) / BigInt(10000) : scaled(discount.value, 2);
  if (deduction > subtotal) throw new Error("Discount cannot exceed the subtotal.");
  const allocations = raw.map(line => subtotal ? deduction * line.gross / subtotal : BigInt(0));
  let remainder = deduction - allocations.reduce((sum, value) => sum + value, BigInt(0));
  for (let i = 0; remainder > BigInt(0) && i < allocations.length; i++) {
    if (allocations[i] < raw[i].gross) { allocations[i]++; remainder--; }
  }
  let tax = BigInt(0);
  const lines = raw.map(({ item, unitPaise, gross }, index) => {
    const taxable = gross - allocations[index];
    const taxPaise = (taxable * BigInt(basisPoints) + BigInt(5000)) / BigInt(10000);
    tax += taxPaise;
    return { ...item, unitPrice: Number(unitPaise) / Number(hundred), lineSubtotal: money(gross), lineDiscountTotal: money(allocations[index]), lineTaxableTotal: money(taxable), lineGstTotal: money(taxPaise), lineGrandTotal: money(taxable + taxPaise) };
  });
  return { items: lines, subtotal: money(subtotal), discountTotal: money(deduction), taxableTotal: money(subtotal - deduction), gstTotal: money(tax), grandTotal: money(subtotal - deduction + tax) };
}
