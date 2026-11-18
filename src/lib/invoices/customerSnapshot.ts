import type { Prisma } from "@prisma/client";
import type { InvoiceDraftData } from "@/lib/types/Invoicetable";
import { z } from "zod";

const snapshotSchema = z.object({
  companyNameSnapshot: z.string().nullable(), clientNameSnapshot: z.string().nullable(),
  citySnapshot: z.string().nullable(), stateSnapshot: z.string().nullable(), gstinSnapshot: z.string().nullable(),
  addressLine1: z.string().nullable(), addressLine2: z.string().nullable(), countrySnapshot: z.string().nullable(), pincodeSnapshot: z.string().nullable(),
  contactNameSnapshot: z.string().nullable(), contactPhoneSnapshot: z.string().nullable(), contactEmailSnapshot: z.string().nullable(),
});
export function readInvoiceCustomerSnapshot(value: unknown) {
  const result = snapshotSchema.safeParse(value);
  return result.success ? result.data : null;
}
export async function captureInvoiceCustomerSnapshot(tx: Prisma.TransactionClient, customerId: string | null, salesOrderId: string | null, header: InvoiceDraftData["header"]) {
  const order = salesOrderId ? await tx.salesOrder.findUnique({ where: { id: salesOrderId }, include: { customer: true } }) : null;
  const customer = customerId ? await tx.customer.findUnique({ where: { id: customerId } }) : order?.customer;
  return {
    companyNameSnapshot: customer?.companyName || header.clientNameSnapshot || null,
    clientNameSnapshot: header.clientNameSnapshot || customer?.companyName || order?.clientNameSnapshot || null,
    citySnapshot: header.citySnapshot || customer?.city || null, stateSnapshot: header.stateSnapshot || customer?.state || null, gstinSnapshot: header.gstinSnapshot || customer?.gstin || null,
    addressLine1: customer?.addressLine1 || null, addressLine2: customer?.addressLine2 || null, countrySnapshot: customer?.country || null, pincodeSnapshot: customer?.pincode || null,
    contactNameSnapshot: order?.receivedFromName || null, contactPhoneSnapshot: order?.receivedFromPhone || customer?.companyPhone || null,
    contactEmailSnapshot: order?.receivedFromEmail || customer?.companyEmail || null,
  };
}
