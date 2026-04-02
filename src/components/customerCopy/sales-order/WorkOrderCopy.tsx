"use client";

import { Button } from "@/components/ui/button";
import { GetQuotationByIdData } from "@/lib/types/QuotationTypes";
import { GetSalesOrderByIdData } from "@/lib/types/SalesOrderTypes";
import { Customer } from "@prisma/client";
import { FC, useMemo, useRef, useState } from "react";
import A4Page from "../A4Page";
import WorkOrderHeader from "./WorkOrderHeader";
import DocumentHeaderSmall from "../DocumentHeaderSmall";
import { getClientCode } from "@/lib/helpers/NameHelpers/clientCodeHelpers";
import WorkOrderItemTable from "./WorkOrderItemTable";
import DocumentFooter from "../DocumentFooter";
import PdfPreviewCard from "@/components/dashboard/global/PDFPreviewCard";
import {
  formatDocumentSerial,
  formatFinancialDocumentNumber,
} from "@/lib/helpers/globalHelpers/financialYear";
import type { ClientSafe } from "@/lib/helpers/server/serializeForClient";

interface WorkOrderCopyProps {
  order: ClientSafe<GetSalesOrderByIdData>;
  items: ClientSafe<GetSalesOrderByIdData>["items"];
}

const WorkOrderCopy: FC<WorkOrderCopyProps> = ({ order, items }) => {
  const [perPage, setPerPage] = useState([items.length]);

  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() => {
    return perPage.map((amount, i) => {
      const offset = perPage
        .slice(0, i)
        .reduce((total, amount) => total + amount, 0);

      return items.slice(offset, offset + amount);
    });
  }, [perPage, items]);

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

  const customerDetails: Partial<Customer> & {
    clientName?: string;
    orderNumber: string;
    orderFy: string;
  } = {
    clientName: getClientCode(order.customer?.companyName) ?? "",
    createdAt: order.createdAt,
    orderNumber: formatDocumentSerial(order.orderNo),
    orderFy: order.orderFy,
  };

  const handlePrint = () => {
    const originalTitle = document.title;

    document.title = `Quotation-${formatFinancialDocumentNumber(order.orderFy, order.orderNo)} - ${order.customer?.companyName}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handlePrintPdf = (pdfUrl: string, fileTitle?: string | null) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";

    iframe.src = pdfUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        const originalTitle = document.title;

        if (fileTitle) {
          document.title = fileTitle;
        }

        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
        }, 1500);
      } catch (error) {
        console.error("Failed to print PDF:", error);
        document.body.removeChild(iframe);
      }
    };
  };
  const drawingPages = useMemo(() => {
    const drawings = items.flatMap((item, itemIndex) => {
      const productName = item.product?.name ?? "Product";
      const variantName = item.variant?.variant ?? "";
      const label = [productName, variantName].filter(Boolean).join(" - ");

      return ((item.variant?.drawings as []) ?? []).map(
        (drawing: { url: string; title: string }, drawingIndex) => ({
          id: `${item.id}-${drawing.url}-${drawingIndex}`,
          url: drawing.url,
          title: drawing.title ?? `${label} Drawing ${drawingIndex + 1}`,
          itemLabel: label,
        }),
      );
    });

    // remove duplicates by url
    const unique = drawings.filter(
      (drawing, index, arr) =>
        arr.findIndex((x) => x.url === drawing.url) === index,
    );

    return unique;
  }, [items]);

  console.log(drawingPages);

  const totalPages = pages.length + drawingPages.length;

  return (
    <>
      <Button
        onClick={handlePrint}
        className="print:hidden fixed top-6 right-6 ">
        Print / Save PDF
      </Button>
      <div
        className="relative flex flex-col items-center gap-4 print:gap-0 print:block"
        ref={containerRef}>
        {pages.map((group, index, list) => {
          const currentPage = index + 1;

          const pageItemStartIndex = perPage
            .slice(0, index)
            .reduce((total, amount) => total + amount, 0);

          return (
            <A4Page
              key={index}
              onResize={() => moveOneItemToNextPage(index)}
              heading={
                index === 0 ? (
                  <WorkOrderHeader
                    customerDetails={customerDetails}></WorkOrderHeader>
                ) : (
                  <DocumentHeaderSmall></DocumentHeaderSmall>
                )
              }
              table={
                <WorkOrderItemTable
                  pageItemsStartIndex={pageItemStartIndex}
                  items={group}></WorkOrderItemTable>
              }
              footer={
                <DocumentFooter
                  pageIndex={currentPage}
                  totalLength={totalPages}></DocumentFooter>
              }></A4Page>
          );
        })}

        {drawingPages.map((drawing, index) => {
          const currentPage = pages.length + index + 1;

          return (
            <div
              key={drawing.id}
              className="w-full max-w-[210mm] print-page-drawing print:break-before-page print:hidden">
              <PdfPreviewCard
                url={drawing.url}
                title={`${drawing.title} • Page ${currentPage} / ${totalPages}`}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default WorkOrderCopy;
