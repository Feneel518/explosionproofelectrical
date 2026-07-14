import { serializeForClient } from "@/lib/helpers/server/serializeForClient";
import { prisma } from "@/lib/prisma/db";
import BomTable from "@/components/dashboard/manufacturing/bom/BomTable";

export const dynamic = "force-dynamic";

export default async function Page() {
  const boms = await prisma.variantBom.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      variant: {
        select: {
          id: true,
          variant: true,
          sku: true,
          typeNumber: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    take: 500,
  });

  const safeBoms = serializeForClient(boms);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">BOM</h1>
        <p className="text-sm text-muted-foreground">
          Define raw material and casting consumption per finished product unit.
        </p>
      </div>
      <BomTable items={safeBoms as any} />
    </div>
  );
}
