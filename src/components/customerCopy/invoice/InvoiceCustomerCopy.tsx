"use client";

import { FC, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import A4Page from "@/components/customerCopy/A4Page";
import DocumentFooter from "@/components/customerCopy/DocumentFooter";
import DocumentHeader from "@/components/customerCopy/DocumentHeader";
import DocumentHeaderSmall from "@/components/customerCopy/DocumentHeaderSmall";
import { formatPrefixedFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

type InvoiceItemView = {
  id: string;
  title: string;
  description?: string | null;
  sku?: string | null;
  typeNumber?: string | null;
  unit?: string | null;
  invoiceQty: number;
  unitPrice: number;
  lineTotal: number;
};

type InvoiceView = {
  id: string;
  invoiceNo: number;
  invoiceFy: string;
  invoiceDate?: string | Date | null;
  dispatchDate?: string | Date | null;
  poNumber?: string | null;
  poDate?: string | Date | null;
  clientNameSnapshot?: string | null;
  companyNameSnapshot?: string | null;
  citySnapshot?: string | null;
  stateSnapshot?: string | null;
  gstinSnapshot?: string | null;
  transporterName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  lrNumber?: string | null;
  ewayBill?: string | null;
  remarks?: string | null;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  items: InvoiceItemView[];
};

interface InvoiceCustomerCopyProps {
  invoice: InvoiceView;
}

function fmtDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function fmtMoney(value?: number | string | null) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

const InvoiceCustomerCopy: FC<InvoiceCustomerCopyProps> = ({ invoice }) => {
  const [perPage, setPerPage] = useState([invoice.items.length]);
  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() => {
    return perPage.map((amount, i) => {
      const offset = perPage
        .slice(0, i)
        .reduce((total, current) => total + current, 0);

      return invoice.items.slice(offset, offset + amount);
    });
  }, [perPage, invoice.items]);

  const moveOneItemToNextPage = (pageIndex: number) => {
    setPerPage((prev) => {
      const next = [...prev];

      if (!next[pageIndex] || next[pageIndex] <= 1) {
        return prev;
      }

      next[pageIndex] -= 1;
      next[pageIndex + 1] = (next[pageIndex + 1] ?? 0) + 1;

      return next.filter((count) => count > 0);
    });
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Invoice-${formatPrefixedFinancialDocumentNumber("", invoice.invoiceFy, invoice.invoiceNo)}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <>
      <Button
        onClick={handlePrint}
        className="print:hidden fixed top-6 right-6">
        Print / Save PDF
      </Button>

      <div
        className="flex flex-col gap-4 print:gap-0 relative items-center"
        ref={containerRef}>
        {pages.map((group, index) => {
          const currentPage = index + 1;
          const totalPages = pages.length;
          const pageItemStartIndex = perPage
            .slice(0, index)
            .reduce((total, count) => total + count, 0);

          return (
            <A4Page
              key={index}
              onResize={() => moveOneItemToNextPage(index)}
              heading={
                index === 0 ? (
                  <div>
                    <DocumentHeader />
                    <div className="border-b border-muted-foreground p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="">
                          <h2 className="text-lg font-bold">
                            {invoice.companyNameSnapshot || "—"}
                          </h2>
                          <div className="">
                            {invoice.clientNameSnapshot || "—"}
                          </div>
                          <div className="text-xs">
                            {[invoice.citySnapshot, invoice.stateSnapshot]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </div>
                          <div className="text-xs">
                            GSTIN: {invoice.gstinSnapshot || "—"}
                          </div>
                        </div>

                        <div className=" text-right">
                          <div className="text-lg font-semibold">
                            {formatPrefixedFinancialDocumentNumber(
                              "ExIN-",
                              invoice.invoiceFy,
                              invoice.invoiceNo,
                            )}
                          </div>
                          <div className="text-xs">
                            Invoice Date: {fmtDate(invoice.invoiceDate)}
                          </div>
                          <div className="text-xs">
                            Dispatch Date: {fmtDate(invoice.dispatchDate)}
                          </div>
                          <div className="text-xs">
                            PO No: {invoice.poNumber || "—"}
                          </div>
                        </div>
                      </div>
                      {index === pages.length - 1 ? (
                        <div className="grid pt-3 text-xs  md:grid-cols-2 ">
                          <div>
                            Transporter: {invoice.transporterName || "—"}
                          </div>
                          <div className="text-right">
                            Vehicle: {invoice.vehicleNumber || "—"}
                          </div>
                          <div>Driver: {invoice.driverName || "—"}</div>
                          <div className="text-right">
                            Driver Phone: {invoice.driverPhone || "—"}
                          </div>
                          <div>LR No: {invoice.lrNumber || "—"}</div>
                          <div className="text-right">
                            E-Way Bill: {invoice.ewayBill || "—"}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <DocumentHeaderSmall />
                )
              }
              table={
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-muted-foreground!">
                        <TableHead className="w-[45px]">#</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {group.map((item, itemIndex) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {pageItemStartIndex + itemIndex + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs ">
                              {[item.sku, item.typeNumber]
                                .filter(Boolean)
                                .join(" • ") || "—"}
                            </div>
                            {item.description ? (
                              <div className="mt-1 text-xs ">
                                {item.description}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.invoiceQty} {item.unit || ""}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtMoney(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {index === pages.length - 1 ? (
                    <div className="ml-auto w-full max-w-sm space-y-1 border-t pt-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="">Subtotal</span>
                        <span>{fmtMoney(invoice.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="">GST</span>
                        <span>{fmtMoney(invoice.gstTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span>Grand Total</span>
                        <span>{fmtMoney(invoice.grandTotal)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              }
              footer={
                <DocumentFooter
                  pageIndex={currentPage}
                  totalLength={totalPages}
                />
              }
            />
          );
        })}
      </div>
    </>
  );
};

export default InvoiceCustomerCopy;
