"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintSerialLabelsButton() {
  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      <Printer className="mr-2 size-4" /> Print labels
    </Button>
  );
}
