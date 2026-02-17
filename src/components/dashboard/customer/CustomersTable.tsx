"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";

// import CustomerActions from "./customer-actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  customersParsers,
  CustomersQP,
} from "@/lib/searchParams/dashboard/customers/customersSearchParams";
import CustomersToolbar from "./CustomersToolbar";
import CustomerActions from "./CustomerAction";
import React from "react";
import { Input } from "@/components/ui/input";

type Item = {
  id: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  city: string;
  state: string;
  gstin: string | null;
  status: "ACTIVE" | "INACTIVE";
  deletedAt: Date | null;
  createdAt: Date;
};

export default function CustomersTable({
  items,
  total,
  page,
  pageSize,
  qp,
}: {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  qp: CustomersQP;
}) {
  const [, setState] = useQueryStates(customersParsers, {
    shallow: false,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clampPage = (n: number) => Math.min(totalPages, Math.max(1, n));

  // local input state
  const [pageInput, setPageInput] = React.useState<string>(String(page));

  React.useEffect(() => {
    // keep in sync when arrows/filter changes page
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
      <CustomersToolbar qp={qp} />

      <div className="rounded-xl border bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/dashboard/customers/${c.id}`}>
                        {c.companyName}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.companyEmail ?? "-"}
                    </div>
                  </TableCell>
                  <TableCell>{c.companyPhone ?? "-"}</TableCell>
                  <TableCell>
                    {c.city}, {c.state}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.gstin ?? "-"}
                  </TableCell>
                  <TableCell>
                    {c.status === "ACTIVE" ? (
                      <Badge>ACTIVE</Badge>
                    ) : (
                      <Badge variant="secondary">INACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.deletedAt ? (
                      <Badge variant="destructive">YES</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <CustomerActions id={c.id} deletedAt={c.deletedAt} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{total}</span>
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
                className="bg-transparent  p-0 pl-2 border-none "
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageInput}
                onChange={(e) => {
                  // allow empty while typing; strip non-digits
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
