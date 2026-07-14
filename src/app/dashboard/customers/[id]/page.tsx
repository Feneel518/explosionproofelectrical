import { FC } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { prisma } from "@/lib/prisma/db";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const Page: FC<PageProps> = async ({ params }) => {
  const { id } = await params;

  const [customer, orderedItems] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        gstin: true,
        defaultQuotationGst: true,
        defaultQuotationPackingCharges: true,
        defaultQuotationTransportationPayment: true,
        defaultQuotationPaymentTerms: true,
        defaultQuotationDeliveryDate: true,
        status: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
    prisma.salesOrderItem.findMany({
      where: {
        salesOrder: {
          customerId: id,
          status: {
            notIn: ["DRAFT", "CANCELLED"],
          },
        },
      },
      orderBy: [{ salesOrder: { orderDate: "desc" } }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        sku: true,
        typeNumber: true,
        qty: true,
        unit: true,
        unitPrice: true,
        salesOrder: {
          select: {
            id: true,
            orderNo: true,
            orderFy: true,
            orderDate: true,
            status: true,
          },
        },
      },
      take: 500,
    }),
  ]);

  if (!customer) {
    return <div className="text-sm text-muted-foreground">Customer not found.</div>;
  }

  const uniqueProductsCount = new Set(
    orderedItems.map((item) => `${item.sku ?? ""}|${item.typeNumber ?? ""}|${item.title}`),
  ).size;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatDate = (value?: Date | null) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.companyName}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{customer.status}</Badge>
            {customer.deletedAt ? <Badge variant="destructive">DELETED</Badge> : null}
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/customers/${customer.id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Email:</span> {customer.companyEmail ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Phone:</span> {customer.companyPhone ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">GSTIN:</span> {customer.gstin ?? "-"}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Address:</span> {customer.addressLine1}
          {customer.addressLine2 ? `, ${customer.addressLine2}` : ""}, {customer.city}, {customer.state},{" "}
          {customer.country} - {customer.pincode}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Default Quotation Terms:</span>{" "}
          {customer.defaultQuotationGst} | {customer.defaultQuotationPackingCharges} |{" "}
          {customer.defaultQuotationTransportationPayment} | {customer.defaultQuotationPaymentTerms}
          {customer.defaultQuotationDeliveryDate
            ? ` | ${customer.defaultQuotationDeliveryDate}`
            : ""}
        </div>
        <div className="text-xs text-muted-foreground">
          Created: {new Date(customer.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold">Ordered Products & Prices</div>
            <div className="text-xs text-muted-foreground">
              Products ordered by this customer through sales orders.
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Lines: <span className="font-medium text-foreground">{orderedItems.length}</span> | Unique products:{" "}
            <span className="font-medium text-foreground">{uniqueProductsCount}</span>
          </div>
        </div>

        {orderedItems.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            No ordered products found for this customer yet.
          </div>
        ) : (
          <div className="rounded-xl border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Sales Order</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Product</TableHead>
                  <TableHead className="text-white">Code</TableHead>
                  <TableHead className="text-white">Qty</TableHead>
                  <TableHead className="text-right text-white">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/sales/orders/${item.salesOrder.id}`}
                        className="font-medium hover:underline">
                        {formatFinancialDocumentNumber(item.salesOrder.orderFy, item.salesOrder.orderNo)}
                      </Link>
                      <div className="text-xs text-muted-foreground">{item.salesOrder.status}</div>
                    </TableCell>
                    <TableCell>{formatDate(item.salesOrder.orderDate)}</TableCell>
                    <TableCell>{item.title || "-"}</TableCell>
                    <TableCell>
                      {[item.sku, item.typeNumber].filter(Boolean).join(" | ") || "-"}
                    </TableCell>
                    <TableCell>
                      {item.qty}
                      {item.unit ? ` ${item.unit}` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      Rs. {formatCurrency(Number(item.unitPrice || 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Button asChild variant="ghost">
        <Link href="/dashboard/customers">{"<-"} Back to Customers</Link>
      </Button>
    </div>
  );
};

export default Page;
