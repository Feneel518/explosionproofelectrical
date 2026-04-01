"use client";

import DeliveryChallanAction from "@/components/dashboard/sales/delivery-challan/DeliveryChallanAction";
import DeliveryChallanToolbar from "@/components/dashboard/sales/delivery-challan/DeliveryChallanToolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deliveryChallanParsers,
  DeliveryChallanQP,
} from "@/lib/searchParams/dashboard/sales/delivery-challan/DeliveryChallanSearchParams";
import { formatFinancialDocumentNumber } from "@/lib/helpers/globalHelpers/financialYear";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import React from "react";

type DeliveryChallanListItem = {
  id: string;
  challanNo: number;
  challanFy: string;
  challanCode: string;
  type: string;
  status: string;
  partyType: string;
  date: Date;
  issuedAt: Date | null;
  closedAt: Date | null;
  expectedReturnDate: Date | null;
  poNumber: string | null;
  remarks: string | null;
  quotationId: string | null;
  quotation: {
    id: string;
    quoteNo: number;
    quoteFy: string;
    clientName: string | null;
  } | null;
  customerId: string | null;
  customer: {
    id: string;
    companyName: string;
  } | null;
  items: {
    id: string;
    qty: number;
    pendingQty: number;
    closedQty: number;
    title: string;
  }[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface DeliveryChallanTableProps {
  items: DeliveryChallanListItem[];
  total: number;
  page: number;
  pageSize: number;
  qp: DeliveryChallanQP;
}

export default function DeliveryChallanTable({
  items,
  total,
  page,
  pageSize,
  qp,
}: DeliveryChallanTableProps) {
  const [, setState] = useQueryStates(deliveryChallanParsers, {
    shallow: false,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  // local input state
  const [pageInput, setPageInput] = React.useState<string>(String(page));

  React.useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const commitPage = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setPageInput(String(page));
      return;
    }

    const next = clampPage(Math.trunc(n));
    setPageInput(String(next));

    if (next !== page) setState({ page: next });
  };

  return (
    <div className="space-y-4">
      <DeliveryChallanToolbar qp={qp} />

      <Card className="rounded-xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Challan</TableHead>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Customer</TableHead>

              <TableHead className="text-white">Items</TableHead>
              <TableHead className="w-[70px] text-white text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-muted-foreground">
                  No delivery challans found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/sales/delivery-challans/${item.id}`}
                      className="font-medium hover:underline">
                      {formatFinancialDocumentNumber(
                        item.challanFy,
                        item.challanNo,
                      )}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {item.challanCode}
                    </div>
                  </TableCell>

                  <TableCell>
                    {format(new Date(item.date), "dd MMM yyyy")}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        item.status === "CLOSED" ? "default" : "secondary"
                      }>
                      {item.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{item.customer?.companyName ?? "—"}</TableCell>

                  <TableCell>{item.items.length}</TableCell>

                  <TableCell className="text-right">
                    <DeliveryChallanAction
                      items={item.items}
                      id={item.id}
                      deletedAt={item.deletedAt}
                      status={item.status as any}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-start w-full justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, total)} of {total} challans
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!canPrev}
            onClick={() => setState({ page: page - 1 })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 rounded-lg border bg-background px-2 py-1">
            <span className="text-sm text-muted-foreground">Page</span>

            <div className="w-6">
              <Input
                className="border-none bg-transparent p-0 pl-2"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "");
                  setPageInput(v);
                }}
                onBlur={() => commitPage(pageInput)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitPage(pageInput);
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setPageInput(String(page));
                  }
                }}
                aria-label="Go to page"
              />
            </div>

            <span className="text-sm text-muted-foreground">
              / {totalPages}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => commitPage(pageInput)}
              className="h-8">
              Go
            </Button>
          </div>

          <Button
            variant="outline"
            disabled={!canNext}
            onClick={() => setState({ page: page + 1 })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
