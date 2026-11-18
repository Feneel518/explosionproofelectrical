import "server-only";
import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma, databaseSchema } from "@/lib/prisma/db";

export class SubmissionLimitError extends Error {
  constructor() { super("Too many requests. Please wait a few minutes and try again."); }
}
export async function consumeSubmissionLimit(scope: string, identity: string, max: number, windowSeconds: number) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Submission protection is not configured.");
  const key = scope + ":" + createHmac("sha256", secret).update(identity.trim().toLowerCase()).digest("hex");
  const table = Prisma.raw(`"${databaseSchema}"."submission_limits"`);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO ${table} (key, count, "expiresAt") VALUES (${key}, 1, NOW() + ${windowSeconds} * INTERVAL '1 second')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN ${table}."expiresAt" <= NOW() THEN 1 ELSE ${table}.count + 1 END,
      "expiresAt" = CASE WHEN submission_limits."expiresAt" <= NOW() THEN NOW() + ${windowSeconds} * INTERVAL '1 second' ELSE submission_limits."expiresAt" END
    RETURNING count`;
  if (rows[0].count > max) throw new SubmissionLimitError();
}
