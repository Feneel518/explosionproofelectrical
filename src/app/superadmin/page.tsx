import type { Metadata } from "next";

import ProductApprovalPortal from "@/components/superadmin/ProductApprovalPortal";
import { requireProductOwner } from "@/lib/check/requireProductOwner";
import { prisma } from "@/lib/prisma/db";
import { getProductApprovalSettings } from "@/lib/products/approval";

export const metadata: Metadata = {
  title: "Product Approval Portal",
  robots: { index: false, follow: false },
};

export default async function SuperadminPage() {
  await requireProductOwner();

  const [settings, pending, recent, grouped, liveProducts] = await Promise.all([
    getProductApprovalSettings(),
    prisma.productApprovalRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { requester: { select: { name: true, email: true } } },
    }),
    prisma.productApprovalRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      include: { requester: { select: { name: true, email: true } } },
    }),
    prisma.productApprovalRequest.groupBy({ by: ["status"], _count: true }),
    prisma.product.count({ where: { deletedAt: null } }),
  ]);

  const count = (status: "PENDING" | "APPROVED" | "REJECTED") =>
    grouped.find((row) => row.status === status)?._count ?? 0;
  const shape = (item: (typeof pending)[number]) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: undefined,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    payload: item.payload as Record<string, unknown>,
  });

  return (
    <ProductApprovalPortal
      pendingItems={pending.map(shape)}
      recentItems={recent.map(shape)}
      initialSettings={{
        approvalEmail: settings.approvalEmail,
        requireProductApproval: settings.requireProductApproval,
        requireVariantApproval: settings.requireVariantApproval,
        sendEmailNotifications: settings.sendEmailNotifications,
      }}
      counts={{
        pending: count("PENDING"),
        approved: count("APPROVED"),
        rejected: count("REJECTED"),
        liveProducts,
      }}
    />
  );
}
