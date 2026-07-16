import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAuth } from "@/lib/check/requireAuth";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAuth();
  const returns = await prisma.materialReturn.findMany({
    orderBy: [{ returnDate: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { materialIssue: { select: { issueNo: true, issueFy: true } }, items: { select: { qty: true, condition: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Material Returns</h1><p className="text-sm text-muted-foreground">Employee returns linked to finalized material issues.</p></div><Button asChild><Link href="/dashboard/inventory/returns/new">Record Return</Link></Button></div>
      <div className="rounded-xl border"><Table><TableHeader><TableRow><TableHead>Return No.</TableHead><TableHead>Date</TableHead><TableHead>Original Issue</TableHead><TableHead>Returned By</TableHead><TableHead>Reusable</TableHead><TableHead>Damaged/Scrap</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
        {returns.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No returns recorded.</TableCell></TableRow> : returns.map((row) => {
          const reusable = row.items.filter((item) => item.condition === "REUSABLE").reduce((sum, item) => sum + Number(item.qty), 0);
          const unusable = row.items.filter((item) => item.condition !== "REUSABLE").reduce((sum, item) => sum + Number(item.qty), 0);
          return <TableRow key={row.id}><TableCell className="font-medium">{formatFinancialDocumentNumber(row.returnFy, row.returnNo)}</TableCell><TableCell>{row.returnDate.toLocaleDateString("en-IN")}</TableCell><TableCell>{formatFinancialDocumentNumber(row.materialIssue.issueFy, row.materialIssue.issueNo)}</TableCell><TableCell>{row.returnedByNameSnapshot}</TableCell><TableCell>{reusable}</TableCell><TableCell>{unusable}</TableCell><TableCell><Badge variant="outline">{row.status}</Badge></TableCell></TableRow>;
        })}
      </TableBody></Table></div>
    </div>
  );
}
