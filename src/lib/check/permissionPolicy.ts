export type Permission = "dashboard.read" | "analytics.read" | "sales.read" | "sales.write"
  | "purchase.read" | "purchase.write" | "inventory.read" | "inventory.write" | "inventory.manage"
  | "production.read" | "production.write" | "accounts.read" | "accounts.write"
  | "master.read" | "master.write" | "content.read" | "content.write";

export function emailList(value?: string) {
  return new Set((value ?? "").split(",").map(email => email.trim().toLowerCase()).filter(Boolean));
}

export function hasPermission(user: { email?: string | null; emailVerified?: boolean; role?: string | null }, permission: Permission) {
  if (!user.emailVerified || !user.email) return false;
  const email = user.email.trim().toLowerCase();
  // Preserve the established owner only when an explicit owner list has not been configured.
  const owners = emailList(process.env.DASHBOARD_OWNER_EMAILS ?? "feneelp@gmail.com");
  if (owners.has(email) || user.role === "OWNER" || user.role === "ADMIN") return true;
  if (permission === "dashboard.read") return true;
  const department = permission.split(".")[0];
  const grants: Record<string, Set<string>> = {
    sales: emailList(process.env.SALES_EMAILS), purchase: emailList(process.env.PURCHASE_EMAILS),
    accounts: emailList(process.env.ACCOUNTS_EMAILS), production: emailList(process.env.PRODUCTION_EMAILS),
    master: emailList(process.env.MASTER_DATA_EMAILS), content: emailList(process.env.CONTENT_EDITOR_EMAILS),
    analytics: emailList(process.env.ANALYTICS_EMAILS),
  };
  if (permission === "master.read" && (Object.values(grants).some(list => list.has(email)) || emailList(process.env.INVENTORY_STOREKEEPER_EMAILS).has(email) || emailList(process.env.INVENTORY_MANAGER_EMAILS).has(email))) return true;
  if (permission === "sales.read" && grants.accounts.has(email)) return true;
  if (department === "inventory") {
    const managers = emailList(process.env.INVENTORY_MANAGER_EMAILS);
    const stores = emailList(process.env.INVENTORY_STOREKEEPER_EMAILS);
    if (permission === "inventory.manage") return managers.has(email) || user.role === "MANAGER";
    return managers.has(email) || stores.has(email) || user.role === "MANAGER";
  }
  return user.role === "MANAGER" || Boolean(grants[department]?.has(email));
}
