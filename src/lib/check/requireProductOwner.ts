import { requireAuth } from "./requireAuth";
import { redirect } from "next/navigation";

const ownerEmails = (process.env.DASHBOARD_OWNER_EMAILS ?? "feneelp@gmail.com").split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
export const PRODUCT_OWNER_EMAIL = ownerEmails[0] || "";

export const isProductOwnerEmail = (email?: string | null) =>
  Boolean(email && ownerEmails.includes(email.trim().toLowerCase()));

export async function requireProductOwner() {
  const session = await requireAuth();

  if (!session.user.emailVerified || (!isProductOwnerEmail(session.user.email) && (session.user as { role?: string }).role !== "OWNER")) {
    redirect("/dashboard");
  }

  return session;
}
