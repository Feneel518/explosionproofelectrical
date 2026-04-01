import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lora } from "next/font/google";
import WorkOrderCopy from "@/components/customerCopy/sales-order/WorkOrderCopy";
import { getSalesOrderByIdAction } from "@/lib/actions/dashboard/sales/order/getSalesOrderByIdAction";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ items?: string }>;
}

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
export default async function WorkOrderPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { items } = await searchParams;

  const selectedIds = (items ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const order = await getSalesOrderByIdAction(id);

  if (!order.order) notFound();

  const filteredItems =
    selectedIds.length > 0
      ? order.order.items.filter((item) => selectedIds.includes(item.id))
      : order.order.items;


  return (
    <div
      className={` ${lora.className} flex flex-col items-center justify-center gap-4 print:gap-0 my-20 print:my-0`}>
      <WorkOrderCopy order={order.order} items={filteredItems}></WorkOrderCopy>
    </div>
  );
}
