import SalesOrderFormNew from "@/components/dashboard/sales/order/SalesOrderFormNew";
import { listCustomersForSelect } from "@/lib/actions/dashboard/global/listCustomersForSelect";
import { getSalesOrderDraftAction } from "@/lib/actions/dashboard/sales/order/getSalesOrderDraftAction";
import { SalesOrderFormValues } from "@/lib/validators/dashboard/sales/orders/OrderValidator";
import { redirect } from "next/navigation";
import { FC } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;
  const res = await getSalesOrderDraftAction(id);

  if (!res.ok) redirect("/dashboard/sales/orders");

  const customers = await listCustomersForSelect();

  return (
    <SalesOrderFormNew
      salesOrderId={res.salesOrderId}
      orderFY={res.orderFY}
      orderNo={res.orderNo}
      initialDraft={res.draft as SalesOrderFormValues}
      initialDraftVersion={res.draftVersion}
      customers={customers}
    />
  );
};

export default page;
