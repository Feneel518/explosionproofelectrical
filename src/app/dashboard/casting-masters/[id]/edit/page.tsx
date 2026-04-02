import { FC } from "react";

import CastingMasterForm from "@/components/dashboard/casting-master/CastingMasterForm";
import { prisma } from "@/lib/prisma/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;

  const casting = await prisma.castingMaster.findUnique({
    where: { id },
    select: {
      id: true,
      castingItemName: true,
      castingCode: true,
      drawingNumber: true,
      hsnCode: true,
      unit: true,
      standardWeightKg: true,
      reorderLevel: true,
      description: true,
      status: true,
    },
  });

  if (!casting) {
    return <div className="text-sm text-muted-foreground">Casting master not found.</div>;
  }

  return (
    <div className="space-y-6">
      <CastingMasterForm
        mode="edit"
        initial={{
          id: casting.id,
          castingItemName: casting.castingItemName,
          castingCode: casting.castingCode ?? "",
          drawingNumber: casting.drawingNumber ?? "",
          hsnCode: casting.hsnCode ?? "",
          unit: casting.unit,
          standardWeightKg:
            casting.standardWeightKg == null ? undefined : Number(casting.standardWeightKg),
          reorderLevel: casting.reorderLevel ?? undefined,
          description: casting.description ?? "",
          status: casting.status,
        }}
      />
    </div>
  );
};

export default Page;
