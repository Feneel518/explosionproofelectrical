"use server";

import { requirePermission } from "@/lib/check/permissions";
import { prisma } from "@/lib/prisma/db";
import { getSalesAttention } from "@/lib/gmail/attention";

export async function getSalesAttentionAction() {
  const { user } = await requirePermission("sales.write");
  return getSalesAttention(prisma, user.id);
}
export type SalesAttentionData = Awaited<ReturnType<typeof getSalesAttentionAction>>;
