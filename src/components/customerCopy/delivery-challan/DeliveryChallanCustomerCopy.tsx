"use client";

import { Button } from "@/components/ui/button";

import {
  Customer,
  DeliveryChallanPartyType,
  DeliveryChallanStatus,
  DeliveryChallanType,
} from "@prisma/client";
import { FC, useMemo, useRef, useState } from "react";
import A4Page from "../A4Page";
import DocumentFooter from "../DocumentFooter";
import DocumentHeaderSmall from "../DocumentHeaderSmall";
import DeliveryChallanHeader from "./DeliveryChallanHeader";
import DeliveryChallanItemTable from "./DeliveryItemTable";
import DeliveryChallanFooter from "./DeliveryChallanFooter";
import {
  formatDocumentSerial,
  formatFinancialDocumentNumber,
} from "@/lib/helpers/globalHelpers/financialYear";

type DeliveryChallanItemView = {
  id: string;
  kind: string;
  productVariantId: string | null;
  title: string;
  sku: string | null;
  typeNumber: string | null;
  description: string | null;
  hsnCode: string | null;
  unit: string | null;
  qty: number;
  closedQty: number;
  pendingQty: number;
  sortOrder: number;
};

type DeliveryChallanView = {
  id: string;
  challanNo: number;
  challanFy: string;
  challanCode: string;

  status: DeliveryChallanStatus;
  type: DeliveryChallanType;
  partyType: DeliveryChallanPartyType;

  date: Date | string;
  issuedAt: Date | string | null;
  closedAt: Date | string | null;
  cancelledAt?: Date | string | null;

  expectedReturnDate: Date | string | null;
  expectedClosureDate: Date | string | null;

  poNumber: string | null;

  quotationId: string | null;
  quotation?: {
    id: string;
    quoteNo: number;
    quoteFy: string;
    clientName: string | null;
  } | null;

  customerId: string | null;
  customer?: {
    id: string;
    companyName: string;
    gstin?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
  } | null;

  transporterName: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  driverPhone: string | null;
  dispatchThrough: string | null;
  lrNumber: string | null;
  numberOfPackages: number | null;
  remarks: string | null;
  closureRemarks: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  items: DeliveryChallanItemView[];
};

interface DeliveryChallanCustomerCopyProps {
  challan: DeliveryChallanView;
}

const DeliveryChallanCustomerCopy: FC<DeliveryChallanCustomerCopyProps> = ({
  challan,
}) => {
  const [perPage, setPerPage] = useState([challan.items.length]);

  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() => {
    return perPage.map((amount, i) => {
      const offset = perPage
        .slice(0, i)
        .reduce((total, amount) => total + amount, 0);

      return challan.items.slice(offset, offset + amount);
    });
  }, [perPage, challan.items]);

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
    challanNumber: string;
    challanFy: string;
    type: DeliveryChallanType;
  } = {
    addressLine1: challan.customer?.addressLine1 ?? "",
    gstin: challan.customer?.gstin,
    companyName: challan.customer?.companyName,
    pincode: challan.customer?.pincode ?? "",
    state: challan.customer?.state ?? "",
    createdAt: (challan.createdAt as Date) ?? new Date(),
    challanNumber: formatDocumentSerial(challan.challanNo),
    challanFy: challan.challanFy,
    type: challan.type,
  };

  const handlePrint = () => {
    const originalTitle = document.title;

    document.title = `Challan-${formatFinancialDocumentNumber(challan.challanFy, challan.challanNo)} - ${challan.customer?.companyName}`;

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
                  <DeliveryChallanHeader
                    customerDetails={customerDetails}></DeliveryChallanHeader>
                ) : (
                  <DocumentHeaderSmall></DocumentHeaderSmall>
                )
              }
              table={
                <DeliveryChallanItemTable
                  pageItemsStartIndex={pageItemStartIndex}
                  quotationItems={group}></DeliveryChallanItemTable>
              }
              footer={
                <DeliveryChallanFooter
                  pageIndex={currentPage}
                  totalLength={totalPages}></DeliveryChallanFooter>
              }></A4Page>
          );
        })}

        {/* <div
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
        </div> */}
      </div>
    </>
  );
};

export default DeliveryChallanCustomerCopy;
