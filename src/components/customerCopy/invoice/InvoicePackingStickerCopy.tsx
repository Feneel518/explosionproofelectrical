"use client";

import { FC, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { formatPrefixedFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";

type PackingSticker = {
  id: string;
  packageNo: string;
  packageType?: string | null;
  label?: string | null;
  remarks?: string | null;
  grossWeight?: number | null;
  netWeight?: number | null;
  itemLines: string[];
};

type InvoiceStickerMeta = {
  invoiceNo: number;
  invoiceFy: string;
  clientName?: string | null;
  dispatchDate?: string | Date | null;
};

interface InvoicePackingStickerCopyProps {
  invoice: InvoiceStickerMeta;
  stickers: PackingSticker[];
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

const STICKERS_PER_PAGE = 10;

const InvoicePackingStickerCopy: FC<InvoicePackingStickerCopyProps> = ({
  invoice,
  stickers,
}) => {
  const pages = useMemo(() => {
    const list: PackingSticker[][] = [];
    for (let index = 0; index < stickers.length; index += STICKERS_PER_PAGE) {
      list.push(stickers.slice(index, index + STICKERS_PER_PAGE));
    }
    return list;
  }, [stickers]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Packing-Stickers-${formatPrefixedFinancialDocumentNumber("", invoice.invoiceFy, invoice.invoiceNo)}`;

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

      <div className="flex flex-col gap-4 print:gap-0 relative items-center">
        {pages.length === 0 ? (
          <div className="w-[210mm] min-h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-8">
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No stickers to print.
            </div>
          </div>
        ) : (
          pages.map((page, pageIndex) => {
            const pageNumber = pageIndex + 1;

            return (
              <div
                key={`sticker-page-${pageNumber}`}
                data-a4-page
                className="w-[210mm] h-[297mm] print:size-[A4] bg-white text-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] px-[10mm] py-[10mm]">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <div className="font-semibold">
                    Packing Stickers -{" "}
                    {formatPrefixedFinancialDocumentNumber(
                      "ExIN-",
                      invoice.invoiceFy,
                      invoice.invoiceNo,
                    )}
                  </div>
                  <div>
                    Page {pageNumber} / {pages.length} - 10 stickers/page
                  </div>
                </div>

                <div className="grid h-[calc(100%-18px)] grid-cols-2 grid-rows-5 gap-[3mm]">
                  {Array.from({ length: STICKERS_PER_PAGE }).map(
                    (_, slotIndex) => {
                      const sticker = page[slotIndex];

                      return (
                        <div
                          key={`sticker-${pageNumber}-${slotIndex}`}
                          className="rounded border border-black/60 p-2 text-[11px] leading-tight">
                          {sticker ? (
                            <div className="flex h-full flex-col gap-1">
                              <div className="text-[10px] font-semibold uppercase">
                                Explosion Proof Electrical Control
                              </div>

                              <div className="text-[10px]">
                                {formatPrefixedFinancialDocumentNumber(
                                  "ExIN-",
                                  invoice.invoiceFy,
                                  invoice.invoiceNo,
                                )}
                              </div>

                              <div className="text-[10px] font-semibold">
                                Package: {sticker.packageNo}
                              </div>

                              <div className="text-[10px]">
                                {[sticker.packageType, sticker.label]
                                  .filter(Boolean)
                                  .join(" - ") || "-"}
                              </div>

                              <div className="line-clamp-3 text-[10px]">
                                {sticker.itemLines.join(" | ")}
                              </div>

                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                <div>Gross: {sticker.grossWeight ?? "-"}</div>
                                <div className="text-right">
                                  Net: {sticker.netWeight ?? "-"}
                                </div>
                              </div>

                              <div className="mt-auto text-[10px]">
                                Client: {invoice.clientName || "-"}
                              </div>
                              <div className="text-[10px]">
                                Dispatch: {fmtDate(invoice.dispatchDate)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default InvoicePackingStickerCopy;
