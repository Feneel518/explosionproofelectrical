/* eslint-disable no-console */
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      openingStockQty: true,
    },
  });

  const castings = await prisma.castingMaster.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      openingStockQty: true,
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const deletedLedger = await tx.stockLedger.deleteMany({});
    const deletedBalances = await tx.stockBalance.deleteMany({});

    const rawRows = rawMaterials.map((row) => {
      const qtyOnHand = Math.max(0, Math.trunc(Number(row.openingStockQty || 0)));
      return {
        rawMaterialId: row.id,
        productVariantId: null,
        castingMasterId: null,
        qtyOnHand,
        qtyReserved: 0,
        qtyAvailable: qtyOnHand,
        lastMovementAt: null,
      };
    });

    const castingRows = castings.map((row) => {
      const qtyOnHand = Math.max(0, Math.trunc(Number(row.openingStockQty || 0)));
      return {
        rawMaterialId: null,
        productVariantId: null,
        castingMasterId: row.id,
        qtyOnHand,
        qtyReserved: 0,
        qtyAvailable: qtyOnHand,
        lastMovementAt: null,
      };
    });

    if (rawRows.length > 0) {
      await tx.stockBalance.createMany({
        data: rawRows,
      });
    }

    if (castingRows.length > 0) {
      await tx.stockBalance.createMany({
        data: castingRows,
      });
    }

    return {
      deletedLedgerCount: deletedLedger.count,
      deletedBalanceCount: deletedBalances.count,
      createdRawBalances: rawRows.length,
      createdCastingBalances: castingRows.length,
    };
  });

  console.log("Stock reset completed.");
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error("Failed to reset stock to opening:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
