"use server";

import { requireInventoryAccess } from "@/lib/check/inventoryAccess";
import { prisma } from "@/lib/prisma/db";
import { revalidatePath } from "next/cache";

function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}T00:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveInventoryGoLiveAction(formData: FormData) {
  await requireInventoryAccess("MANAGE");
  const inventoryGoLiveDate = parseDate(formData.get("inventoryGoLiveDate"));
  const physicalStockCountAt = parseDate(formData.get("physicalStockCountAt"));

  if (!inventoryGoLiveDate || !physicalStockCountAt) {
    return { ok: false as const, message: "Go-live and physical-count dates are required." };
  }
  if (physicalStockCountAt >= inventoryGoLiveDate) {
    return { ok: false as const, message: "Physical count must be before the go-live date." };
  }

  await prisma.inventorySetting.upsert({
    where: { id: "default" },
    create: { id: "default", inventoryGoLiveDate, physicalStockCountAt },
    update: { inventoryGoLiveDate, physicalStockCountAt },
  });
  revalidatePath("/dashboard/inventory/go-live");
  return { ok: true as const, message: "Inventory go-live dates saved." };
}
