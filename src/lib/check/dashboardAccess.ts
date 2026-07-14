import { headers } from "next/headers";
import { auth } from "../auth/auth";

const FALLBACK_ALLOWED_DASHBOARD_EMAILS = ["feneelp@gmail.com"];

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const parseAllowedDashboardEmails = () => {
  const envList = (process.env.DASHBOARD_ALLOWED_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  const values =
    envList.length > 0 ? envList : FALLBACK_ALLOWED_DASHBOARD_EMAILS;

  return new Set(values.map(normalizeEmail));
};

export const isDashboardEmailAllowed = (email?: string | null) => {
  if (!email) return false;
  const allowedEmails = parseAllowedDashboardEmails();
  return allowedEmails.has(normalizeEmail(email));
};

export const canCurrentUserAccessDashboard = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return isDashboardEmailAllowed(session?.user.email);
};
