"use client";

import { FC } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import DocumentHeader from "@/components/customerCopy/DocumentHeader";
import DocumentFooter from "@/components/customerCopy/DocumentFooter";
import DocumentHeaderSmall from "@/components/customerCopy/DocumentHeaderSmall";
import {
  formatDocumentSerial,
  formatPrefixedFinancialDocumentNumber,
} from "@/lib/helpers/globalHelpers/financialYear";

type TestCertificateItem = {
  id: string;
  title: string;
  sku?: string | null;
  typeNumber?: string | null;
  hsnCode?: string | null;
  unit?: string | null;
  invoiceQty: number;
  cimfrNumber?: string | null;
  serialNumber?: string | null;
};

type InvoiceMeta = {
  invoiceNo: number;
  invoiceFy: string;
  invoiceDate?: string | Date | null;
  poNumber?: string | null;
  poDate?: string | Date | null;
  companyName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  gstin?: string | null;
};

interface InvoiceTestCertificateCopyProps {
  invoice: InvoiceMeta;
  items: TestCertificateItem[];
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

const TEST_ROWS = [
  {
    nature: "Routine Static Pressure Test",
    parameter:
      "No Leakage / Deformation found (As per IS/IEC 60079-1) Hydraulic test",
    result:
      "Withstood applied pressure without any deformation and leakage of water.",
  },
  {
    nature: "Visual Check",
    parameter: "As per standard practice",
    result: "Found in Order.",
  },
  {
    nature: "Dimensional and flamepath check",
    parameter: "As per drawing",
    result: "Found in Order.",
  },
  {
    nature: "Finish and Assembly",
    parameter: "As per drawing",
    result: "Found in Order.",
  },
  {
    nature: "Thread check by 'Go' Gauge",
    parameter: "Gland shall pass through 'Go' Gauge",
    result: "Found in Order.",
  },
  {
    nature: "Thread check by 'No-Go' Gauge",
    parameter: "Gland shall not pass through 'No-Go' Gauge",
    result: "Found in Order.",
  },
  {
    nature: "Marking plate / Tag Plate",
    parameter: "As per drawing",
    result: "Found in Order.",
  },
  {
    nature: "High voltage check",
    parameter: "Item shall withstand 2kV for 60 seconds",
    result: "Found in Order.",
  },
  {
    nature: "Finish (Paint Shade)",
    parameter: "As per drawing",
    result: "Found in Order.",
  },
  {
    nature: "Continuity / Operational Check",
    parameter: "As per drawing",
    result: "Found in Order.",
  },
  {
    nature: "Insulation resistance before/after HV test",
    parameter: "> 20 Mega Ohm",
    result: "> 100 Mega Ohm",
  },
];

function buildAddressLines(invoice: InvoiceMeta) {
  const location = [invoice.city, invoice.state, invoice.country]
    .filter(Boolean)
    .join(", ");

  return [
    invoice.addressLine1 || null,
    invoice.addressLine2 || null,
    location || null,
    invoice.pincode ? `PIN: ${invoice.pincode}` : null,
    invoice.gstin ? `GSTIN: ${invoice.gstin}` : null,
  ].filter((line): line is string => Boolean(line));
}

const InvoiceTestCertificateCopy: FC<InvoiceTestCertificateCopyProps> = ({
  invoice,
  items,
}) => {
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Test-Certificate-${formatPrefixedFinancialDocumentNumber("", invoice.invoiceFy, invoice.invoiceNo)}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const addressLines = buildAddressLines(invoice);

  return (
    <>
      <Button
        onClick={handlePrint}
        className="print:hidden fixed top-6 right-6">
        Print / Save PDF
      </Button>

      <div className="flex flex-col gap-4 print:gap-0 relative items-center">
        {items.length === 0 ? (
          <div className="w-[210mm] min-h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-8">
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No items selected for test certificate.
            </div>
          </div>
        ) : (
          items.map((item, index) => {
            const totalPages = items.length * 2;
            const pageOneNumber = index * 2 + 1;
            const pageTwoNumber = index * 2 + 2;
            const tcNo = `ExTC ${invoice.invoiceFy}/${formatDocumentSerial(invoice.invoiceNo)}-${index + 1}`;

            return (
              <div key={item.id} className="contents">
                <div
                  data-a4-page
                  className="w-[210mm] min-h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col">
                  <DocumentHeader />

                  <div className="flex-1 p-4 space-y-4">
                    <div className="grid gap-2  p-3 text-sm md:grid-cols-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xl">
                          {invoice.companyName || "-"}
                        </div>
                        {addressLines.map((line) => (
                          <div
                            key={line}
                            className="whitespace-normal text-wrap text-xs">
                            {line}
                          </div>
                        ))}
                      </div>

                      <div className=" text-right">
                        <div className="text-3xl uppercase tracking-tighter">
                          TEST CERTIFICATE
                        </div>
                        <div>{fmtDate(invoice.invoiceDate)}</div>
                        <div className="font-medium">TC no. {tcNo}</div>
                        <div>PO Number: {invoice.poNumber || "VERBAL"}</div>
                        <div>PO Date: {fmtDate(invoice.poDate)}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="">
                      <Table className="table-fixed ">
                        <TableHeader>
                          <TableRow className="border-muted-foreground!">
                            <TableHead className="w-[45px]">#</TableHead>
                            <TableHead>Items Ordered</TableHead>
                            <TableHead className="text-right">
                              Quantity
                            </TableHead>
                            <TableHead className="text-right">
                              Supplied Quantity
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>1</TableCell>
                            <TableCell className="whitespace-normal text-wrap">
                              <div className="font-medium leading-tight">
                                {item.title}
                              </div>
                              <div className="text-xs  leading-tight">
                                {[item.sku, item.typeNumber]
                                  .filter(Boolean)
                                  .join(" - ") || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.invoiceQty} {item.unit || ""}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.invoiceQty} {item.unit || ""}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <Separator className=" w-full"></Separator>
                    </div>
                  </div>

                  <DocumentFooter
                    pageIndex={pageOneNumber}
                    totalLength={totalPages}
                  />
                </div>

                <div
                  data-a4-page
                  className="w-[210mm] min-h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex flex-col">
                  <DocumentHeaderSmall />
                  <div className="p-4 space-y-2 flex-1">
                    <div className="grid gap-2 rounded-lg  p-3 text-sm md:grid-cols-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-xl">
                          {invoice.companyName || "-"}
                        </div>
                        {addressLines.map((line) => (
                          <div
                            key={line}
                            className="whitespace-normal text-wrap text-xs">
                            {line}
                          </div>
                        ))}
                      </div>

                      <div className="text-right">
                        <div className="text-2xl  uppercase tracking-wide">
                          TEST CERTIFICATE
                        </div>
                        <div>{fmtDate(invoice.invoiceDate)}</div>
                        <div className="font-medium">TC no. {tcNo}</div>
                        <div>PO Number: {invoice.poNumber || "VERBAL"}</div>
                        <div>PO Date: {fmtDate(invoice.poDate)}</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-xs leading-tight text-center flex flex-col gap-2">
                      <p>
                        This is to certify that the following inspections and
                        tests were carried out as per relevant Indian Standards.
                      </p>
                      <p className="font-semibold">
                        This certificate shall be valid only in original and for
                        the above quantity and reference project.
                      </p>
                      <p>
                        All tests were found satisfactory and clear for
                        dispatch.
                      </p>
                    </div>
                    <Separator />

                    <div className="r">
                      <Table className="table-fixed  ">
                        <TableHeader>
                          <TableRow className="border-muted-foreground!">
                            <TableHead className="w-4 py-1">#</TableHead>
                            <TableHead className="w-[170px] py-1">
                              Nature of Test
                            </TableHead>
                            <TableHead className="w-[180px] py-1">
                              Test Parameters
                            </TableHead>
                            <TableHead className="w-[120px] py-1">
                              Result
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {TEST_ROWS.map((row, rowIndex) => (
                            <TableRow key={row.nature}>
                              <TableCell className="py-1 align-top">
                                {rowIndex + 1}
                              </TableCell>
                              <TableCell className="py-1 align-top whitespace-normal text-wrap">
                                {row.nature}
                              </TableCell>
                              <TableCell className="py-1 align-top whitespace-normal text-wrap">
                                {row.parameter}
                              </TableCell>
                              <TableCell className="py-1 align-top whitespace-normal text-wrap">
                                {row.result}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Separator className=" w-full"></Separator>
                    </div>
                  </div>

                  <div className="m-4 border-t w-fit ml-auto text-right  ">
                    For Explosion Proof Electrical Control
                  </div>
                  <DocumentFooter
                    pageIndex={pageTwoNumber}
                    totalLength={totalPages}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default InvoiceTestCertificateCopy;
