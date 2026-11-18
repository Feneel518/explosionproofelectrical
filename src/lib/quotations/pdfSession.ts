import { cookies } from "next/headers";

/** Only the configured app origin can receive the signed-in user's cookies. */
export async function quotationPdfSession() {
  const origin = new URL(process.env.BETTER_AUTH_URL || "");
  if (origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))) {
    throw new Error("Quotation PDFs require a valid BETTER_AUTH_URL.");
  }
  return { origin: origin.origin, cookies: (await cookies()).getAll().map(({ name, value }) => ({ name, value })) };
}
