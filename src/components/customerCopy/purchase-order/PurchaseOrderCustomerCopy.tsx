"use client";

import * as React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import A4Page from "@/components/customerCopy/A4Page";
import DocumentFooter from "@/components/customerCopy/DocumentFooter";
import DocumentHeader from "@/components/customerCopy/DocumentHeader";
import DocumentHeaderSmall from "@/components/customerCopy/DocumentHeaderSmall";

export type PurchaseOrderCopyData = {
  number: string;
  supplierName: string;
  supplierAddress: string | null;
  supplierEmail: string | null;
  supplierPhone: string | null;
  supplierGstin: string | null;
  orderDate: string;
  expectedDate: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  shippingAddress: string | null;
  remarks: string | null;
  terms: string | null;
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  gstTotal: number;
  shippingAmount: number;
  grandTotal: number;
  items: Array<{
    id: string;
    title: string;
    supplierItemName: string | null;
    itemCode: string | null;
    hsnCode: string | null;
    unit: string;
    qty: number;
    unitPrice: number;
    discountPercent: number;
    gstPercent: number;
    lineTotal: number;
    remarks: string | null;
  }>;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);

function PurchaseOrderHeader({ order }: { order: PurchaseOrderCopyData }) {
  return (
    <div>
      <DocumentHeader />
      <div className="flex w-full justify-between gap-8 border-b border-muted-foreground p-4">
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Vendor</p>
            <h2 className="text-lg font-bold">{order.supplierName}</h2>
          </div>
          <div className="max-w-[105mm] text-xs leading-normal text-gray-700">
            {order.supplierAddress && <p className="whitespace-pre-line">{order.supplierAddress}</p>}
            {(order.supplierEmail || order.supplierPhone) && (
              <p>{[order.supplierEmail, order.supplierPhone].filter(Boolean).join(" • ")}</p>
            )}
            <p>GSTIN: {order.supplierGstin || "-"}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <h1 className="text-3xl font-semibold uppercase tracking-tighter text-background">Purchase Order</h1>
          <p className="mt-2 font-medium">{order.number}</p>
          <p>{format(new Date(order.orderDate), "PPP")}</p>
        </div>
      </div>
    </div>
  );
}

function OrderItems({
  items,
  startIndex,
}: {
  items: PurchaseOrderCopyData["items"];
  startIndex: number;
}) {
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr className="bg-background text-left text-white">
          <th className="w-8 px-2 py-3">#</th>
          <th className="px-2 py-3">Material / Description</th>
          <th className="px-2 py-3 text-center">HSN</th>
          <th className="px-2 py-3 text-right">Qty</th>
          <th className="px-2 py-3 text-right">Rate</th>
          <th className="px-2 py-3 text-right">Disc.</th>
          <th className="px-2 py-3 text-right">GST</th>
          <th className="px-2 py-3 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id} className="break-inside-avoid border-b align-top">
            <td className="px-2 py-3 font-medium">{startIndex + index + 1}</td>
            <td className="px-2 py-3">
              <p className="font-semibold">{item.title}</p>
              {(item.supplierItemName || item.itemCode) && (
                <p className="text-gray-600">{[item.supplierItemName, item.itemCode].filter(Boolean).join(" • ")}</p>
              )}
              {item.remarks && <p className="mt-1 text-gray-600">{item.remarks}</p>}
            </td>
            <td className="px-2 py-3 text-center">{item.hsnCode || "-"}</td>
            <td className="whitespace-nowrap px-2 py-3 text-right">{item.qty} {item.unit}</td>
            <td className="whitespace-nowrap px-2 py-3 text-right">{money(item.unitPrice)}</td>
            <td className="px-2 py-3 text-right">{item.discountPercent}%</td>
            <td className="px-2 py-3 text-right">{item.gstPercent}%</td>
            <td className="whitespace-nowrap px-2 py-3 text-right font-semibold">{money(item.lineTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OrderSummary({ order }: { order: PurchaseOrderCopyData }) {
  return (
    <div className="mt-6 text-xs">
      <div className="ml-auto w-[78mm] space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>- {money(order.discountTotal)}</span></div>
        <div className="flex justify-between"><span>Taxable amount</span><span>{money(order.taxableTotal)}</span></div>
        <div className="flex justify-between"><span>GST</span><span>{money(order.gstTotal)}</span></div>
        <div className="flex justify-between"><span>Freight</span><span>{money(order.shippingAmount)}</span></div>
        <div className="flex justify-between border-y-2 border-gray-800 py-2 text-sm font-bold"><span>Grand Total</span><span>{money(order.grandTotal)}</span></div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-8 leading-relaxed">
        <div>
          <p className="font-semibold">Ship to</p>
          <p className="whitespace-pre-wrap">{order.shippingAddress || "-"}</p>
          {order.remarks && <><p className="mt-4 font-semibold">Remarks</p><p className="whitespace-pre-wrap">{order.remarks}</p></>}
        </div>
        <div>
          <p><span className="font-semibold">Expected delivery:</span> {order.expectedDate ? format(new Date(order.expectedDate), "PPP") : "-"}</p>
          <p><span className="font-semibold">Payment terms:</span> {order.paymentTerms || "-"}</p>
          <p><span className="font-semibold">Delivery terms:</span> {order.deliveryTerms || "-"}</p>
          <p className="mt-4 font-semibold">Terms & conditions</p>
          <p className="whitespace-pre-wrap">{order.terms || "-"}</p>
        </div>
      </div>
      <div className="mt-16 flex justify-end">
        <div className="w-64 border-t border-gray-700 pt-2 text-center font-semibold">Authorised Signatory</div>
      </div>
    </div>
  );
}

export default function PurchaseOrderCustomerCopy({ order }: { order: PurchaseOrderCopyData }) {
  const [perPage, setPerPage] = React.useState([order.items.length]);
  const pages = React.useMemo(() => perPage.map((count, index) => {
    const offset = perPage.slice(0, index).reduce((total, amount) => total + amount, 0);
    return order.items.slice(offset, offset + count);
  }), [order.items, perPage]);

  const moveOneItemToNextPage = (pageIndex: number) => {
    setPerPage((previous) => {
      const next = [...previous];
      if (!next[pageIndex] || next[pageIndex] <= 1) return previous;
      next[pageIndex] -= 1;
      next[pageIndex + 1] = (next[pageIndex + 1] ?? 0) + 1;
      return next.filter((count) => count > 0);
    });
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Purchase Order-${order.number} - ${order.supplierName}`;
    window.print();
    window.setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  return (
    <>
      <Button onClick={handlePrint} className="fixed right-6 top-6 print:hidden">Print / Save PDF</Button>
      <div className="relative flex flex-col items-center gap-4 print:block print:gap-0">
        {pages.map((items, pageIndex) => {
          const startIndex = perPage.slice(0, pageIndex).reduce((total, amount) => total + amount, 0);
          const isLastPage = pageIndex === pages.length - 1;
          return (
            <A4Page
              key={pageIndex}
              onResize={() => moveOneItemToNextPage(pageIndex)}
              heading={pageIndex === 0 ? <PurchaseOrderHeader order={order} /> : <DocumentHeaderSmall />}
              table={
                <div className="relative z-10">
                  <OrderItems items={items} startIndex={startIndex} />
                  {isLastPage && <OrderSummary order={order} />}
                </div>
              }
              footer={<DocumentFooter pageIndex={pageIndex + 1} totalLength={pages.length} />}
            />
          );
        })}
      </div>
    </>
  );
}
