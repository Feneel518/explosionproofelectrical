"use client";

import { FC, useMemo, useRef, useState } from "react";

import A4Page from "@/components/customerCopy/A4Page";
import DocumentFooter from "@/components/customerCopy/DocumentFooter";
import DocumentHeader from "@/components/customerCopy/DocumentHeader";
import DocumentHeaderSmall from "@/components/customerCopy/DocumentHeaderSmall";
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

type GrnItemView = {
  id: string;
  title: string;
  supplierItemName?: string | null;
  sku?: string | null;
  hsnCode?: string | null;
  unit?: string | null;
  qty: number;
  unitCost?: number | string | null;
  lineTotal?: number | string | null;
};

type GrnView = {
  id: string;
  grnNo: number;
  grnFy: string;
  status: string;
  receivedAt?: string | Date | null;
  supplierNameSnapshot?: string | null;
  supplierInvoiceNo?: string | null;
  supplierInvoiceDate?: string | Date | null;
  transporterName?: string | null;
  lrNumber?: string | null;
  remarks?: string | null;
  materialCheckStatus?: string | null;
  quantityCheckStatus?: string | null;
  discrepancyAction?: string | null;
  checkNotes?: string | null;
  items: GrnItemView[];
};

interface GrnCustomerCopyProps {
  grn: GrnView;
}

function fmtDate(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function fmtMoney(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeLabel(value?: string | null) {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

const GrnCustomerCopy: FC<GrnCustomerCopyProps> = ({ grn }) => {
  const [perPage, setPerPage] = useState([grn.items.length]);
  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() => {
    return perPage.map((amount, index) => {
      const offset = perPage
        .slice(0, index)
        .reduce((sum, count) => sum + count, 0);
      return grn.items.slice(offset, offset + amount);
    });
  }, [grn.items, perPage]);

  const moveOneItemToNextPage = (pageIndex: number) => {
    setPerPage((prev) => {
      const next = [...prev];
      if (!next[pageIndex] || next[pageIndex] <= 1) return prev;
      next[pageIndex] -= 1;
      next[pageIndex + 1] = (next[pageIndex + 1] ?? 0) + 1;
      return next.filter((count) => count > 0);
    });
  };

  const totalQty = grn.items.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0,
  );
  const totalValue = grn.items.reduce(
    (sum, item) =>
      sum +
      Number(
        item.lineTotal ?? Number(item.qty || 0) * Number(item.unitCost || 0),
      ),
    0,
  );

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `GRN-${formatFinancialDocumentNumber(grn.grnFy, grn.grnNo)}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 800);
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
        {pages.map((group, pageIndex) => {
          const currentPage = pageIndex + 1;
          const totalPages = pages.length;
          const pageItemStartIndex = perPage
            .slice(0, pageIndex)
            .reduce((sum, count) => sum + count, 0);

          return (
            <A4Page
              key={pageIndex}
              onResize={() => moveOneItemToNextPage(pageIndex)}
              heading={
                pageIndex === 0 ? (
                  <div>
                    <DocumentHeader />
                    <div className="border-b border-muted-foreground p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-3xl font-semibold">
                            GOODS RECEIPT NOTE
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatFinancialDocumentNumber(
                              grn.grnFy,
                              grn.grnNo,
                            )}
                          </div>
                          <div className="text-xs">
                            Date: {fmtDate(grn.receivedAt)}
                          </div>
                          <div className="text-xs">Status: {grn.status}</div>
                        </div>
                      </div>

                      <div className="grid gap-2 text-xs md:grid-cols-2">
                        <div>Supplier: {grn.supplierNameSnapshot || "-"}</div>
                        <div className="text-right">
                          Supplier Invoice: {grn.supplierInvoiceNo || "-"}
                        </div>
                        <div>
                          Supplier Invoice Date:{" "}
                          {fmtDate(grn.supplierInvoiceDate)}
                        </div>
                        <div className="text-right">
                          Transporter: {grn.transporterName || "-"}
                        </div>
                        <div>LR Number: {grn.lrNumber || "-"}</div>
                        <div className="text-right">
                          Material Check:{" "}
                          {normalizeLabel(grn.materialCheckStatus)}
                        </div>
                        <div>
                          Quantity Check:{" "}
                          {normalizeLabel(grn.quantityCheckStatus)}
                        </div>
                        <div className="text-right">
                          Action: {normalizeLabel(grn.discrepancyAction)}
                        </div>
                      </div>
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
                        <TableHead className="w-11">#</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {pageItemStartIndex + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs">
                              {[item.sku, item.hsnCode]
                                .filter(Boolean)
                                .join(" • ") || "-"}
                            </div>
                            {item.supplierItemName ? (
                              <div className="text-xs">
                                Supplier Name: {item.supplierItemName}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.qty} {item.unit || ""}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtMoney(item.unitCost)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtMoney(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pageIndex === pages.length - 1 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded border p-3 text-xs">
                        <div className="font-semibold">Remarks</div>
                        <div className="mt-1 whitespace-pre-wrap">
                          {grn.remarks || "-"}
                        </div>
                        <div className="mt-3 font-semibold">Check Notes</div>
                        <div className="mt-1 whitespace-pre-wrap">
                          {grn.checkNotes || "-"}
                        </div>
                      </div>

                      <div className="ml-auto w-full max-w-sm space-y-1 border-t pt-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Total Items</span>
                          <span>{grn.items.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Total Quantity</span>
                          <span>{totalQty}</span>
                        </div>
                        <div className="flex items-center justify-between font-semibold">
                          <span>Total Value</span>
                          <span>{fmtMoney(totalValue)}</span>
                        </div>
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

export default GrnCustomerCopy;
