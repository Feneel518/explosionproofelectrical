"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  orderParsers,
  OrderQP,
  ORDER_SORTS,
  SALES_ORDER_SOURCE_TYPES,
  SALES_ORDER_STATUSES,
  TrashFilter,
} from "@/lib/searchParams/dashboard/sales/order/OrderSearchParams";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useQueryStates } from "nuqs";
import React, { FC } from "react";

interface OrderToolbarProps {
  qp: OrderQP;
}

const FY_YEARS = Array.from(
  { length: 10 },
  (_, i) => getFinancialYearStartYear() - i,
);

const OrderToolbar: FC<OrderToolbarProps> = ({ qp }) => {
  const [state, setState] = useQueryStates(orderParsers, {
    shallow: false,
  });

  const defaultYear = getFinancialYearStartYear();
  const defaultFy = getFinancialYearLabelFromStartYear(defaultYear);

  const selectedYear = state.year ?? defaultYear;
  const fy = getFinancialYearLabelFromStartYear(selectedYear);

  const [search, setSearch] = React.useState(state.q ?? "");
  const debouncedSearch = useDebouncedValue(search, 500);

  React.useEffect(() => {
    setState({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, setState]);

  React.useEffect(() => {
    if (state.fy !== fy) {
      setState({ fy, page: 1 });
    }
  }, [fy, state.fy, setState]);

  const activeFilters =
    (qp.q ? 1 : 0) +
    (qp.status !== "ALL" ? 1 : 0) +
    (qp.sourceType !== "ALL" ? 1 : 0) +
    (qp.fy !== defaultFy ? 1 : 0) +
    (qp.year !== defaultYear ? 1 : 0) +
    (qp.customerId ? 1 : 0) +
    (qp.quotationId ? 1 : 0) +
    (qp.dateFrom ? 1 : 0) +
    (qp.dateTo ? 1 : 0) +
    (qp.trash !== "EXCLUDE" ? 1 : 0);

  const reset = () => {
    setState({
      q: "",
      status: "ALL",
      sourceType: "ALL",
      year: defaultYear,
      fy: defaultFy,
      customerId: "",
      quotationId: "",
      dateFrom: "",
      dateTo: "",
      trash: "EXCLUDE",
      sort: "createdAt",
      dir: "desc",
      page: 1,
    });
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-3 ">
      <div className="grid flex-wrap gap-3 grid-cols-2 lg:grid-cols-4 md:items-center">
        <div>
          <h3>Search</h3>
          <Input
            className=" max-md:col-span-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order no / client / PO no / email…"
          />
        </div>

        <div>
          <h3>Status</h3>
          <Select
            value={state.status ?? "ALL"}
            onValueChange={(v) => setState({ status: v as any, page: 1 })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {SALES_ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3>Source</h3>
          <Select
            value={state.sourceType ?? "ALL"}
            onValueChange={(v) => setState({ sourceType: v as any, page: 1 })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {SALES_ORDER_SOURCE_TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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
          <h3>Deleted</h3>
          <Select
            value={state.trash ?? "EXCLUDE"}
            onValueChange={(v) => setState({ trash: v as any, page: 1 })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Trash" />
            </SelectTrigger>
            <SelectContent>
              {TrashFilter.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
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
              setState({ sort: sort as any, dir: dir as any, page: 1 });
            }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_SORTS.map((s) => (
                <React.Fragment key={s}>
                  <SelectItem value={`${s}:asc`}>Sort: {s} (asc)</SelectItem>
                  <SelectItem value={`${s}:desc`}>Sort: {s} (desc)</SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilters > 0 && (
          <Button variant="outline" className="mt-auto" onClick={reset}>
            <X className="mr-2 h-4 w-4" />
            Reset ({activeFilters})
          </Button>
        )}

        <Button asChild variant="outline" className="mt-auto">
          <Link href="/dashboard/sales/orders/from-quotation">
            Create From Quotation
          </Link>
        </Button>

        <Button asChild className="mt-auto">
          <Link href="/dashboard/sales/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      <div className="flex gap-2"></div>
    </div>
  );
};

export default OrderToolbar;
