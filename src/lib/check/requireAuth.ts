import "server-only";

import { prisma } from "../prisma/db";
import { getAuthSession } from "../auth/session";
import { redirect, unstable_rethrow } from "next/navigation";
import { isDashboardEmailAllowed } from "./dashboardAccess";

export const requireAuth = async () => {
  const session = await getAuthSession().catch((error) => {
    unstable_rethrow(error);
    console.error("Dashboard session lookup failed", error);
    redirect("/auth/error?error=service_unavailable");
  });

  if (!session?.user.id) {
    redirect("/auth/login");
  }

  if (!isDashboardEmailAllowed(session.user.email)) {
    redirect("/");
  }

  // Read current access on every request, rather than trusting a cached session role.
  const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, emailVerified: true, role: true } });
  if (!current?.emailVerified || !isDashboardEmailAllowed(current.email)) redirect("/auth/login");
  return { user: { ...session.user, ...current } };
};
