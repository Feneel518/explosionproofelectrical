import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const workers = await prisma.worker.findMany({
    where: { kind: "CASTING", deletedAt: null },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { castingJobs: true, castingRates: true } },
      castingJobs: {
        where: { status: { in: ["IN_PROGRESS", "PARTIAL_RECEIVED"] } },
        select: { totalPendingWeightKg: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Casting Workers</h1>
          <p className="text-sm text-muted-foreground">Workers who receive aluminum and return castings.</p>
        </div>
        <Button asChild><Link href="/dashboard/casting-workers/new">New Casting Worker</Link></Button>
      </div>
      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-white">Code</TableHead><TableHead className="text-white">Worker</TableHead>
            <TableHead className="text-white">Status</TableHead><TableHead className="text-right text-white">Jobs</TableHead>
            <TableHead className="text-right text-white">Saved Rates</TableHead><TableHead className="text-right text-white">Material Pending</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {workers.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No casting workers yet.</TableCell></TableRow> : workers.map((worker) => {
              const pending = worker.castingJobs.reduce((sum, job) => sum + Number(job.totalPendingWeightKg), 0);
              return <TableRow key={worker.id}>
                <TableCell className="font-mono">{worker.code}</TableCell>
                <TableCell>{worker.name}</TableCell><TableCell><Badge variant="outline">{worker.status}</Badge></TableCell>
                <TableCell className="text-right">{worker._count.castingJobs}</TableCell>
                <TableCell className="text-right">{worker._count.castingRates}</TableCell>
                <TableCell className="text-right">{pending.toFixed(3)} kg</TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
