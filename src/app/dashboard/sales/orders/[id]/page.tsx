// app/dashboard/sales/orders/[id]/page.tsx

import SalesOrderDetailsPage from "@/components/dashboard/sales/order/SalesOrderDetailsPage";
import { getSalesOrderByIdAction } from "@/lib/actions/dashboard/sales/order/getSalesOrderByIdAction";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;

  const res = await getSalesOrderByIdAction(id);

  if (!res.ok) redirect("/dashboard/sales/orders");

  return <SalesOrderDetailsPage order={res.order} />;
};

export default page;
