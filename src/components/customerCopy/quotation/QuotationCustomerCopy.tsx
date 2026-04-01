"use client";

import { Button } from "@/components/ui/button";
import { QUOTATION_TERMS_DATA } from "@/lib/constants/QuotationTermsData";
import { GetQuotationByIdData } from "@/lib/types/QuotationTypes";
import { Customer } from "@prisma/client";
import { FC, useMemo, useRef, useState } from "react";
import A4Page from "../A4Page";
import DocumentFooter from "../DocumentFooter";
import DocumentHeaderSmall from "../DocumentHeaderSmall";
import QuotationHeader from "./QuotationHeader";
import QuotationItemTable from "./QuotationItemTable";
import QuotationTermsShort from "./QuotationTermsShort";
import {
  formatDocumentSerial,
  formatFinancialDocumentNumber,
} from "@/lib/helpers/globalHelpers/financialYear";

interface QuotationCustomerCopyProps {
  quotation: GetQuotationByIdData;
}

const QuotationCustomerCopy: FC<QuotationCustomerCopyProps> = ({
  quotation,
}) => {
  const [perPage, setPerPage] = useState([quotation.items.length]);

  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() => {
    return perPage.map((amount, i) => {
      const offset = perPage
        .slice(0, i)
        .reduce((total, amount) => total + amount, 0);

      return quotation.items.slice(offset, offset + amount);
    });
  }, [perPage, quotation.items]);

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
    quotationNumber: string;
    quoteFy: string;
  } = {
    addressLine1: quotation.customer?.addressLine1,
    gstin: quotation.customer?.gstin,
    companyName: quotation.customer?.companyName,
    pincode: quotation.customer?.pincode,
    state: quotation.customer?.state,
    clientName: quotation.clientName ?? "",
    createdAt: quotation.createdAt,
    quotationNumber: formatDocumentSerial(quotation.quoteNo),
    quoteFy: quotation.quoteFy,
  };

  const handlePrint = () => {
    const originalTitle = document.title;

    document.title = `Quotation-${formatFinancialDocumentNumber(quotation.quoteFy, quotation.quoteNo)} - ${quotation.customer?.companyName}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <>
      <Button
        onClick={handlePrint}
        className="print:hidden fixed top-6 right-6 ">
        Print / Save PDF
      </Button>
      <div
        className="flex flex-col gap-4 print:gap-0 relative items-center "
        ref={containerRef}>
        {pages.map((group, index, list) => {
          const currentPage = index + 1;
          const totalPages = pages.length;

          const pageItemStartIndex = perPage
            .slice(0, index)
            .reduce((total, amount) => total + amount, 0);

          return (
            <A4Page
              key={index}
              onResize={() => moveOneItemToNextPage(index)}
              heading={
                index === 0 ? (
                  <QuotationHeader
                    customerDetails={customerDetails}></QuotationHeader>
                ) : (
                  <DocumentHeaderSmall></DocumentHeaderSmall>
                )
              }
              table={
                <QuotationItemTable
                  pageItemsStartIndex={pageItemStartIndex}
                  quotationItems={group}></QuotationItemTable>
              }
              footer={
                <DocumentFooter
                  pageIndex={currentPage}
                  totalLength={totalPages}></DocumentFooter>
              }></A4Page>
          );
        })}

        <div
          data-a4-page
          className="w-[210mm] h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col ">
          <DocumentHeaderSmall></DocumentHeaderSmall>
          <QuotationTermsShort
            gst={quotation.gst}
            discount={quotation.discount as string}
            packingCharges={quotation.packingCharges}
            transportation={quotation.transportationPayment}
            delivery={quotation.deliveryDate as string}
            payment={quotation.paymentTerms}
            footer={
              <DocumentFooter
                pageIndex={quotation.items.length + 1}
                totalLength={quotation.items.length + 2}></DocumentFooter>
            }></QuotationTermsShort>
        </div>
        <div
          data-a4-page
          className="w-[210mm] h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col ">
          <DocumentHeaderSmall></DocumentHeaderSmall>
          <div className="flex flex-col h-full">
            <div className="p-8 flex-1">
              {QUOTATION_TERMS_DATA.map((terms, index) => {
                return (
                  <div className="" key={index}>
                    <h1 className="font-bold">
                      {index + 6} {terms.section}:
                    </h1>
                    {terms.points.map((point, pointIndex) => {
                      return (
                        <p key={pointIndex}>
                          {index + 6}.{pointIndex + 1} {point}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <DocumentFooter
              pageIndex={quotation.items.length + 2}
              totalLength={quotation.items.length + 2}></DocumentFooter>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuotationCustomerCopy;
