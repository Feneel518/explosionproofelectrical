"use server";

import { headers } from "next/headers";
import { auth } from "../auth/auth";
import { redirect } from "next/navigation";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    redirect("/");
  }

  return { user: session.user };
};
