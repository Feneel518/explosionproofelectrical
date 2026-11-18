import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

export const databaseSchema = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).searchParams.get("schema") || "public" : "public";
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseSchema)) throw new Error("Invalid database schema name.");

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

const adapter = new PrismaPg(pool, { schema: databaseSchema });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // optional:
    // log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
