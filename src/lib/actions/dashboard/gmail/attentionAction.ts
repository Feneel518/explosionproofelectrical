"use server";

import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";
import { getSalesAttention } from "@/lib/gmail/attention";

export async function getSalesAttentionAction() {
  const { user } = await requireAuth();
  return getSalesAttention(prisma, user.id);
}
export type SalesAttentionData = Awaited<ReturnType<typeof getSalesAttentionAction>>;
