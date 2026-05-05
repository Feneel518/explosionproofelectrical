import fs from "node:fs/promises";
import path from "node:path";

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node scripts/import-machining-master.mjs <json-path>");
  process.exit(1);
}

const raw = await fs.readFile(inputPath, "utf8");
const rows = JSON.parse(raw);

const normalizedRows = rows.map((row, index) => ({
  rowNumber: Number(row.rowNumber ?? index + 2),
  name: String(row.name ?? "").trim(),
  operation: String(row.operation ?? "").trim(),
  rate: Number(row.rate || 0),
  role: row.role ? String(row.role).trim().toUpperCase() : null,
  status: row.status ? String(row.status).trim().toUpperCase() : "ACTIVE",
  unit: "Nos",
  sideLabel: null,
  notes: null,
}));

const invalidRows = normalizedRows.filter((row) => !row.name || !row.operation);
if (invalidRows.length > 0) {
  console.error("Rows with missing name/operation:", invalidRows);
  process.exit(1);
}

const productNames = [...new Set(normalizedRows.map((row) => row.name))];
const operationNames = [...new Set(normalizedRows.map((row) => row.operation))];
const desiredRateKeys = new Set(
  normalizedRows.map((row) => `${row.name}|||${row.operation}|||`),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const now = new Date();

try {
  const summary = await prisma.$transaction(async (tx) => {
    const existingProducts = await tx.contractorProduct.findMany({
      select: { id: true, name: true },
    });
    const existingOperations = await tx.contractorOperation.findMany({
      select: { id: true, name: true },
    });

    const productIdByName = new Map(existingProducts.map((item) => [item.name, item.id]));
    const operationIdByName = new Map(existingOperations.map((item) => [item.name, item.id]));

    let createdProducts = 0;
    let updatedProducts = 0;
    let createdOperations = 0;
    let updatedOperations = 0;
    let createdRates = 0;
    let updatedRates = 0;

    for (const name of productNames) {
      const existingId = productIdByName.get(name);
      if (existingId) {
        await tx.contractorProduct.update({
          where: { id: existingId },
          data: {
            status: "ACTIVE",
            deletedAt: null,
            deletedById: null,
          },
        });
        updatedProducts += 1;
      } else {
        const created = await tx.contractorProduct.create({
          data: {
            name,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        productIdByName.set(name, created.id);
        createdProducts += 1;
      }
    }

    for (const name of operationNames) {
      const existingId = operationIdByName.get(name);
      if (existingId) {
        await tx.contractorOperation.update({
          where: { id: existingId },
          data: {
            status: "ACTIVE",
            deletedAt: null,
            deletedById: null,
          },
        });
        updatedOperations += 1;
      } else {
        const created = await tx.contractorOperation.create({
          data: {
            name,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        operationIdByName.set(name, created.id);
        createdOperations += 1;
      }
    }

    for (const row of normalizedRows) {
      const contractorProductId = productIdByName.get(row.name);
      const contractorOperationId = operationIdByName.get(row.operation);

      const existing = await tx.contractorRate.findFirst({
        where: {
          contractorProductId,
          contractorOperationId,
          sideLabel: null,
        },
        select: { id: true },
      });

      const payload = {
        contractorProductId,
        contractorOperationId,
        sideLabel: null,
        unit: row.unit,
        defaultRate: row.rate,
        role: row.role,
        status: row.status,
        notes: row.notes,
        deletedAt: null,
        deletedById: null,
      };

      if (existing) {
        await tx.contractorRate.update({
          where: { id: existing.id },
          data: payload,
        });
        updatedRates += 1;
      } else {
        await tx.contractorRate.create({
          data: payload,
        });
        createdRates += 1;
      }
    }

    const allRates = await tx.contractorRate.findMany({
      select: {
        id: true,
        contractorProduct: { select: { name: true } },
        contractorOperation: { select: { name: true } },
        sideLabel: true,
        deletedAt: true,
      },
    });

    const rateIdsToArchive = allRates
      .filter((rate) => {
        const key = `${rate.contractorProduct.name}|||${rate.contractorOperation.name}|||${rate.sideLabel ?? ""}`;
        return !desiredRateKeys.has(key);
      })
      .map((rate) => rate.id);

    let archivedRates = 0;
    if (rateIdsToArchive.length > 0) {
      const result = await tx.contractorRate.updateMany({
        where: { id: { in: rateIdsToArchive } },
        data: {
          status: "INACTIVE",
          deletedAt: now,
        },
      });
      archivedRates = result.count;
    }

    const importedProductIds = new Set(
      normalizedRows.map((row) => productIdByName.get(row.name)),
    );
    const importedOperationIds = new Set(
      normalizedRows.map((row) => operationIdByName.get(row.operation)),
    );

    const archivedProducts = await tx.contractorProduct.updateMany({
      where: {
        id: { notIn: [...importedProductIds] },
        deletedAt: null,
      },
      data: {
        status: "INACTIVE",
        deletedAt: now,
      },
    });

    const archivedOperations = await tx.contractorOperation.updateMany({
      where: {
        id: { notIn: [...importedOperationIds] },
        deletedAt: null,
      },
      data: {
        status: "INACTIVE",
        deletedAt: now,
      },
    });

    return {
      totalRows: normalizedRows.length,
      createdProducts,
      updatedProducts,
      createdOperations,
      updatedOperations,
      createdRates,
      updatedRates,
      archivedRates,
      archivedProducts: archivedProducts.count,
      archivedOperations: archivedOperations.count,
      zeroRateRows: normalizedRows.filter((row) => row.rate === 0).length,
    };
  }, {
    maxWait: 10000,
    timeout: 120000,
  });

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await prisma.$disconnect();
  await pool.end();
}
