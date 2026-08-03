import { notFound } from "next/navigation";

import PrintSerialLabelsButton from "@/components/dashboard/serial/PrintSerialLabelsButton";
import { prisma } from "@/lib/prisma/db";

export const dynamic = "force-dynamic";

export default async function PrintSerialBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const serials = await prisma.productSerial.findMany({
    where: { batchId },
    orderBy: { sequence: "asc" },
    select: { serialNumber: true, product: { select: { name: true } } },
  });

  if (!serials.length) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 print:max-w-none print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div><h1 className="text-xl font-semibold">Serial label batch</h1><p className="text-sm text-muted-foreground">Three matching labels are provided for each unit: body, LED and driver.</p></div>
        <PrintSerialLabelsButton />
      </div>
      <div className="grid grid-cols-3 gap-2 print:gap-1">
        {serials.flatMap((serial) => ["BODY", "LED", "DRIVER"].map((part) => (
          <div key={`${serial.serialNumber}-${part}`} className="break-inside-avoid rounded border border-black p-3 text-center">
            <div className="truncate text-[10px] uppercase">{serial.product.name} · {part}</div>
            <div className="mt-1 whitespace-nowrap font-mono text-sm font-bold">{serial.serialNumber}</div>
          </div>
        )))}
      </div>
    </div>
  );
}
