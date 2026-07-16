import MaterialReturnForm from "@/components/dashboard/inventory/material-return/MaterialReturnForm";
import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ issueId?: string }> }) {
  await requireAuth();
  const { issueId } = await searchParams;
  const rows = await prisma.materialIssue.findMany({
    where: { status: "FINALIZED", issueType: "INTERNAL_USE" },
    orderBy: { issueDate: "desc" },
    take: 250,
    select: { id: true, issueNo: true, issueFy: true, issuedToNameSnapshot: true, items: { select: { qtyIssued: true, qtyReturned: true } } },
  });
  const issues = rows
    .filter((row) => row.items.some((item) => Number(item.qtyIssued) > Number(item.qtyReturned)))
    .map((row) => ({ id: row.id, label: formatFinancialDocumentNumber(row.issueFy, row.issueNo), employee: row.issuedToNameSnapshot }));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold">Record Material Return</h1><p className="text-sm text-muted-foreground">Return reusable, damaged, or scrap material against its original issue.</p></div>
      <MaterialReturnForm issues={issues} initialIssueId={issueId} />
    </div>
  );
}
