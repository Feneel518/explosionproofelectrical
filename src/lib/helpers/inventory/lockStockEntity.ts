import type { Prisma } from "@prisma/client";

// Transaction-scoped locks also protect the first movement, before a balance exists.
// Every stock balance writer uses the same key; PostgreSQL releases it on rollback.
export async function lockStockEntity(tx: Prisma.TransactionClient, entity: {
  rawMaterialId?: string | null;
  castingMasterId?: string | null;
  productVariantId?: string | null;
}) {
  const key = entity.rawMaterialId ? `stock:raw:${entity.rawMaterialId}`
    : entity.castingMasterId ? `stock:casting:${entity.castingMasterId}`
    : entity.productVariantId ? `stock:variant:${entity.productVariantId}` : null;
  if (!key) throw new Error("Select a stock item.");
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}
