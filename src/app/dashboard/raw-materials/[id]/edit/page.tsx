import { FC } from "react";

import RawMaterialForm from "@/components/dashboard/raw-material/RawMaterialForm";
import { prisma } from "@/lib/prisma/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;

  const rawMaterial = await prisma.rawMaterial.findUnique({
    where: { id },
    select: {
      id: true,
      companyItemName: true,
      supplierItemName: true,
      itemCode: true,
      hsnCode: true,
      unit: true,
      description: true,
      reorderLevel: true,
      preferredSupplierId: true,
      status: true,
    },
  });

  if (!rawMaterial) {
    return <div className="text-sm text-muted-foreground">Raw material not found.</div>;
  }

  return (
    <div className="space-y-6">
      <RawMaterialForm
        mode="edit"
        rawMaterialId={rawMaterial.id}
        initial={{
          id: rawMaterial.id,
          companyItemName: rawMaterial.companyItemName,
          supplierItemName: rawMaterial.supplierItemName ?? "",
          itemCode: rawMaterial.itemCode ?? "",
          hsnCode: rawMaterial.hsnCode ?? "",
          unit: rawMaterial.unit,
          description: rawMaterial.description ?? "",
          reorderLevel: rawMaterial.reorderLevel ?? undefined,
          preferredSupplierId: rawMaterial.preferredSupplierId ?? "",
          status: rawMaterial.status,
        }}
      />
    </div>
  );
};

export default Page;
