import { notFound, redirect } from "next/navigation";
import PurchaseOrderForm from "@/components/dashboard/purchase/order/PurchaseOrderForm";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";
import type { PurchaseOrderDraft } from "@/lib/types/PurchaseOrderTypes";
export default async function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const order = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true, poNo: true, poFy: true, draftData: true } }); if (!order) notFound(); if (order.status !== "DRAFT") redirect(`/dashboard/purchase/orders/${id}`); return <PurchaseOrderForm orderId={id} documentNumber={formatFinancialDocumentNumber(order.poFy, order.poNo)} initialDraft={order.draftData as PurchaseOrderDraft}/>; }
