import { requirePagePermission as requirePermission } from "@/lib/check/permissions";
import { createDraftSalesOrderAction } from "@/lib/actions/dashboard/sales/order/createDraftSalesOrderAction";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {}

const page: FC<PageProps> = async () => {
  await requirePermission("sales.write");
  const res = await createDraftSalesOrderAction();

  if (!res.ok) redirect("/dashboard/sales/orders");

  redirect(`/dashboard/sales/orders/${res.id}/edit`);
};

export default page;
