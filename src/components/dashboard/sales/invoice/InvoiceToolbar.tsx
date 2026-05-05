"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebounce";
import {
  getFinancialYearLabelFromStartYear,
  getFinancialYearStartYear,
} from "@/lib/helpers/globalHelpers/financialYear";
import {
  invoiceParsers,
  InvoiceQP,
  INVOICE_SORTS,
  INVOICE_STATUSES,
} from "@/lib/searchParams/dashboard/sales/invoice/InvoiceSearchParams";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import React, { FC } from "react";

interface InvoiceToolbarProps {
  qp: InvoiceQP;
}

const FY_YEARS = Array.from(
  { length: 10 },
  (_, i) => getFinancialYearStartYear() - i,
);

const InvoiceToolbar: FC<InvoiceToolbarProps> = ({ qp }) => {
  const [state, setState] = useQueryStates(invoiceParsers, {
    shallow: false,
  });
  const [exportMonth, setExportMonth] = React.useState(
    new Date().toISOString().slice(0, 7),
  );

  const defaultYear = getFinancialYearStartYear();
  const defaultFy = getFinancialYearLabelFromStartYear(defaultYear);

  const selectedYear = state.year ?? defaultYear;
  const fy = getFinancialYearLabelFromStartYear(selectedYear);

  const [search, setSearch] = React.useState(state.q ?? "");
  const debouncedSearch = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({
      q: debouncedSearch,
      page: 1,
    });
  }, [debouncedSearch, setState]);

  React.useEffect(() => {
    if (state.fy !== fy) {
      setState({
        fy,
        page: 1,
      });
    }
  }, [fy, state.fy, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.fy !== defaultFy ? 1 : 0) +
    ((qp.year ?? defaultYear) !== defaultYear ? 1 : 0) +
    (qp.customerId ? 1 : 0) +
    (qp.salesOrderId ? 1 : 0) +
    (qp.dateFrom ? 1 : 0) +
    (qp.dateTo ? 1 : 0) +
    ((qp.sort ?? "createdAt") !== "createdAt" ? 1 : 0) +
    ((qp.dir ?? "desc") !== "desc" ? 1 : 0) +
    ((qp.pageSize ?? 10) !== 10 ? 1 : 0);

  const reset = () => {
    setState({
      q: "",
      status: "ALL",
      year: defaultYear,
      fy: defaultFy,
      customerId: "",
      salesOrderId: "",
      dateFrom: "",
      dateTo: "",
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: 10,
    });

    setSearch("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:items-center lg:grid-cols-4">
        <div>
          <h3>Search</h3>
          <Input
            className="max-md:col-span-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice no / client / PO no / GSTIN…"
          />
        </div>

        <div>
          <h3>Status</h3>
          <Select
            value={state.status ?? "ALL"}
            onValueChange={(v) =>
              setState({
                status: v as InvoiceQP["status"],
                page: 1,
              })
            }>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? "All Statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3>Year</h3>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => {
              const year = Number(v);
              setState({
                year,
                fy: getFinancialYearLabelFromStartYear(year),
                page: 1,
              });
            }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="FY Year" />
            </SelectTrigger>
            <SelectContent>
              {FY_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} ({getFinancialYearLabelFromStartYear(y)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3>Sort</h3>
          <Select
            value={`${state.sort ?? "createdAt"}:${state.dir ?? "desc"}`}
            onValueChange={(v) => {
              const [sort, dir] = v.split(":");
              setState({
                sort: sort as InvoiceQP["sort"],
                dir: dir as InvoiceQP["dir"],
                page: 1,
              });
            }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_SORTS.map((s) => (
                <React.Fragment key={s}>
                  <SelectItem value={`${s}:asc`}>
                    Sort:{" "}
                    {s === "createdAt"
                      ? "Created At"
                      : s === "invoiceDate"
                        ? "Invoice Date"
                        : s === "invoiceNo"
                          ? "Invoice Number"
                          : s === "grandTotal"
                            ? "Grand Total"
                            : s === "clientNameSnapshot"
                              ? "Client Name"
                              : s === "status"
                                ? "Status"
                                : s}{" "}
                    (asc)
                  </SelectItem>
                  <SelectItem value={`${s}:desc`}>
                    Sort:{" "}
                    {s === "createdAt"
                      ? "Created At"
                      : s === "invoiceDate"
                        ? "Invoice Date"
                        : s === "invoiceNo"
                          ? "Invoice Number"
                          : s === "grandTotal"
                            ? "Grand Total"
                            : s === "clientNameSnapshot"
                              ? "Client Name"
                              : s === "status"
                                ? "Status"
                                : s}{" "}
                    (desc)
                  </SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3>From Date</h3>
          <DatePicker
            value={state.dateFrom}
            onChange={(date) =>
              setState({
                dateFrom: date ?? "",
                page: 1,
              })
            }
            placeholder="From date"
          />
        </div>

        <div>
          <h3>To Date</h3>

          <DatePicker
            value={state.dateTo}
            onChange={(date) =>
              setState({
                dateTo: date ?? "",
                page: 1,
              })
            }
            placeholder="To date"
          />
        </div>

        {activeFilters > 0 ? (
          <Button variant="outline" className="mt-auto" onClick={reset}>
            <X className="mr-2 h-4 w-4" />
            Reset ({activeFilters})
          </Button>
        ) : (
          <div></div>
        )}

        <Button asChild className="mt-auto">
          <Link href="/dashboard/sales/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full max-w-xs">
          <h3>Export Month</h3>
          <MonthPicker
            value={exportMonth}
            onChange={(value) =>
              setExportMonth(value ?? new Date().toISOString().slice(0, 7))
            }
            placeholder="Select month"
          />
        </div>

        <Button asChild variant="outline">
          <Link href={`/dashboard/reports/lr-workbook?month=${exportMonth}`}>
            Export LR Workbook
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default InvoiceToolbar;
