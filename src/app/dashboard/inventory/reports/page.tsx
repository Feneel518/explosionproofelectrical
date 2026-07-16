import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAuth } from "@/lib/check/requireAuth";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

function quantity(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);
}

export default async function Page() {
  await requireAuth();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [materials, issues] = await Promise.all([
    prisma.rawMaterial.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { companyItemName: "asc" },
      select: {
        id: true,
        itemCode: true,
        companyItemName: true,
        unit: true,
        reorderLevel: true,
        maximumStockLevel: true,
        storageLocation: true,
        binNumber: true,
        preferredSupplier: { select: { companyName: true } },
        stockBalance: { select: { qtyOnHand: true, qtyAvailable: true } },
      },
    }),
    prisma.materialIssue.findMany({
      where: { status: "FINALIZED", issueType: "INTERNAL_USE", issueDate: { gte: monthStart } },
      select: {
        issuedToEmployeeId: true,
        issuedToNameSnapshot: true,
        department: true,
        issuedToEmployee: { select: { employeeCode: true } },
        items: { select: { qtyIssued: true, qtyReturned: true } },
        returns: {
          where: { status: "FINALIZED" },
          select: { items: { select: { qty: true, condition: true } } },
        },
      },
    }),
  ]);

  const reorderRows = materials.filter((row) =>
    row.reorderLevel != null && Number(row.stockBalance?.qtyAvailable ?? 0) <= Number(row.reorderLevel),
  );
  const employeeMap = new Map<string, { employee: string; code: string; department: string; issued: number; returned: number; net: number }>();
  for (const issue of issues) {
    const key = issue.issuedToEmployeeId ?? issue.issuedToNameSnapshot;
    const current = employeeMap.get(key) ?? {
      employee: issue.issuedToNameSnapshot,
      code: issue.issuedToEmployee?.employeeCode ?? "—",
      department: issue.department ?? "—",
      issued: 0,
      returned: 0,
      net: 0,
    };
    for (const item of issue.items) {
      current.issued += Number(item.qtyIssued);
    }
    current.returned += issue.returns.flatMap((row) => row.items)
      .filter((item) => item.condition === "REUSABLE")
      .reduce((sum, item) => sum + Number(item.qty), 0);
    current.net = current.issued - current.returned;
    employeeMap.set(key, current);
  }
  const employeeRows = Array.from(employeeMap.values()).sort((a, b) => b.net - a.net);

  return (
    <div className="space-y-8">
      <div><h1 className="text-2xl font-semibold">Raw Material Reports</h1><p className="text-sm text-muted-foreground">Reordering and employee consumption controls for the current month.</p></div>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Reorder Report</h2><p className="text-sm text-muted-foreground">Materials at or below their configured reorder level.</p></div>
        <div className="rounded-xl border"><Table><TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Location</TableHead><TableHead>Available</TableHead><TableHead>Reorder At</TableHead><TableHead>Suggested Qty</TableHead><TableHead>Supplier</TableHead></TableRow></TableHeader><TableBody>
          {reorderRows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No materials currently require reordering.</TableCell></TableRow> : reorderRows.map((row) => {
            const available = Number(row.stockBalance?.qtyAvailable ?? 0);
            const target = Number(row.maximumStockLevel ?? row.reorderLevel ?? 0);
            return <TableRow key={row.id}><TableCell><span className="font-medium">{row.companyItemName}</span><span className="block text-xs text-muted-foreground">{row.itemCode ?? "—"}</span></TableCell><TableCell>{[row.storageLocation, row.binNumber].filter(Boolean).join(" / ") || "—"}</TableCell><TableCell><Badge variant="destructive">{quantity(available)} {row.unit}</Badge></TableCell><TableCell>{quantity(Number(row.reorderLevel))}</TableCell><TableCell>{quantity(Math.max(0, target - available))}</TableCell><TableCell>{row.preferredSupplier?.companyName ?? "—"}</TableCell></TableRow>;
          })}
        </TableBody></Table></div>
      </section>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Employee Consumption — This Month</h2><p className="text-sm text-muted-foreground">Issued less reusable returns, grouped by employee. Damaged and scrap returns remain part of consumption/loss.</p></div>
        <div className="rounded-xl border"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Issued</TableHead><TableHead>Returned</TableHead><TableHead>Net Consumption</TableHead></TableRow></TableHeader><TableBody>
          {employeeRows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No internal material issues this month.</TableCell></TableRow> : employeeRows.map((row) => <TableRow key={`${row.code}-${row.employee}`}><TableCell>{row.code}</TableCell><TableCell className="font-medium">{row.employee}</TableCell><TableCell>{row.department}</TableCell><TableCell>{quantity(row.issued)}</TableCell><TableCell>{quantity(row.returned)}</TableCell><TableCell>{quantity(row.net)}</TableCell></TableRow>)}
        </TableBody></Table></div>
      </section>
    </div>
  );
}
