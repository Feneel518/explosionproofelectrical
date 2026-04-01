import { Prisma } from "@prisma/client";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function fail(message: string): ActionResult {
  return { ok: false, message };
}

export function prismaFieldErrorsFromZod(
  zodErrors: Record<string, string[]>,
): Record<string, string[]> {
  return zodErrors;
}

export function zodFieldErrors(err: unknown) {
  // safeParse already gives fieldErrors; we just normalize
  return err;
}

export function isUniqueConstraintError(e: unknown, field: string) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    Array.isArray((e.meta as any)?.target) &&
    ((e.meta as any).target as string[]).includes(field)
  );
}
