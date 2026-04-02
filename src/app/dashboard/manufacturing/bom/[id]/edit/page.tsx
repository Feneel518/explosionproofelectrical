import { redirect } from "next/navigation";

import BomForm from "@/components/dashboard/manufacturing/bom/BomForm";
import { getVariantBomByIdAction } from "@/lib/actions/dashboard/manufacturing/bom/getVariantBomByIdAction";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const res = await getVariantBomByIdAction(id);

  if (!res.ok) {
    redirect("/dashboard/manufacturing/bom");
  }

  const bom = res.bom as any;

  return (
    <BomForm
      mode="edit"
      initial={{
        id: bom.id,
        variantId: bom.variantId,
        variantTitle: [bom.variant?.product?.name, bom.variant?.variant]
          .filter(Boolean)
          .join(" - "),
        isActive: Boolean(bom.isActive),
        notes: bom.notes ?? "",
        items: (bom.items ?? []).map((item: any) => ({
          id: item.id,
          componentType: item.componentType,
          rawMaterialId: item.rawMaterialId ?? null,
          castingMasterId: item.castingMasterId ?? null,
          componentTitle:
            item.componentType === "RAW_MATERIAL"
              ? item.rawMaterial?.companyItemName ?? ""
              : item.castingMaster?.castingItemName ?? "",
          unit:
            item.componentType === "RAW_MATERIAL"
              ? item.rawMaterial?.unit ?? null
              : item.castingMaster?.unit ?? null,
          qtyPerUnit: Number(item.qtyPerUnit || 1),
          remarks: item.remarks ?? "",
        })),
      }}
    />
  );
}
