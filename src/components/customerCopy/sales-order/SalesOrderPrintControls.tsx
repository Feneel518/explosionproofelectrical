"use client";

import { useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesOrderPrintControls({ autoPrint, title, orderId }: {
  autoPrint: boolean;
  title: string;
  orderId: string;
}) {
  const hasPrinted = useRef(false);

  useEffect(() => {
    document.title = title;
    if (!autoPrint || hasPrinted.current) return;
    let cancelled = false;
    async function printWhenReady() {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})));
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (cancelled || hasPrinted.current) return;
      hasPrinted.current = true;
      window.print();
    }
    void printWhenReady();
    return () => { cancelled = true; };
  }, [autoPrint, title]);

  return (
    <div className="mx-auto flex max-w-[210mm] flex-wrap justify-end gap-2 p-4 print:hidden">
      <Button variant="outline" asChild><a href={`/dashboard/sales/orders/${encodeURIComponent(orderId)}`}>Back to Sales Order</a></Button>
      <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print / Save PDF</Button>
    </div>
  );
}
