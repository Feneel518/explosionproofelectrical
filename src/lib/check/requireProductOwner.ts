import { requireAuth } from "./requireAuth";
import { redirect } from "next/navigation";

export const PRODUCT_OWNER_EMAIL = "feneelp@gmail.com";

export const isProductOwnerEmail = (email?: string | null) =>
  email?.trim().toLowerCase() === PRODUCT_OWNER_EMAIL;

export async function requireProductOwner() {
  const session = await requireAuth();

  if (!session.user.emailVerified || !isProductOwnerEmail(session.user.email)) {
    redirect("/dashboard");
  }

  return session;
}
