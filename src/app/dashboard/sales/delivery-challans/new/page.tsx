import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import { createDraftDeliveryChallanAction } from "@/lib/actions/dashboard/sales/delivery-challan/createDraftDeliveryChallanAction";
import { redirect } from "next/navigation";
import { FC } from "react";

interface pageProps {}

const page: FC<pageProps> = async ({}) => {
  await requirePermission("sales.write");
  const res = await createDraftDeliveryChallanAction();

  if (!res.ok) redirect("/dashboard/sales/delivery-challans");
  redirect(`/dashboard/sales/delivery-challans/${res.id}/edit`);
};

export default page;
