import type { GetSalesOrderByIdData } from "@/lib/types/SalesOrderTypes";
import type { ClientSafe } from "@/lib/helpers/server/serializeForClient";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { formatCurrencyINR } from "@/lib/helpers/globalHelpers/formatCurrency";
import { documentItemTitle } from "@/lib/products/catalogNames";
import DocumentHeader from "../DocumentHeader";
import SalesOrderPrintControls from "./SalesOrderPrintControls";

function dateLabel(value: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  }).format(date);
}

function termLabel(value: string) { return value.replaceAll("_", " "); }

export default function SalesOrderCustomerCopy({ order, autoPrint = false }: {
  order: ClientSafe<GetSalesOrderByIdData>;
  autoPrint?: boolean;
}) {
  const orderLabel = formatFinancialDocumentNumber(order.orderFy, order.orderNo);
  const clientName = order.clientNameSnapshot || order.customer?.companyName || order.clientName || order.receivedFromName || "Unknown Client";
  const city = order.citySnapshot || order.customer?.city;
  const state = order.stateSnapshot || order.customer?.state;
  const gstin = order.gstinSnapshot || order.customer?.gstin;
  const totals = [
    { label: "Subtotal", amount: order.subtotal },
    { label: "Discount", amount: order.discountTotal },
    { label: "Taxable Total", amount: order.taxableTotal },
    { label: "GST", amount: order.gstTotal },
  ];

  return (
    <div data-sales-order-copy>
      <SalesOrderPrintControls orderId={order.id} autoPrint={autoPrint} title={`Sales Order-${orderLabel} - ${clientName}`} />
      <article className="sales-order-document mx-auto mb-8 max-w-[210mm] bg-white text-black shadow-lg print:m-0 print:max-w-none print:shadow-none">
        <DocumentHeader />
        <div className="p-6 print:p-0">
          <div className="mb-5 grid grid-cols-2 gap-4 border-b border-black/30 pb-4">
            <div className="min-w-0 space-y-1 break-words">
              <p className="text-xs uppercase">Customer</p>
              <h2 className="text-lg font-semibold">{clientName}</h2>
              <p className="text-sm">{[city, state].filter(Boolean).join(", ")}</p>
              {gstin ? <p className="text-sm">GSTIN: {gstin}</p> : null}
              {order.receivedFromName ? <p className="text-sm">Contact: {order.receivedFromName}</p> : null}
            </div>
            <div className="min-w-0 space-y-1 text-right text-sm break-words">
              <h1 className="text-2xl font-bold uppercase">Sales Order</h1>
              <p className="font-semibold">{orderLabel}</p>
              <p>Order Date: {dateLabel(order.orderDate || order.createdAt)}</p>
              <p>Status: {termLabel(order.status)}</p>
              {order.poNumber ? <p>PO: {order.poNumber}</p> : null}
              {order.poDate ? <p>PO Date: {dateLabel(order.poDate)}</p> : null}
            </div>
          </div>
          <table className="w-full table-fixed border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-[5%] border border-black/40 p-2 text-left">#</th>
                <th className="w-[45%] border border-black/40 p-2 text-left">Item / Description</th>
                <th className="w-[15%] border border-black/40 p-2 text-right">Ordered Qty</th>
                <th className="w-[17%] border border-black/40 p-2 text-right">Rate</th>
                <th className="w-[18%] border border-black/40 p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-black/40 p-2 align-top">{index + 1}</td>
                  <td className="border border-black/40 p-2 align-top">
                    <p className="font-semibold">{documentItemTitle(item)}</p>
                    {item.description ? <p className="mt-1 whitespace-pre-wrap">{item.description}</p> : null}
                    {item.sku ? <p>SKU: {item.sku}</p> : null}
                    {item.typeNumber ? <p>Type: {item.typeNumber}</p> : null}
                    {item.hsnCode ? <p>HSN: {item.hsnCode}</p> : null}
                    {item.poReference ? <p>PO Reference: {item.poReference}</p> : null}
                    {item.ComponentsOfProductInSalesOrder.length ? <p className="mt-1">Components: {item.ComponentsOfProductInSalesOrder.map((component) => [component.item, component.qty, component.unit].filter(Boolean).join(" ")).join(", ")}</p> : null}
                  </td>
                  <td className="border border-black/40 p-2 text-right align-top">{item.qty} {item.unit}</td>
                  <td className="border border-black/40 p-2 text-right align-top">{formatCurrencyINR(Number(item.unitPrice))}</td>
                  <td className="border border-black/40 p-2 text-right align-top">{formatCurrencyINR(Number(item.lineSubtotal))}</td>
                </tr>
              ))}
              {!order.items.length ? <tr><td colSpan={5} className="border border-black/40 p-4 text-center">No items in this order.</td></tr> : null}
            </tbody>
          </table>
          <div className="my-5 ml-auto w-full max-w-xs space-y-1 text-sm [break-inside:avoid]">
            {totals.map(({ label, amount }) => <div key={label} className="flex justify-between gap-4"><span>{label}</span><span>{formatCurrencyINR(Number(amount))}</span></div>)}
            <div className="flex justify-between gap-4 border-t border-black pt-2 font-bold"><span>Grand Total</span><span>{formatCurrencyINR(Number(order.grandTotal))}</span></div>
          </div>
          <div className="space-y-1 border-t border-black/30 pt-4 text-xs">
            <h2 className="mb-2 text-sm font-semibold">Commercial Terms</h2>
            <p>Delivery: {dateLabel(order.deliveryDate)}</p>
            <p>Payment: {termLabel(order.paymentTerms)}</p>
            <p>Packing: {termLabel(order.packingCharges)}</p>
            <p>Transportation: {termLabel(order.transportationPayment)}</p>
            <p>GST: {termLabel(order.gst)}</p>
            {order.discount ? <p>Discount: {order.discount}</p> : null}
            {order.additionalNotes ? <p className="mt-3 whitespace-pre-wrap">Notes: {order.additionalNotes}</p> : null}
          </div>
          <p className="mt-8 border-t border-black/30 pt-3 text-center text-xs">Explosion Proof Electrical · info@explosionproofelectrical.com</p>
        </div>
      </article>
    </div>
  );
}
