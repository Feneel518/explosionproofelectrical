import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { FINALIZE_TRANSACTION_OPTIONS } from "./transactionOptions";

export async function withSerializableRetry<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(operation, FINALIZE_TRANSACTION_OPTIONS); }
    catch (error) {
      const code = (error as { code?: string }).code;
      if (attempt >= 3 || (code !== "P2034" && code !== "40001" && code !== "40P01")) throw error;
      await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }
}
