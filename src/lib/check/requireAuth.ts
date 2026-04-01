"use server";

import { headers } from "next/headers";
import { auth } from "../auth/auth";
import { redirect } from "next/navigation";
import { isDashboardEmailAllowed } from "./dashboardAccess";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    redirect("/auth/login");
  }

  if (!isDashboardEmailAllowed(session.user.email)) {
    redirect("/");
  }

  return { user: session.user };
};
