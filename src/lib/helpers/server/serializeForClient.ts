import { Prisma } from "@prisma/client";

export type ClientSafe<T> = T extends Prisma.Decimal
  ? number
  : T extends bigint
    ? number
    : T extends Date
      ? Date
      : T extends (infer U)[]
        ? ClientSafe<U>[]
        : T extends object
          ? { [K in keyof T]: ClientSafe<T[K]> }
          : T;

/**
 * Convert Prisma Decimal/BigInt values to JSON-safe primitives before passing
 * data from Server Components or Server Actions into Client Components.
 */
export function serializeForClient<T>(value: T): ClientSafe<T> {
  const seen = new WeakMap<object, unknown>();

  const walk = (input: unknown): unknown => {
    if (input === null || input === undefined) return input;

    if (input instanceof Prisma.Decimal) {
      return input.toNumber();
    }

    if (typeof input === "bigint") {
      return Number(input);
    }

    if (input instanceof Date) {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => walk(item));
    }

    if (typeof input === "object") {
      if (seen.has(input as object)) {
        return seen.get(input as object);
      }

      const output: Record<string, unknown> = {};
      seen.set(input as object, output);

      for (const [key, item] of Object.entries(input as Record<string, unknown>)) {
        output[key] = walk(item);
      }

      return output;
    }

    return input;
  };

  return walk(value) as ClientSafe<T>;
}

