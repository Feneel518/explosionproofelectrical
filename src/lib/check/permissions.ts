import "server-only";
import { redirect } from "next/navigation";
import { requireAuth } from "./requireAuth";
import { hasPermission, type Permission } from "./permissionPolicy";

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  if (!hasPermission(session.user, permission)) throw new Error("You do not have permission for this action. Ask the owner to update your access.");
  return session;
}

export async function requirePagePermission(permission: Permission) {
  const session = await requireAuth();
  if (!hasPermission(session.user, permission)) redirect("/dashboard?access=denied");
  return session;
}
