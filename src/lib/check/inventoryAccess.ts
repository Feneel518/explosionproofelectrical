import { requirePermission } from "./permissions";

export async function requireInventoryAccess(permission: "WRITE" | "MANAGE" = "WRITE") {
  return requirePermission(permission === "MANAGE" ? "inventory.manage" : "inventory.write");
}
