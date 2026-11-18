import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const PURCHASE_ORDER_SHARE_DAYS = 7;
export function issuePurchaseOrderShare(now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(now.getTime() + PURCHASE_ORDER_SHARE_DAYS * 86400000) };
}
export function validPurchaseOrderShare(order: { status: string; shareTokenHash: string | null; shareExpiresAt: Date | null }, token: unknown, now = new Date()) {
  if (!["FINALIZED", "SENT"].includes(order.status) || typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)
    || !order.shareExpiresAt || order.shareExpiresAt <= now || !order.shareTokenHash || !/^[a-f0-9]{64}$/.test(order.shareTokenHash)) return false;
  const actual = createHash("sha256").update(token).digest();
  return timingSafeEqual(actual, Buffer.from(order.shareTokenHash, "hex"));
}
