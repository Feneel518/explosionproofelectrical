"use server";

import { getInvoiceableOrderForSelectById } from "./getInvoiceableOrderForSelectById";

// Backward-compatible helper name kept for older imports.
export const getInvoiceableSalesOrderById = async (salesOrderId: string) => {
  return getInvoiceableOrderForSelectById(salesOrderId);
};
