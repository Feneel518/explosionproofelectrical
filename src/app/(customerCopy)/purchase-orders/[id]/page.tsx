import { notFound } from "next/navigation";
import { Lora } from "next/font/google";
import PurchaseOrderCustomerCopy from "@/components/customerCopy/purchase-order/PurchaseOrderCustomerCopy";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default async function PurchaseOrderCopyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!order) notFound();

  const copy = {
    number: formatFinancialDocumentNumber(order.poFy, order.poNo),
    supplierName: order.supplierName,
    supplierAddress: order.supplierAddress,
    supplierEmail: order.supplierEmail,
    supplierPhone: order.supplierPhone,
    supplierGstin: order.supplierGstin,
    orderDate: order.orderDate.toISOString(),
    expectedDate: order.expectedDate?.toISOString() ?? null,
    paymentTerms: order.paymentTerms,
    deliveryTerms: order.deliveryTerms,
    shippingAddress: order.shippingAddress,
    remarks: order.remarks,
    terms: order.terms,
    subtotal: Number(order.subtotal),
    discountTotal: Number(order.discountTotal),
    taxableTotal: Number(order.taxableTotal),
    gstTotal: Number(order.gstTotal),
    shippingAmount: Number(order.shippingAmount),
    grandTotal: Number(order.grandTotal),
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      supplierItemName: item.supplierItemName,
      itemCode: item.itemCode,
      hsnCode: item.hsnCode,
      unit: item.unit,
      qty: Number(item.qty),
      unitPrice: Number(item.unitPrice),
      discountPercent: Number(item.discountPercent),
      gstPercent: Number(item.gstPercent),
      lineTotal: Number(item.lineTotal),
      remarks: item.remarks,
    })),
  };

  return (
    <main className={`${lora.className} my-20 flex flex-col items-center justify-center gap-4 print:my-0 print:gap-0`}>
      <PurchaseOrderCustomerCopy order={copy} />
    </main>
  );
}
