import { notFound } from "next/navigation";
import { getSalesOrderByIdAction } from "@/lib/actions/dashboard/sales/order/getSalesOrderByIdAction";
import SalesOrderCustomerCopy from "@/components/customerCopy/sales-order/SalesOrderCustomerCopy";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const result = await getSalesOrderByIdAction(id);
  if (!result.ok || result.order.deletedAt) notFound();
  const query = await searchParams;
  return <SalesOrderCustomerCopy order={result.order} autoPrint={query.print === "1"} />;
}
