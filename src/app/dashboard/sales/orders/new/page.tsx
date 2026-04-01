import { createDraftSalesOrderAction } from "@/lib/actions/dashboard/sales/order/createDraftSalesOrderAction";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {}

const page: FC<PageProps> = async () => {
  const res = await createDraftSalesOrderAction();

  if (!res.ok) redirect("/dashboard/sales/orders");

  redirect(`/dashboard/sales/orders/${res.id}/edit`);
};

export default page;
