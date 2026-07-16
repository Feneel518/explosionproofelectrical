import { requireAuth } from "./requireAuth";

type InventoryPermission = "WRITE" | "MANAGE";

function emails(value?: string) {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export async function requireInventoryAccess(permission: InventoryPermission = "WRITE") {
  const session = await requireAuth();
  const storekeepers = emails(process.env.INVENTORY_STOREKEEPER_EMAILS);
  const managers = emails(process.env.INVENTORY_MANAGER_EMAILS);

  // Backward-compatible until inventory-specific access lists are configured.
  if (storekeepers.size === 0 && managers.size === 0) return session;

  const email = session.user.email?.toLowerCase() ?? "";
  const allowed = permission === "MANAGE"
    ? managers.has(email)
    : managers.has(email) || storekeepers.has(email);

  if (!allowed) throw new Error("You do not have permission for this inventory action.");
  return session;
}
